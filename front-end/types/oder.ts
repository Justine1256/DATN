import type { Product } from "./product";

export enum OrderStatus {
    Pending = "Pending",
    OrderConfirmation = "order confirmation",
    Shipped = "Shipped",
    Delivered = "Delivered",
    Canceled = "Canceled"
}

export enum ShippingStatus {
    Pending = "Pending",
    Shipping = "Shipping",
    Delivered = "Delivered"
}

export interface OrderDetail {
    id: number;
    order_id: number;
    price_at_time: string;
    quantity: number;
    subtotal: string;
    product: Product;
}

export interface Order {
    id: number;
    final_amount: string;
    order_status: OrderStatus;
    shipping_status: ShippingStatus;
    payment_method: string;
    payment_status: string;
    created_at: string;
    shipping_address: string;
    order_details: OrderDetail[];
    shop_name: string;
}
