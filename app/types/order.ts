export type CustomerStatus = 'preparing' | 'on_the_way' | 'received' | 'completed'
export type DeliveryStatus = 'preparing' | 'on_the_way' | 'delivered' | 'completed'

export interface ApiOrderRestaurantSnapshot {
    id: string
    name: string
    phone?: string
    address?: string
}

export interface ApiOrderItem {
    menuItemId?: string
    name: string
    image?: string | null
    info?: string
    price?: number
    quantity: number
    restaurant: ApiOrderRestaurantSnapshot
}

export interface ApiDeliveryInfo {
    address: string
    contactName?: string
    contactPhone?: string
    note?: string
}

export interface ApiOrder {
    _id: string
    user: string
    items: ApiOrderItem[]
    total: number
    deliveryFee: number
    currency?: string
    arriveTime?: string
    customerStatus?: CustomerStatus
    deliveryStatus?: DeliveryStatus
    deliveryInfo: ApiDeliveryInfo
    createdAt: string
    updatedAt?: string
}

export interface ApiOrderAvailable extends ApiOrder {
    _distance?: number
}

export type ApiResponse<T> = { success: boolean; data: T }

// 前端展示用（共用）型別
export interface DisplayOrder {
    id: string
    status: string
    restaurantNames: string
    date?: string
    items?: { name: string; quantity: number }[]
    total?: number
    deliveryAddress?: string
    deliveryFee?: number
    arriveTime?: string
}

// 可接單列表的展示型別
export interface AvailableDisplayOrder {
    id: string
    restaurantNameDisplay: string
    restaurantNamesArray: string[]
    deliveryAddress: string
    deliveryFee: number
    deliveryTime: string
    createdAt: string
    distance?: number
}
