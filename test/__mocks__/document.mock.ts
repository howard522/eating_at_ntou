// test/__mocks__/document.mock.ts

import { vi } from "vitest";

/**
 * 建立模擬 Mongoose Document 的 mock 物件
 * 支援 populate, save, toObject 方法
 * 
 * @param data 文件的初始資料
 * @param virtuals 虛擬屬性
 */
export function createDocumentMock<T extends object>(data: T, virtuals?: Record<string, any>) {
    type DocType = T & {
        populate: (field: string, select?: string) => Promise<DocType>;
        save: () => Promise<DocType>;
        toObject: () => T;
    };

    const doc: DocType = {
        ...data,
        populate: vi.fn(async function (this: DocType, field: string, select?: string) {
            return this;
        }),
        save: vi.fn(async function (this: DocType) {
            return this;
        }),
        toObject: vi.fn(function (this: DocType) {
            const { populate, save, toObject, ...plain } = this;
            return { ...plain, ...virtuals } as T;
        }),
    };

    return doc;
}
