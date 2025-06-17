// Giữ các enum tại đây

export enum OrderStatus {
    Processing = "processing",
    Shipping = "shipping",
    Delivered = "delivered",
    Canceled = "canceled",
    Pending = "pending"
}

export enum ShippingStatus {
    Pending = "pending",
    Preparing = "preparing",
    Shipping = "shipping",
    Delivered = "delivered",
    Failed = "failed",
    Returned = "returned"
}

export interface Product {
    id: number;
    name: string;
    quantity: number;
    price_at_time: string;
    image: string[];
    shop_id: number;
    description?: string;
    value1?: string;
    value2?: string;
    category_id?: number;
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
}
