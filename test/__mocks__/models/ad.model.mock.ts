// test/__mocks__/models/ad.model.mock.ts

import { vi } from "vitest";
import { createDocumentMock } from "@mocks/document.mock";

const adMocks = vi.hoisted(() => ({
    aggregate: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    adInstances: [] as any[],
    AdMock: undefined as any,
}));

export const mockAdModel = () => {
    vi.mock("$models/ad.model", () => {
        class AdMock {
            constructor(data: any) {
                data = createDocumentMock(data);
                Object.assign(this, data);
                adMocks.adInstances.push(this);
            }

            static aggregate = adMocks.aggregate;
            static find = adMocks.find;
            static findById = adMocks.findById;
            static findByIdAndDelete = adMocks.findByIdAndDelete;
            static findByIdAndUpdate = adMocks.findByIdAndUpdate;
        }

        adMocks.AdMock = AdMock;

        return { default: AdMock };
    });
};

export { adMocks };
