// test/__mocks__/models/chatMessage.model.mock.ts

import { createDocumentMock } from "@mocks/document.mock";
import { vi } from "vitest";

const chatMessageMocks = vi.hoisted(() => ({
    find: vi.fn(),
    chatInstances: [] as any[],
    ChatMessageMock: undefined as any,
}));

export const mockChatMessageModel = () => {
    vi.mock("$models/chatMessage.model", () => {
        class ChatMessageMock {
            constructor(data: any) {
                data = createDocumentMock(data);
                Object.assign(this, data);
                chatMessageMocks.chatInstances.push(this);
            }

            static find = chatMessageMocks.find;
        }

        chatMessageMocks.ChatMessageMock = ChatMessageMock;

        return { default: ChatMessageMock };
    });
};

export { chatMessageMocks };
