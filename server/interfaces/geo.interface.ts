// server/interfaces/geoPoint.interface.ts

/**
 * GeoJSON 點位介面
 *
 * type: 固定為 "Point"
 * coordinates: 經緯度陣列 [經度, 緯度]
 */
export interface IGeoPoint {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
}
