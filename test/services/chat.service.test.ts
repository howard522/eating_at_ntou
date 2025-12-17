// test/services/chat.service.test.ts

import { createChatMessage, getChatMessagesByOrderId } from "@server/services/chat.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
    chatInstances: [] as any[],
    findMock: vi.fn(),
}));

vi.mock("@server/models/chatMessage.model", () => {
    class ChatMock {
        order: any;
        sender: any;
        senderRole: any;
        content: string;
        constructor(data: any) {
            Object.assign(this, data);
            mocks.chatInstances.push(this);
        }
        save = vi.fn().mockResolvedValue(undefined);
        static find = mocks.findMock;
    }
    return { default: ChatMock };
});

beforeEach(() => {
    mocks.chatInstances.length = 0;
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("chat.service", () => {
    it("createChatMessage saves trimmed content", async () => {
        const result = await createChatMessage({
            order: "order1",
            sender: "user1",
            senderRole: "customer",
            content: " hi ",
        });

        expect(mocks.chatInstances).toHaveLength(1);
        const msg = mocks.chatInstances[0];
        expect(msg.order).toBe("order1");
        expect(msg.sender).toBe("user1");
        expect(msg.senderRole).toBe("customer");
        expect(msg.content).toBe("hi");
        expect(msg.save).toHaveBeenCalled();
        expect(result).toBe(msg);
    });

    it("getChatMessagesByOrderId applies filters and population", async () => {
        const docs = [{ id: 1 }];
        const populate = vi.fn().mockResolvedValue(docs);
        const skip = vi.fn().mockReturnValue({ populate });
        const limit = vi.fn().mockReturnValue({ skip });
        const sort = vi.fn().mockReturnValue({ limit });
        mocks.findMock.mockReturnValue({ sort });

        const after = new Date("2024-01-01");
        const before = new Date("2024-02-01");
        const result = await getChatMessagesByOrderId("order1", { limit: 10, skip: 5, after, before });

        expect(mocks.findMock).toHaveBeenCalledWith({ order: "order1", timestamp: { $gt: after, $lt: before } });
        expect(sort).toHaveBeenCalledWith({ timestamp: -1 });
        expect(limit).toHaveBeenCalledWith(10);
        expect(skip).toHaveBeenCalledWith(5);
        expect(populate).toHaveBeenCalledWith("sender", "name img");
        expect(result).toBe(docs);
    });
});
