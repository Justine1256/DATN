import type { Product } from "./product";

// Trạng thái đơn hàng (order_status)
export enum OrderStatus {
    Pending = "Pending",                  // Đang chờ
    OrderConfirmation = "order confirmation", // Đang xác nhận
    Shipped = "Shipped",                  // Đang giao
    Delivered = "Delivered",              // Đã giao
    Canceled = "Canceled"                 // Đã huỷ
}

// Trạng thái giao hàng (shipping_status)
export enum ShippingStatus {
    Pending = "Pending",      // Chờ giao
    Shipping = "Shipping",    // Đang giao
    Delivered = "Delivered",  // Đã giao
    Failed = "Failed"         // Thất bại
}

export interface OrderDetail {
    id: number;
    order_id: number;
    price_at_time: string;
    quantity: number;
    subtotal: string;
    product: Product;
    reviewed?: boolean;  // Đã đánh giá hay chưa
    product_value?: string;
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
