// test/services/ad.service.test.ts

import { createAd, deleteAd, getAdById, getAllAds, getRandomAd, updateAd } from "@server/services/ad.service";
import { adMocks as mocks } from "@test/__mocks__/models/ad.model.mock";
import { createChainedQueryMock } from "@test/__mocks__/query.mock";
import { beforeEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

beforeEach(() => {
    mocks.aggregate.mockReset();
    mocks.find.mockReset();
    mocks.findById.mockReset();
    mocks.findByIdAndUpdate.mockReset();
    mocks.findByIdAndDelete.mockReset();
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("ad.service - CRUD 操作", () => {
    it("createAd - 應呼叫模型並保存新建的廣告資料", async () => {
        const adData = { title: "Test Ad", text: "Hello" };
        const ad = await createAd(adData);

        expect(mocks.adInstances).toHaveLength(1);
        expect(mocks.adInstances[0].save).toHaveBeenCalled();
        expect(ad).toMatchObject(adData);
    });

    it("getAdById - 應根據 ID 回傳對應的廣告資料", async () => {
        const ad = { _id: "ad-1", title: "Ad Title" };
        mocks.findById.mockReturnValue(createChainedQueryMock(ad));

        const result = await getAdById("ad-1");

        expect(mocks.findById).toHaveBeenCalledWith("ad-1");
        expect(mocks.findById().lean).toHaveBeenCalled();
        expect(result).toBe(ad);
    });

    it("getRandomAd - 應回傳隨機一則廣告", async () => {
        const ad = { _id: "ad-2", title: "Random Ad" };
        mocks.aggregate.mockResolvedValue([ad]);

        const result = await getRandomAd();

        expect(mocks.aggregate).toHaveBeenCalledWith([{ $sample: { size: 1 } }]);
        expect(result).toBe(ad);
    });

    it("getAllAds - 應回傳按建立時間排序的所有廣告", async () => {
        const ads = [{ _id: "ad-3" }];
        mocks.find.mockReturnValue(createChainedQueryMock(ads));

        const result = await getAllAds();

        expect(mocks.find).toHaveBeenCalled();
        expect(mocks.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(mocks.find().sort().lean).toHaveBeenCalled();
        expect(result).toEqual(ads);
    });

    it("updateAd - 應更新廣告資料並回傳最新內容", async () => {
        const updated = { _id: "ad-4", title: "Updated" };
        mocks.findByIdAndUpdate.mockReturnValue(createChainedQueryMock(updated));

        const result = await updateAd("ad-4", { title: "Updated" });

        expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith("ad-4", { title: "Updated" }, { new: true });
        expect(mocks.findByIdAndUpdate().lean).toHaveBeenCalled();
        expect(result).toBe(updated);
    });

    it("deleteAd - 刪除廣告成功時，應回傳 true", async () => {
        mocks.findByIdAndDelete.mockResolvedValue({ _id: "ad-5" });

        const result = await deleteAd("ad-5");

        expect(mocks.findByIdAndDelete).toHaveBeenCalledWith("ad-5");
        expect(result).toBe(true);
    });

    it("deleteAd - 當廣告不存在時，應回傳 false", async () => {
        mocks.findByIdAndDelete.mockResolvedValue(null);

        const result = await deleteAd("missing-id");

        expect(mocks.findByIdAndDelete).toHaveBeenCalledWith("missing-id");
        expect(result).toBe(false);
    });
});
