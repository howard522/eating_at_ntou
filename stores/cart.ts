import { defineStore } from 'pinia';
import { useUserStore } from "./user";

export interface CartMenuItem {
    menuItemId: string;
    name: string;
    price: number;
    image: string;
    info: string;
}

export interface CartItem extends CartMenuItem {
    quantity: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartState {
    items: CartItem[];
    deliveryAddress: string;
    phoneNumber: string;
    receiveName: string;
    note: string;
    deliveryFee: number;
    arriveTime: Date;
}

export const useCartStore = defineStore('cart', {
    state: (): CartState => ({
        items: [],
        deliveryAddress: '',
        phoneNumber: '',
        receiveName: '',
        deliveryFee: 30,
        arriveTime: new Date(Date.now() + 30 * 60 * 1000),
        note: '',
    }),
    actions: {
        async fetchCart() {
            const userStore = useUserStore();
            if (!userStore.token) {
                console.log('User not logged in, skipping cart fetch.');
                return;
            }
            try {
                const { data } = await useFetch<{ success: boolean, data: { items: CartItem[] }}>('/api/cart', {
                    headers: {
                        'Authorization': `Bearer ${userStore.token}`,
                        'Accept': 'application/json',
                    },
                });
                if (data.value && data.value.data && data.value.data.items) {
                    this.items = data.value.data.items;
                }

            } catch (err) {
                console.error('Error fetching cart:', err);
            }
        },
        async syncCartWithDB() {
            const userStore = useUserStore();
            if (!userStore.token) {
                console.log('User not logged in, skipping cart sync.');
                return;
            }
            const apiItems = this.items.map(item => ({
                restaurantId: item.restaurantId,
                restaurantName: item.restaurantName,
                quantity: item.quantity,
                menuItemId: item.menuItemId,
                name: item.name,
                price: item.price,
                image: item.image,
                info: item.info,
            }));
            try {
                await useFetch('/api/cart/items', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userStore.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        items: apiItems,
                    },
                });
            } catch (err) {
                console.error('Error syncing cart with DB:', err);
            }
        },
        addItem(newItem: CartMenuItem, quantity: number, restaurant: { id: string, name: string }) {
            const existingItem = this.items.find(item => item.menuItemId === newItem.menuItemId);
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
            this.syncCartWithDB().then();
        },
        setDeliveryDetails(details: { address: string, phone: string, receiveName: string, note: string }) {
            this.deliveryAddress = details.address;
            this.phoneNumber = details.phone;
            this.receiveName = details.receiveName;
            this.note = details.note;
            this.saveToStorage();
        },
        setDeliveryFee(fee: number) {
            this.deliveryFee = fee;
            this.saveToStorage();
        },
        updateItemQuantity(itemId: string, newQuantity: number) {
            const item = this.items.find(item => item.menuItemId === itemId);
            if (item) {
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                } else {
                    // 如果數量小於等於 0，就移除該品項
                    const itemIndex = this.items.findIndex(i => i.menuItemId === itemId);
                    if (itemIndex > -1) {
                        this.items.splice(itemIndex, 1);
                    }
                }
                this.syncCartWithDB().then();
            }
        },
        removeRestaurantItems(restaurantName: string) {
            const initialLength = this.items.length;
            this.items = this.items.filter(item => item.restaurantName !== restaurantName);
            if (this.items.length < initialLength) {
                this.syncCartWithDB().then();
            }
        },
        removeItem(itemId: string) {
            const initialLength = this.items.length;
            this.items = this.items.filter(item => item.menuItemId !== itemId);
            if (this.items.length < initialLength) {
                this.syncCartWithDB().then();
            }
        },
        clearCart() {
            const userStore = useUserStore();
            if (this.items.length > 0) {
                this.items = [];
                this.setDeliveryDetails({
                    address: userStore.info?.address || '',
                    phone: userStore.info?.phone || '',
                    receiveName: userStore.info?.name || '',
                    note: '',});
                // 後端才做清DB
                // this.syncCartWithDB().then();
            }
        },
        saveToStorage() {
            const deliveryInfo = {
                deliveryAddress: this.deliveryAddress,
                phoneNumber: this.phoneNumber,
                receiveName: this.receiveName,
                note: this.note,
                deliveryFee: this.deliveryFee,
            };
            localStorage.setItem('cartDeliveryInfo', JSON.stringify(deliveryInfo))
        },
        loadFromStorage() {
            const data = localStorage.getItem('cartDeliveryInfo')
            if (data) this.$patch(JSON.parse(data))
        },
        initialize() {
            this.loadFromStorage()
        }
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