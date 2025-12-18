// test/services/chat.service.test.ts

import { chatMessageMocks as mocks } from "@test/__mocks__/models/chatMessage.model.mock";
import { createChainedQueryMock } from "@test/__mocks__/query.mock";
import { beforeEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

beforeEach(() => {
    mocks.chatInstances.length = 0;
});

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import { createChatMessage, getChatMessagesByOrderId } from "$services/chat.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("chat.service", () => {
    it("reateChatMessage - 當建立聊天訊息時，應自動去除前後空白並儲存訊息", async () => {
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
        expect(result).toStrictEqual({ order: "order1", sender: "user1", senderRole: "customer", content: "hi" });
    });

    it("getChatMessagesByOrderId - 當依訂單查詢聊天訊息時，應套用時間區間、分頁、排序並填充發送者資料", async () => {
        const chatDocs = [{ id: 1 }];
        mocks.find.mockReturnValue(createChainedQueryMock(chatDocs));

        const after = new Date("2024-01-01");
        const before = new Date("2024-02-01");
        const result = await getChatMessagesByOrderId("order1", { limit: 10, skip: 5, after, before });

        expect(mocks.find).toHaveBeenCalledWith({ order: "order1", timestamp: { $gt: after, $lt: before } });
        expect(mocks.find().sort).toHaveBeenCalledWith({ timestamp: -1 });
        expect(mocks.find().limit).toHaveBeenCalledWith(10);
        expect(mocks.find().skip).toHaveBeenCalledWith(5);
        expect(mocks.find().populate).toHaveBeenCalledWith("sender", "name img");
        expect(result).toBe(chatDocs);
    });
});
