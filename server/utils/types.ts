// server/utils/types.ts

export interface GeoPoint {
    type: 'Point'
    coordinates: [number, number]
}

// 更新餐廳資訊用 
export interface UpdateRestaurantBody {
    name?: string
    address?: string
    phone?: string
    image?: string
    info?: string
    tags?: string[]
    locationGeo?: GeoPoint
}

// 更新菜單項目用（新 API 用）
export interface UpdateMenuItemBody {
    name?: string
    price?: number
    image?: string
    info?: string
}
