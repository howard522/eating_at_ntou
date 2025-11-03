import Cart from '../models/cart.model'

export async function clearUserCart(userId: string) {
    // Find the user's cart
    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
        return null
    }
    // if (cart.status === 'locked') {
    //     throw new Error('Cart is locked and cannot be cleared')
    // }
    // Clear cart items
    cart.items = []
    cart.total = 0
    cart.status = 'open'
    await cart.save()
    return cart
}