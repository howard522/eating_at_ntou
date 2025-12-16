import { createAd, deleteAd, getAdById, getAllAds, getRandomAd, updateAd } from "@server/services/ad.service";
import { createChainedQueryMock } from "@test/__mocks__/queryMock";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSave, mockAggregate, mockFind, mockFindById, mockFindByIdAndUpdate, mockFindByIdAndDelete } = vi.hoisted(
    () => ({
        mockSave: vi.fn(),
        mockAggregate: vi.fn(),
        mockFind: vi.fn(),
        mockFindById: vi.fn(),
        mockFindByIdAndUpdate: vi.fn(),
        mockFindByIdAndDelete: vi.fn(),
    })
);

vi.mock("@server/models/ad.model", () => {
    class AdMock {
        constructor(data: any) {
            Object.assign(this, data);
            this.save = mockSave;
            this.toObject = () => data; // 支援 .toObject()
        }
        save!: typeof mockSave;
        toObject!: () => any;
        static aggregate = mockAggregate;
        static find = mockFind;
        static findById = mockFindById;
        static findByIdAndUpdate = mockFindByIdAndUpdate;
        static findByIdAndDelete = mockFindByIdAndDelete;
    }

    return { default: AdMock };
});

describe("Ad Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSave.mockClear();
        mockAggregate.mockReset();
        mockFind.mockReset();
        mockFindById.mockReset();
        mockFindByIdAndUpdate.mockReset();
        mockFindByIdAndDelete.mockReset();
    });

    it("建立廣告時應呼叫模型並保存資料", async () => {
        const adData = { title: "Test Ad", text: "Hello" };
        mockSave.mockResolvedValue(undefined);

        const ad = await createAd(adData);

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(ad).toMatchObject(adData);
    });

    it("應根據 ID 回傳廣告", async () => {
        const ad = { _id: "ad-1", title: "Ad Title" };
        mockFindById.mockReturnValue(createChainedQueryMock(ad));

        const result = await getAdById("ad-1");

        expect(mockFindById).toHaveBeenCalledWith("ad-1");
        expect(result).toBe(ad);
    });

    it("應回傳隨機廣告", async () => {
        const ad = { _id: "ad-2", title: "Random Ad" };
        mockAggregate.mockResolvedValue([ad]);

        const result = await getRandomAd();

        expect(mockAggregate).toHaveBeenCalledWith([{ $sample: { size: 1 } }]);
        expect(result).toBe(ad);
    });

    it("應依建立時間排序回傳所有廣告", async () => {
        const ads = [{ _id: "ad-3" }];
        mockFind.mockReturnValue(createChainedQueryMock(ads));

        const result = await getAllAds();

        expect(mockFind).toHaveBeenCalled();
        expect(mockFind().sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(ads);
    });

    it("應更新廣告並回傳最新內容", async () => {
        const updated = { _id: "ad-4", title: "Updated" };
        mockFindByIdAndUpdate.mockReturnValue({
            lean: vi.fn().mockResolvedValue(updated), // 支援 .lean()
        });

        const result = await updateAd("ad-4", { title: "Updated" });

        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("ad-4", { title: "Updated" }, { new: true });
        expect(result).toBe(updated);
    });

    it("刪除廣告成功時回傳 true", async () => {
        mockFindByIdAndDelete.mockResolvedValue({ _id: "ad-5" });

        const result = await deleteAd("ad-5");

        expect(mockFindByIdAndDelete).toHaveBeenCalledWith("ad-5");
        expect(result).toBe(true);
    });

    it("刪除不存在的廣告時回傳 false", async () => {
        mockFindByIdAndDelete.mockResolvedValue(null);

        const result = await deleteAd("missing-id");

        expect(result).toBe(false);
    });
});
