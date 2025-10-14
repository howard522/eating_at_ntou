export function normalizeAddress(addr: string): string {
    if (!addr) return addr;
    let s = addr.trim();
    // 將常見分隔符改成空白
    s = s.replace(/[，,、\/\\]+/g, ' ');
    //71-7號 -> 71之7號
    s = s.replace(/(\d+)[\-\–](\d+)/g, '$1之$2');
    // 在常見地址後綴（市/區/路/街/段/巷/弄/號等）後面若接中文，通常插入空白。
    // 但若接續的是路段形式（例如：西園路二段 / 中山路三段），不要在「路」與「二段」之間插空白。
    s = s.replace(/(縣|市|區|鄉|鎮|里|路|街|段|巷|弄|號)(?=[\p{Script=Han}])/gu, (match, suffix, offset, full) => {
        // 取後面最多 4 個字來判斷是否為「＊＊段」形式（含中文數字或阿拉伯數字）
        const look = full.slice(offset + match.length, offset + match.length + 4);
        // 若後面出現「...段」則視為路段，保留原樣（不插空格）
        if (/^[\p{Script=Han}0-9之\-–]*段/u.test(look)) {
            return match;
        }
        return match + ' ';
    });
    // 若有「號」，只保留到第一個「號」，去掉後面的樓層/房號等（例如：242號1樓 -> 242號），
    // 再把末尾的「號」字移除以增加 Nominatim 的命中率（例如: 242號 -> 242）
    s = s.replace(/^(.+?號).*/u, '$1');
    s = s.replace(/號$/u, '');

    // 若地址沒有號，但有樓層/室等附加資訊，移除這些部分（例如：某路 3樓 -> 某路）
    s = s.replace(/(樓層|樓|F|f|層|室|房|之樓|之F|之層).*$/u, '');

    // 在中文與數字之間插入空格（例如 北寧路2號 -> 北寧路 2號）
    s = s.replace(/([\p{Script=Han}])(\d)/gu, '$1 $2');
    s = s.replace(/(\d)([\p{Script=Han}])/gu, '$1 $2');
    // 在中文與英文字母之間插入空格
    s = s.replace(/([\p{Script=Han}])([A-Za-z])/gu, '$1 $2');
    s = s.replace(/([A-Za-z])([\p{Script=Han}])/gu, '$1 $2');
    // 合併多個空白為一個，並 trim
    s = s.replace(/\s+/g, ' ').trim();
    console.log('Normalized address:', s);
    return s;
}

export async function geocodeAddress(address: string) {
    if (!address) return null;
    const q = normalizeAddress(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
        headers: {
            // Nominatim 要求必須提供有效的 User-Agent 與 Referer
            'User-Agent': 'eating_at_ntou/1.0 (https://github.com/howard522/eating_at_ntou)',
            'Referer': 'http://localhost'
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//for testing
//npx tsx server/utils/nominatim.ts
(async () => {
    // 目前遇到的最幹的地址：108台北市萬華區西園路二段240號
    // 因為原本的normalize送, 會跑到中國, 為了這個字串新增了更多normalize規則, fuck
    const addr = '108台北市萬華區西園路二段240號';
    const coords = await geocodeAddress(addr);
    console.log(addr, coords);
})();
