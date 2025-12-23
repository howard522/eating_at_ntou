import { useUserStore } from "@stores/user";
import { computed, onBeforeUnmount, ref } from "vue";

type LatLng = [number, number];

interface LocationMessage {
    lat: number;
    lng: number;
    sender?: string;
    timestamp?: string | Date;
}

interface WsLocationPayload {
    type: string;
    data?: LocationMessage;
    message?: string;
}

type SenderRole = "customer" | "delivery" | "admin";
export function useOrderTracking(orderId: string) {
    const driverPosition = ref<LatLng | null>(null);
    const userStore = useUserStore();
    const isClient = typeof window !== "undefined";
    let ws: WebSocket | null = null;
    const senderRole = computed<SenderRole>(() => {
        if (userStore.info?.role === "admin") return "admin";
        return userStore.currentRole ?? "customer";
    });
    const connect = () => {
        if (!isClient || ws) return;
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        ws = new WebSocket(`${protocol}://${window.location.host}/ws/${orderId}`);

        ws.onmessage = (event) => {
            try {
                const payload: WsLocationPayload = JSON.parse(event.data);
                if (payload.type === "location" && payload.data) {
                    const { lat, lng } = payload.data;
                    if (typeof lat === "number" && typeof lng === "number") {
                        driverPosition.value = [lat, lng];
                    }
                } else if (payload.type === "error" && payload.message) {
                    console.error("Order tracking WS error:", payload.message);
                }
            } catch (err) {
                console.error("Failed to parse tracking message", err);
            }
        };

        ws.onopen = () => {
            const token = userStore.token;
            const sender = userStore.info?.id;
            if (!token || !sender) {
                console.warn("Missing auth info for tracking websocket");
                return;
            }
            const authPayload = {
                sender,
                senderRole: senderRole.value,
                content: token,
            };
            ws?.send(JSON.stringify({ type: "auth", data: authPayload }));
        };

        ws.onclose = () => {
            ws = null;
        };

        ws.onerror = (err) => {
            console.error("Tracking websocket error", err);
        };
    };

    const disconnect = () => {
        if (ws) {
            ws.close();
            ws = null;
        }
    };

    const sendLocation = (lat: number, lng: number) => {
        if (typeof lat === "number" && typeof lng === "number") {
            driverPosition.value = [lat, lng];
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "location", data: { lat, lng } }));
        }
    };

    if (isClient) {
        connect();
        onBeforeUnmount(() => {
            disconnect();
        });
    }

    return {
        driverPosition,
        sendLocation,
        disconnect,
    };
}