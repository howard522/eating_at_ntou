import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: false },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // price snapshot in cents
    quantity: { type: Number, required: true, default: 1 },
    options: { type: mongoose.Schema.Types.Mixed } // arbitrary options / modifiers
})

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    currency: { type: String, default: 'TWD' },
    total: { type: Number, default: 0 }, // total in cents
    // status meanings:
    // - 'open': 使用者正在編輯購物車 (仍可修改)
    // - 'locked': 使用者已送出下單請求，購物車暫時鎖定（後續會有訂單流程把該購物車清空或轉為訂單）
    status: {
        type: String,
        enum: ['open', 'locked'],
        default: 'open'
    }
}, { timestamps: true })

// calculate total before save if items changed
cartSchema.pre('save', function (next) {
    try {
        const doc: any = this
        if (doc.items && Array.isArray(doc.items)) {
            doc.total = doc.items.reduce((sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1), 0)
        }
        return next()
    } catch (e) {
        return next(e as any)
    }
})

export default mongoose.models.Cart || mongoose.model('Cart', cartSchema)
