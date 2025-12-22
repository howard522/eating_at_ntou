/**
 * 匯入基隆地址 CSV 至 KeelongAddressMap
 * 使用方式：
 *   npx ts-node scripts/import_keelong_addresses.ts ./data/keelong.csv
 */

import KeelongAddressMap from '$models/KeelongAddressMap.js';
import connectDB from '$utils/db.js';
import { normalizeAddress } from '$utils/nominatim.js';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
dotenv.config();

if (!process.argv[2]) {
    console.error('請指定 CSV 檔案路徑');
    process.exit(1);
}

const filePath = path.resolve(process.argv[2]);

async function run() {
    await connectDB();
    console.log(`匯入 CSV：${filePath}`);

    const results: any[] = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`讀取到 ${results.length} 筆資料`);

            let success = 0;
            for (const row of results) {
                const original = (row.ADDRESS || '').trim();
                const normalized = normalizeAddress(original);

                const lat = parseFloat(row.LAT);
                const lon = parseFloat(row.LON);

                if (!original || !lat || !lon) {
                    console.warn(`資料格式不完整，略過: ${original}`);
                    continue;
                }

                try {
                    const res = await KeelongAddressMap.updateOne(
                        { normalizedAddress: normalized },
                        { $setOnInsert: { originalAddress: original, normalizedAddress: normalized, lat, lon } },
                        { upsert: true }
                    );
                    if (res.upsertedCount > 0) success++;
                } catch (err) {
                    console.warn(`寫入失敗: ${original}`, err);
                }
            }

            console.log(`匯入完成`);
            console.log(`新增：${success} 筆`);
            console.log(`已存在略過：${results.length - success} 筆`);

            await mongoose.disconnect();
            process.exit(0);
        });
}

run();
