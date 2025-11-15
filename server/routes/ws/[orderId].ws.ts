import { defineWebSocketHandler } from "h3";
import ChatMessage from "@server/models/chatMessage.model";
import Order from "@server/models/order.model";
import connectDB from "@server/utils/db";
import { verifyJwt } from "@server/utils/auth";
import type { Peer, AdapterInternal } from "crossws";

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

interface Payload {
    type: string; // 資料類型
    message?: string; // 錯誤或系統訊息
    data?: Message; // 訊息資料
}

interface PeerContext {
    peer: Peer<AdapterInternal>;
    peerId: string;
    userId: string;
    role: "customer" | "delivery";
}

const chatRooms: Map<string, Map<string, PeerContext>> = new Map(); // orderId -> peers
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

/**
 * 廣播訊息給指定訂單的所有連線 peer
 * @param orderId 訂單 ID
 * @param payload 發送資料
 * @param type 資料類型
 */
function broadcastToOrder(orderId: string, payload: Payload) {
    const message = JSON.stringify(payload);
    const room = chatRooms.get(orderId);
    if (!room) return;

    room.forEach(({ peer }) => {
        peer.send(message);
    });
}

/**
 * 簡化訊息物件的建立
 */
function shortMessage(_type: string, _message: string): string {
    const msg: Payload = { type: _type, message: _message };
    return JSON.stringify(msg);
}

/**
 * 從聊天室移除 peer
 */
function disconnectClient(peer: Peer<AdapterInternal>) {
    const orderId = getOrderIdFromURL(peer.request.url);

    if (orderId && chatRooms.has(orderId)) {
        const room = chatRooms.get(orderId)!;
        const ctx = room.get(peer.id)!;

        room.delete(peer.id);

        // console.log(`WebSocket connection closed for order ${orderId}: ${peer} (total peers: ${room.size})`);

        // 如果聊天室沒人了，就刪除聊天室
        if (room.size === 0) {
            chatRooms.delete(orderId);
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

/**
 * 驗證並認證連線的 peer
 */
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

    // 檢查訂單是否存在
    if (!order) {
        peer.send(shortMessage("error", "Order not found."));
        peer.close();
        return;
    }

    // 檢查使用者是否有權限進入此訂單的聊天室
    if (
        (data.senderRole === "customer" && order.user.toString() !== data.sender) ||
        (data.senderRole === "delivery" && order.deliveryPerson?.toString() !== data.sender)
    ) {
        peer.send(shortMessage("error", "Unauthorized access to this order chat."));
        peer.close();
        return;
    }

    // 檢查訂單是否已完成
    if (order.customerStatus === "completed" && order.deliveryStatus === "completed") {
        peer.send(shortMessage("error", "Chat is closed for completed orders."));
        peer.close();
        return;
    }

    // 認證成功，將 peer 加入對應的聊天室
    if (!chatRooms.has(orderId)) {
        chatRooms.set(orderId, new Map());
    }
    chatRooms.get(orderId)!.set(peer.id, {
        peer,
        peerId: peer.id,
        userId: data.sender,
        role: data.senderRole,
    });

    // console.log(
    //     `WebSocket connection authenticated for order ${orderId}: ${peer} (total peers: ${
    //         chatRooms.get(orderId)!.size
    //     })`
    // );

    const sendPayload: Payload = {
        type: "join",
        data: {
            sender: data.sender,
            senderRole: data.senderRole,
            content: `User ${data.sender} joined the chat.`,
            timestamp: new Date(),
        },
    };

    // 廣播加入訊息給該訂單的所有連線的 peer
    broadcastToOrder(orderId, sendPayload);
}

async function dispatchChatMessage(peer: Peer<AdapterInternal>, data: Message) {
    const orderId = getOrderIdFromURL(peer.request.url)!;
    const ctx = chatRooms.get(orderId)?.get(peer.id);
    if (!ctx) {
        peer.send(shortMessage("error", "Unauthorized. Please authenticate first."));
        return;
    }

    // 儲存到 DB
    await connectDB();
    const newMessage = await ChatMessage.create({
        order: orderId,
        sender: ctx.userId,
        senderRole: ctx.role,
        content: data.content,
    });

    // 廣播給該訂單的所有連線的 peer
    const payload: Payload = {
        type: "message",
        data: newMessage,
    };
    broadcastToOrder(orderId, payload);
}

export default defineWebSocketHandler({
    open(peer) {
        // 暫時開啟連線，等待認證
        const orderId = getOrderIdFromURL(peer.request.url);
        // console.log(`WebSocket connection temperarily opened for order ${orderId}: ${peer}`);
    },

    close(peer) {
        // 關閉連線時，從聊天室移除 peer
        disconnectClient(peer);
    },

    async message(peer, message) {
        const payload = message.json() as Payload;
        const data = payload.data;
        if (!data) return;

        if (payload.type === "auth") {
            // 處理認證
            authorizeClient(peer, data);
        } else if (payload.type === "send") {
            // 處理傳送給其他 peer
            dispatchChatMessage(peer, data);
        } else {
            peer.send(shortMessage("error", "Unknown message type."));
        }
    },
});
