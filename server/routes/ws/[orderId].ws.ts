import { defineWebSocketHandler, getRouterParam } from "h3";
import ChatMessage from "@server/models/chatMessage.model";
import connectDB from "@server/utils/db";


interface ChatPayload {
    sender: string; // 使用者 ID
    senderRole: "customer" | "delivery"; // 角色
    content: string; // 訊息內容
}

const chatRooms: Map<string, Set<any>> = new Map(); // orderId -> peers

function getOrderIdFromURL(url?: string): string | null {
    // 取得 orderId: /ws/:orderId
    const match = url?.match(/\/ws\/([a-zA-Z0-9]{24})$/i);
    return match ? match[1].toLowerCase() : null;
}

function broadcastToOrder(orderId: string, payload: ChatPayload) {
    const room = chatRooms.get(orderId);
    if (!room) return;

    const message = JSON.stringify({ type: "message", data: payload });
    room.forEach((peer) => {
        peer.send(message);
    });
}

export default defineWebSocketHandler({
    open(peer) {
        const orderId = getOrderIdFromURL(peer.request.url);

        console.log(
            `WebSocket connection opened for order ${orderId}: ${peer}`
        );

        if (!orderId) {
            peer.send(JSON.stringify({ type: "error", message: "Invalid orderId in URL." }));
            peer.close();
            return;
        }

        // 將 peer 加入對應的聊天室
        if (!chatRooms.has(orderId)) {
            chatRooms.set(orderId, new Set());
        }
        chatRooms.get(orderId)!.add(peer);

    },

    close(peer) {
        const orderId = getOrderIdFromURL(peer.request.url);
        if (orderId && chatRooms.has(orderId)) {
            const room = chatRooms.get(orderId)!;
            room.delete(peer);
            // 如果聊天室沒人了，就刪除聊天室
            if (room.size === 0) {
                chatRooms.delete(orderId);
            }

            console.log(`WebSocket connection closed for order ${orderId}: ${peer} (total peers: ${room.size})`);
        }
    },

    async message(peer, message) {
        try {
            const orderId = getOrderIdFromURL(peer.request.url);
            if (!orderId) {
                peer.send(JSON.stringify({ type: "error", message: "Invalid orderId in URL." }));
                return;
            }

            const data = JSON.parse(message.toString()) as ChatPayload;

            if (!data.sender || !data.senderRole || !data.content) {
                peer.send(JSON.stringify({ type: "error", message: "Missing required fields." }));
                return;
            }

            // 確保 DB 連線在 WebSocket 處理程序中可用
            await connectDB();

            // 儲存到 DB
            const newMessage = await ChatMessage.create({
                order: orderId,
                sender: data.sender,
                senderRole: data.senderRole,
                content: data.content,
            });

            // 廣播給該訂單的所有連線的 peer
            broadcastToOrder(orderId, newMessage);
        } catch (err) {
            console.error("Error handling WebSocket message:", err);
            peer.send(JSON.stringify({ type: "error", message: "Internal server error." }));
        }
    },
});
