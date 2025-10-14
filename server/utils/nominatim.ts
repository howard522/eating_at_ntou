export function normalizeAddress(addr: string): string {
    if (!addr) return addr;
    let s = addr.trim();
    // 將常見分隔符改成空白
    s = s.replace(/[，,、\/\\]+/g, ' ');
    // 在中文與數字之間插入空格（例如 北寧路2號 -> 北寧路 2號）
    s = s.replace(/([\p{Script=Han}])(\d)/gu, '$1 $2');
    s = s.replace(/(\d)([\p{Script=Han}])/gu, '$1 $2');
    // 在中文與英文字母之間插入空格
    s = s.replace(/([\p{Script=Han}])([A-Za-z])/gu, '$1 $2');
    s = s.replace(/([A-Za-z])([\p{Script=Han}])/gu, '$1 $2');
    // 合併多個空白為一個
    s = s.replace(/\s+/g, ' ');
    return s;
}

export async function geocodeAddress(address: string) {
    if (!address) return null;
    const q = normalizeAddress(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
        headers: {
            // TODO: 請換成你的識別資訊（email 或網域）
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
