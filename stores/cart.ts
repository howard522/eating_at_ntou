import { defineStore } from 'pinia';

export interface CartMenuItem {
    _id: string;
    name: string;
    price: number;
    image: string;
    info: string;
}

export interface CartItem extends CartMenuItem {
    quantity: number;
    restaurantId: string;
    restaurantName: string;
    receiveName: string;
}

interface CartState {
    items: CartItem[];
    deliveryAddress: string;
    phoneNumber: string;
    deliveryFree: number;
}

export const useCartStore = defineStore('cart', {
    state: (): CartState => ({
        items: [],
        deliveryAddress: '',
        phoneNumber: '',
        receiveName: '',
        deliveryFree: 30,
    }),
    actions: {
        addItem(newItem: CartMenuItem, quantity: number, restaurant: { id: string, name: string }) {
            const existingItem = this.items.find(item => item._id === newItem._id);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.items.push({
                    ...newItem,
                    quantity,
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                });
            }
        },
        setDeliveryDetails(details: { address: string, phone: string, receiveName: string }) {
            this.deliveryAddress = details.address;
            this.phoneNumber = details.phone;
            this.receiveName = details.receiveName;
        },
        setDeliveryFree(free: number) {
            this.deliveryFree = free;
        },
        updateItemQuantity(itemId: string, newQuantity: number) {
            const item = this.items.find(item => item._id === itemId);
            if (item) {
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                } else {
                    // 如果數量小於等於 0，就移除該品項
                    const itemIndex = this.items.findIndex(i => i._id === itemId);
                    if (itemIndex > -1) {
                        this.items.splice(itemIndex, 1);
                    }
                }
            }
        },
        removeItem(itemId: string) {
            this.items = this.items.filter(item => item._id !== itemId);
        },
        clearCart() {
            this.items = [];
            this.receiveName = '';
        },
    },
    getters: {
        // 商品總數量
        totalItemsCount(state): number {
            return state.items.reduce((total, item) => total + item.quantity, 0);
        },
        // 計算總金額
        totalPrice(state): number {
            return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
    },
});