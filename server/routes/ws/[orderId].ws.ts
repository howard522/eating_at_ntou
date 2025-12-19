import ChatMessage from "$models/chatMessage.model";
import Order from "$models/order.model";
import { verifyJwt } from "$utils/auth";
import connectDB from "$utils/db";
import {
    chatRooms,
    driverLocations,
    broadcastToOrder,
    broadcastLocation,
    type Payload,
    type LocationPayload,
} from "$utils/wsContext";
import type { AdapterInternal, Peer } from "crossws";

/**
 * 聊天訊息的資料結構
 */
interface Message {
    _id?: string;
    sender: string; // 使用者 ID
    senderRole: "customer" | "delivery"; // 角色
    content: string; // 訊息內容
    timestamp?: Date; // 時間戳記
}

/**
 * 從 ws 的 URL 中取得 orderId
 *
 * @param url ws 的 URL
 * @returns orderId
 */
function getOrderIdFromURL(url?: string): string | null {
    // 取得 orderId: /ws/:orderId
    const match = url?.match(/\/ws\/([a-zA-Z0-9]{24})$/i);
    if (!match || !match[1]) return null;
    return match[1].toLowerCase();
}

function shortMessage(_type: string, _message: string): string {
    const msg: Payload = { type: _type, message: _message };
    return JSON.stringify(msg);
}

function isValidCoordinate(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function dispatchLocationUpdate(peer: Peer<AdapterInternal>, data: { lat: number; lng: number }) {
    const orderId = getOrderIdFromURL(peer.request.url)!;
    const ctx = chatRooms.get(orderId)?.get(peer.id);

    if (!ctx || ctx.role !== "delivery") {
        peer.send(shortMessage("error", "Only assigned delivery users can send location updates."));
        return;
    }

    if (!isValidCoordinate(data.lat) || !isValidCoordinate(data.lng)) {
        peer.send(shortMessage("error", "Invalid coordinates."));
        return;
    }

    const payload: LocationPayload = {
        sender: ctx.userId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
    };

    driverLocations.set(orderId, payload);
    broadcastLocation(orderId, payload);
}

function disconnectClient(peer: Peer<AdapterInternal>) {
    const orderId = getOrderIdFromURL(peer.request.url);

    if (orderId && chatRooms.has(orderId)) {
        const room = chatRooms.get(orderId)!;
        const ctx = room.get(peer.id)!;

        room.delete(peer.id);

        if (room.size === 0) {
            chatRooms.delete(orderId);
            driverLocations.delete(orderId);
            return;
        }

        const sendPayload: Payload = {
            type: "leave",
            data: {
                sender: ctx.userId,
                senderRole: ctx.role,
                content: `User ${ctx.userId} left the chat.`,
                timestamp: new Date(),
            },
        };
        broadcastToOrder(orderId, sendPayload);
    }
}

async function authorizeClient(peer: Peer<AdapterInternal>, data: Message) {
    // 驗證 JWT
    const payload = verifyJwt(data.content);
    if (!payload || !payload.id || payload.id !== data.sender) {
        peer.send(shortMessage("error", "Authentication failed."));
        peer.close();
        return;
    }

    await connectDB();

    const orderId = getOrderIdFromURL(peer.request.url)!;
    const order = await Order.findById(orderId);

    if (!order) {
        peer.send(shortMessage("error", "Order not found."));
        peer.close();
        return;
    }

    if (
        (data.senderRole === "customer" && order.user.toString() !== data.sender) ||
        (data.senderRole === "delivery" && order.deliveryPerson?.toString() !== data.sender)
    ) {
        peer.send(shortMessage("error", "Unauthorized access to this order chat."));
        peer.close();
        return;
    }

    if (order.customerStatus === "completed" && order.deliveryStatus === "completed") {
        peer.send(shortMessage("error", "Chat is closed for completed orders."));
        peer.close();
        return;
    }

    if (!chatRooms.has(orderId)) {
        chatRooms.set(orderId, new Map());
    }
    chatRooms.get(orderId)!.set(peer.id, {
        peer,
        peerId: peer.id,
        userId: data.sender,
        role: data.senderRole,
    });

    const sendPayload: Payload = {
        type: "join",
        data: {
            sender: data.sender,
            senderRole: data.senderRole,
            content: `User ${data.sender} joined the chat.`,
            timestamp: new Date(),
        },
    };

    broadcastToOrder(orderId, sendPayload);
    const latestLocation = driverLocations.get(orderId);
    if (latestLocation) {
        peer.send(JSON.stringify({ type: "location", data: latestLocation }));
    }
}

async function dispatchChatMessage(peer: Peer<AdapterInternal>, data: Message) {
    const orderId = getOrderIdFromURL(peer.request.url)!;
    const ctx = chatRooms.get(orderId)?.get(peer.id);
    if (!ctx) {
        peer.send(shortMessage("error", "Unauthorized. Please authenticate first."));
        return;
    }

    await connectDB();
    const newMessage = await ChatMessage.create({
        order: orderId,
        sender: ctx.userId,
        senderRole: ctx.role,
        content: data.content,
    });

    const payload: Payload = {
        type: "message",
        data: newMessage,
    };
    broadcastToOrder(orderId, payload);
}

export default defineWebSocketHandler({
    open(peer) {
        getOrderIdFromURL(peer.request.url);
    },

    close(peer) {
        disconnectClient(peer);
    },

    async message(peer, message) {
        const payload = message.json() as Payload;
        const data = payload.data;
        if (!data) return;

        if (payload.type === "auth") {
            authorizeClient(peer, data);
        } else if (payload.type === "send") {
            dispatchChatMessage(peer, data);
        } else if (payload.type === "location") {
            if (payload.data) {
                dispatchLocationUpdate(peer, payload.data as { lat: number; lng: number });
            }
        } else {
            peer.send(shortMessage("error", "Unknown message type."));
        }
    },
});
