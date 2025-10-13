import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: 搜尋餐廳
 *     description: 根據關鍵字（name / info / address / menu.name）進行不區分大小寫的搜尋
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字（可多個，以空白分隔；無則回傳所有餐廳）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 50，限制為 100）
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: 跳過筆數（用於分頁）
 *     responses:
 *       200:
 *         description: 成功回傳餐廳清單
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
 *                     $ref: '#/components/schemas/Restaurant'
 */
export default defineEventHandler(async (event) => {
    await connectDB();
    // Search for restaurants in the database
    const query = getQuery(event);
    const raw = (query.search as string) || '';
    // 防止過長或過多關鍵字造成效能問題
    const MAX_TERMS = 5;
    const MAX_TERM_LEN = 50;
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 以空白拆詞（支援多個關鍵字），並限制數量與長度
    const terms = raw.split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, MAX_TERMS);
    console.log('Searching for restaurants with terms:', terms);

    // 建立 mongo query：若沒有關鍵字則使用空查詢（回傳全部）
    let mongoQuery: any = {};
    if (terms.length > 0) {
        // 若任一關鍵字符合即可：把每個欄位的 match 都放入同一個 $or，
        // 使用者輸入多個關鍵字時，任何一個詞匹配就會被回傳。
        const orClauses: any[] = [];
        for (const t of terms) {
            const term = t.substring(0, MAX_TERM_LEN);
            const re = new RegExp(escapeRegex(term), 'i');
            orClauses.push({ name: { $regex: re } });
            orClauses.push({ info: { $regex: re } });
            orClauses.push({ address: { $regex: re } });
            orClauses.push({ 'menu.name': { $regex: re } });
        }
        mongoQuery = { $or: orClauses };
    }

    // 分頁參數
    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    const restaurants = await Restaurant.find(mongoQuery).skip(skip).limit(limit);
    return {
        success: true,
        count: restaurants.length,
        data: restaurants
    }
});
