// server/utils/nominatim.ts

import type { IGeoPoint } from "@server/interfaces/geo.interface";

import geoCache from "@server/models/geoCache.model";
import KeelongAddressMap from "@server/models/KeelongAddressMap";

export function normalizeAddress(addr: string): string {
    if (!addr) return addr;
    let s = addr.trim();
    // 將常見分隔符改成空白
    s = s.replace(/[，,、\/\\]+/g, " ");
    // 去掉郵遞區號（3-5位數字開頭）
    s = s.replace(/^\d{3,5}\s*/g, "");
    //71-7號 -> 71之7號
    s = s.replace(/(\d+)[\-\–](\d+)/g, "$1之$2");
    // 在常見地址後綴（市/區/路/街/段/巷/弄/號等）後面若接中文，通常插入空白。
    // 但若接續的是路段形式（例如：西園路二段 / 中山路三段），不要在「路」與「二段」之間插空白。
    s = s.replace(/(縣|市|區|鄉|鎮|里|路|街|段|巷|弄|號)(?=[\p{Script=Han}])/gu, (match, suffix, offset, full) => {
        // 取後面最多 4 個字來判斷是否為「＊＊段」形式（含中文數字或阿拉伯數字）
        const look = full.slice(offset + match.length, offset + match.length + 4);
        // 若後面出現「...段」則視為路段，保留原樣（不插空格）
        if (/^[\p{Script=Han}0-9之\-–]*段/u.test(look)) {
            return match;
        }
        return match + " ";
    });
    // 若有「號」，只保留到第一個「號」，去掉後面的樓層/房號等（例如：242號1樓 -> 242號），
    // 再把末尾的「號」字移除以增加 Nominatim 的命中率（例如: 242號 -> 242）
    s = s.replace(/^(.+?號).*/u, "$1");
    s = s.replace(/號$/u, "");

    // 若地址沒有號，但有樓層/室等附加資訊，移除這些部分（例如：某路 3樓 -> 某路）
    s = s.replace(/(樓層|樓|F|f|層|室|房|之樓|之F|之層).*$/u, "");

    // 在中文與數字之間插入空格（例如 北寧路2號 -> 北寧路 2號）
    s = s.replace(/([\p{Script=Han}])(\d)/gu, "$1 $2");
    s = s.replace(/(\d)([\p{Script=Han}])/gu, "$1 $2");
    // 在中文與英文字母之間插入空格
    s = s.replace(/([\p{Script=Han}])([A-Za-z])/gu, "$1 $2");
    s = s.replace(/([A-Za-z])([\p{Script=Han}])/gu, "$1 $2");
    // 合併多個空白為一個，並 trim
    s = s.replace(/\s+/g, " ").trim();
    console.log("Normalized address:", s);
    return s;
}

// 關於地址正規化：
// 目前的規則可以應付大部分常見情況，但有可能還有我沒想到/測到的格式，
// 個人目前認為最好的正規化解法是嘗試申請 台灣圖霸地址服務的 API 金鑰來使用，因為他真的很屌
// 矛盾的點是，如果要用最好的解法，不如用google map api，笑死。
// 現在用nominatim是因為免費，也不用api key，雖然奇怪的地址會神經神經的，但我已經盡量讓地址能被nominatim接受了，
// 但還是有可能會有例外，畢竟地址本來就沒有標準格式這種東西，隨便啦。

export async function geocodeAddress(address: string) {
    if (!address) return null;
    const q = normalizeAddress(address);

    // 查 KeelongAddressMap，先去掉"基隆市"
    // 正規化地址
    const qWithoutKeelong = q.replace(/^基隆市\s*/, "");
    const keelongEntry = await (KeelongAddressMap as any).findOne({ normalizedAddress: qWithoutKeelong });
    if (keelongEntry) {
        console.log("Geocode KeelongAddressMap hit for address:", qWithoutKeelong);
        console.log("Found coordinates:", { lat: parseFloat(keelongEntry.lat), lon: parseFloat(keelongEntry.lon) });
        return { lat: parseFloat(keelongEntry.lat), lon: parseFloat(keelongEntry.lon) };
    }

    // 先查 cache
    const cached = await (geoCache as any).findOne({ address: q });
    if (cached) {
        console.log("Geocode cache hit for address:", q);
        return { lat: cached.lat, lon: cached.lon };
    }

    // 查 Nominatim
    // TODO: 節流機制應該要在這裡處理才對（尚未實作）
    // INFO: 節流：Nominatim 建議每秒不要超過 1 次，這裡設 1.1 秒

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
        headers: {
            // Nominatim 要求必須提供有效的 User-Agent 與 Referer
            "User-Agent": "eating_at_ntou/1.0",
            Referer: "https://github.com/howard522/eating_at_ntou",
        },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const { lat, lon } = data[0];
    // 存 cache
    const geo = new (geoCache as any)({
        address: q,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
    });
    await geo.save();
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

/**
 * 透過地址取得經緯度，若成功回傳 GeoJSON Point 格式
 *
 * @param address 地址字串
 * @returns 經緯度資料或 undefined（若無法取得）
 */
export async function getGeocodeFromAddress(address: string): Promise<IGeoPoint | null> {
    try {
        const coords = await geocodeAddress(address);
        if (coords) {
            return {
                type: "Point",
                coordinates: [coords.lon, coords.lat],
            };
        }
    } catch (err) {
        console.error("Geocoding failed:", err);
    }

    return null;
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 驗證經緯度資料是否有效
 *
 * @param coords 經緯度資料
 * @returns 是否有效
 */
export function validateGeocode(coords: IGeoPoint | null | undefined): boolean {
    // 基本檢查
    if (!coords || coords.type !== "Point" || !Array.isArray(coords.coordinates)) {
        return false;
    }
    if (coords.coordinates.length !== 2) {
        return false;
    }

    // 經度與緯度範圍檢查
    const [lon, lat] = coords.coordinates;
    if (typeof lon !== "number" || typeof lat !== "number") {
        return false;
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        return false;
    }

    // 全部通過，回傳 true
    return true;
}

//for testing
//npx tsx server/utils/nominatim.ts
// (async () => {
//     // 目前遇到的最幹的地址：108台北市萬華區西園路二段240號
//     // 因為原本的normalize送, 會跑到中國, 為了這個字串新增了更多normalize規則, fuck
//     const addr = '108台北市萬華區西園路二段240號';
//     const coords = await geocodeAddress(addr);
//     console.log(addr, coords);
// })();
