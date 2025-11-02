import mongoose from 'mongoose'
import { de } from 'vuetify/locale'

/**
 * 單一商品快照 (orderItemSchema)
 * 完全保留下單時的狀態，避免日後商品或餐廳資料變更影響舊訂單。
 */
const orderItemSchema = new mongoose.Schema({
    // 商品快照
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: false },
    name: { type: String, required: true },
    image: { type: String },
    info: { type: String },

    // 價格快照
    price: { type: Number, required: true }, // 單價
    quantity: { type: Number, required: true, default: 1 },

    // 餐廳快照
    restaurant: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false, index: true },//index方便查詢某餐廳的訂單
        name: { type: String }
    },
})

/**
 * 訂單主體 (orderSchema)
 * 以購物車內容為基礎生成。
 */
const orderSchema = new mongoose.Schema({
    // 下單者
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // 外送員（可為空，表示尚未接單）(外送員聯絡方式打api)
    deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null, index: true },

    // 商品快照陣列
    items: { type: [orderItemSchema], default: [] },

    // 結帳資訊
    total: { type: Number, required: true }, // 總金額
    deliveryFee: { type: Number, required: true }, // 外送費
    currency: { type: String, default: 'TWD' },


    // 外送資訊（配送地址／聯絡方式）
    deliveryInfo: {
        address: { type: String },
        contactName: { type: String },
        contactPhone: { type: String },
        note: { type: String },
    },

    // 訂單雙角色狀態
    customerStatus: {
        type: String,
        enum: ['preparing', 'on_the_way', 'received', 'completed'],
        default: 'preparing',
    },
    deliveryStatus: {
        type: String,
        enum: ['preparing', 'on_the_way', 'delivered', 'completed'],
        default: 'preparing',
    },

    // 系統紀錄
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

/**
 * pre-save hook：可根據 items 自動計算 total
 * （保險起見，即使前端算好，後端仍重新驗算一次）
 */
orderSchema.pre('save', function (next) {
    try {
        const doc: any = this
        if (Array.isArray(doc.items)) {
            const subtotal = doc.items.reduce(
                (sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1),
                0
            )
            doc.total = subtotal + (doc.deliveryFee || 0)
        }
        doc.updatedAt = new Date()
        next()
    } catch (e) {
        next(e as any)
    }
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
