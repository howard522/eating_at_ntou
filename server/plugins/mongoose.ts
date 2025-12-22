// server/plugins/mongoose.ts

import connectDB from "$utils/db";

/**
 * 連接到 MongoDB 資料庫的 Nitro 插件
 */
export default defineNitroPlugin(async () => {
    await connectDB();
});
