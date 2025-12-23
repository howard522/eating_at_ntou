import type { Peer, AdapterInternal } from "crossws";

export interface PeerContext {
    peer: Peer<AdapterInternal>;
    peerId: string;
    userId: string;
    role: "customer" | "delivery"| "admin";
}

export interface Payload {
    type: string; // 資料類型
    message?: string; // 錯誤或系統訊息
    data?: any; // 訊息或位置資料
}

export interface LocationPayload {
    sender?: string;
    lat: number;
    lng: number;
    timestamp?: Date;
}

export const chatRooms: Map<string, Map<string, PeerContext>> = new Map(); // orderId -> peers
export const driverLocations: Map<string, LocationPayload> = new Map(); // orderId -> latest location

/**
 * 廣播訊息給指定訂單的所有連線 peer
 * @param orderId 訂單 ID
 * @param payload 發送資料
 */
export function broadcastToOrder(orderId: string, payload: Payload) {
    const message = JSON.stringify(payload);
    const room = chatRooms.get(orderId);
    if (!room) return;

    room.forEach(({ peer }) => {
        peer.send(message);
    });
}

export function broadcastLocation(orderId: string, data: LocationPayload) {
    broadcastToOrder(orderId, { type: "location", data });
}
