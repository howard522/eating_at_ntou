// server/services/order.service.ts

import Order from "@server/models/order.model";
import type { FilterQuery } from "mongoose";
import type { IOrder } from "@server/interfaces/order.interface";
import { getMenuItemById } from "./restaurants.service";

export async function createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    const order = new Order(orderData);
    await order.save();
    return order;
}

/**
 * 根據使用者角色獲取訂單列表
 *
 * @param userId 使用者的 MongoDB ObjectId
 * @param role 使用者角色 ("customer" 或 "delivery")
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @returns 符合條件的訂單列表
 */
export async function getOrdersByUserRole(
    userId: string,
    role: "customer" | "delivery",
    options?: { limit?: number; skip?: number }
): Promise<IOrder[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;

    const query: FilterQuery<IOrder> = {};
    if (role === "customer") {
        query.user = userId;
    } else if (role === "delivery") {
        query.deliveryPerson = userId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);

    // for (let i = 0; i < orders.length; i++) {
    //     orders[i]?.items.forEach((item, j) => {
    //         const menu = getMenuItemById(
    //             item
    //         )
    //         orders[i]?.items[j]?.menuItemId;
    //         item.tot = item.quantity * item.unitPrice;
    //         orders[i].items[j] = item;
    //     });
    // }

    return orders;
}
