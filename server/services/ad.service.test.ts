import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAd, deleteAd, getAdById, getAllAds, getRandomAd, updateAd } from "./ad.service";
import Ad from "@server/models/ad.model";

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
        }
        save!: typeof mockSave;
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
        mockFindById.mockResolvedValue(ad);

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
        const sortMock = vi.fn().mockResolvedValue(ads);
        mockFind.mockReturnValue({ sort: sortMock });

        const result = await getAllAds();

        expect(mockFind).toHaveBeenCalled();
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(ads);
    });

    it("應更新廣告並回傳最新內容", async () => {
        const updated = { _id: "ad-4", title: "Updated" };
        mockFindByIdAndUpdate.mockResolvedValue(updated);

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
