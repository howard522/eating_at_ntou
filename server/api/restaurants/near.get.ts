import Restaurant from '@server/models/restaurant.model'
import connectDB from '@server/utils/db';
import { getQuery } from 'h3'
import { geocodeAddress } from '@server/utils/nominatim';

/**
 * @openapi
 * /api/restaurants/near:
 *   get:
 *     summary: 依距離搜尋附近餐廳 (geoNear)
 *     description: |
 *       以給定的座標為中心，回傳依距離排序的餐廳清單。若資料中某些餐廳缺少地理座標，
 *       此 endpoint 會對最多 20 筆缺少座標的餐廳嘗試一次 Nominatim geocode（best-effort），並將結果寫回 DB。
 *       注意：此寫回為有副作用的操作，請在測試時小心使用。
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *           example: "基隆市中正區北寧路2號"
 *         required: true
 *         description: 地址字串（前端僅需傳 address），伺服器會使用 Nominatim geocode 取得中心座標並以該座標搜尋附近餐廳。
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字（支援用雙引號包住的精準片語，例如 "炸雞 便當"；未包引號會以空白拆詞），會比對 name/info/address/menu.name/tags/phone
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 20）
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: 跳過筆數（分頁用）
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: 最大搜尋距離（公尺），選填
 *     responses:
 *       200:
 *         description: 成功回傳附近餐廳清單，包含 distance 欄位（單位：公尺）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Restaurant'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: 距離（公尺）
 */
export default defineEventHandler(async (event) => {
    await connectDB();
    const q = getQuery(event);
    const address = (q.address as string) || '';
    const raw = (q.search as string) || '';
    if (!address) {
        return { success: false, message: 'address query parameter is required' };
    }
    const center = await geocodeAddress(address);
    if (!center) {
        return { success: false, message: 'unable to geocode provided address' };
    }
    const lat = center.lat;
    const lon = center.lon;

    let limit = Number(q.limit) || 20;
    const skip = Number(q.skip) || 0;
    const maxDistance = q.maxDistance ? Number(q.maxDistance) : undefined; // meters

    // 搜尋參數：支援 "phrase" 精準片語與一般空白拆詞
    const MAX_TERMS = 5;
    const MAX_TERM_LEN = 50;
    const phraseMatches: string[] = [];
    const phraseRegex = /"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = phraseRegex.exec(raw)) !== null) {
        phraseMatches.push(m[1].trim());
    }
    const withoutPhrases = raw.replace(phraseRegex, ' ');
    const terms = withoutPhrases.split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, MAX_TERMS);
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 如果有關鍵字，準備 $or regex 條件並附加到 $geoNear.query
    const orClauses: any[] = [];
    for (const t of terms) {
        const term = t.substring(0, MAX_TERM_LEN);
        const re = new RegExp(escapeRegex(term), 'i');
        orClauses.push({ name: { $regex: re } });
        orClauses.push({ info: { $regex: re } });
        orClauses.push({ address: { $regex: re } });
        orClauses.push({ 'menu.name': { $regex: re } });
        orClauses.push({ tags: { $regex: re } });
        orClauses.push({ phone: { $regex: re } });
    }
    for (const p of phraseMatches.slice(0, MAX_TERMS)) {
        const phrase = p.substring(0, MAX_TERM_LEN);
        const reP = new RegExp(escapeRegex(phrase), 'i');
        orClauses.push({ name: { $regex: reP } });
        orClauses.push({ info: { $regex: reP } });
        orClauses.push({ address: { $regex: reP } });
        orClauses.push({ 'menu.name': { $regex: reP } });
        orClauses.push({ tags: { $regex: reP } });
        orClauses.push({ phone: { $regex: reP } });
    }

    // First, try to find nearby using aggregation with $geoNear
    const geoNearStage: any = {
        $geoNear: {
            near: { type: 'Point', coordinates: [lon, lat] },
            distanceField: 'distance',
            spherical: true,
            distanceMultiplier: 1, // distance in meters when using $geoNear with meters depends on coords
        }
    };
    if (typeof maxDistance === 'number' && !Number.isNaN(maxDistance)) {
        geoNearStage.$geoNear.maxDistance = maxDistance;
    }

    // 如果有關鍵字條件，將它附加在 $geoNear.query，讓地理搜尋同時做關鍵字過濾
    if (orClauses.length > 0) {
        geoNearStage.$geoNear.query = { $or: orClauses };
    }

    // Attempt aggregation. But before that, ensure that documents missing locationGeo are attempted geocode-once.
    // We'll find a small set of restaurants that have no locationGeo and try to geocode them (best-effort, limited to 20 per request)
    const missing = await Restaurant.find({ $or: [{ locationGeo: { $exists: false } }, { 'locationGeo.coordinates': { $exists: false } }, { 'locationGeo.coordinates': null }] }).limit(20);
    for (const r of missing) {
        if (r.address) {
            try {
                const coords = await geocodeAddress(r.address);
                if (coords) {
                    // update locationGeo only
                    const lonv = coords.lon;
                    const latv = coords.lat;
                    await Restaurant.findByIdAndUpdate(r._id, { $set: { locationGeo: { type: 'Point', coordinates: [lonv, latv] } } });
                }
            } catch (e) {
                // ignore
            }
        }
    }

    const pipeline: any[] = [geoNearStage, { $skip: skip }, { $limit: limit }];
    const results = await Restaurant.aggregate(pipeline);

    return {
        success: true,
        count: results.length,
        data: results
    }
});
