// server/interfaces/geoPoint.interface.ts

export interface IGeoPoint {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
}
