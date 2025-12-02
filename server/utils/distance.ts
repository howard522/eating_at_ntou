const EARTH_RADIUS = 6371e3; // 地球半徑 (m)

// 轉換度數到弧度
function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Haversine formula 計算兩點距離（公尺)，因為 mongoDB 的 geoNear 在這種間接查詢無法使用
// 所以我問chat，然後抄下來的
export function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
    let [lon1, lat1] = coord1;
    let [lon2, lat2] = coord2;

    lat1 = deg2rad(lat1);
    lat2 = deg2rad(lat2);

    const deltaLat = deg2rad(lat2 - lat1);
    const deltaLon = deg2rad(lon2 - lon1);

    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
}
