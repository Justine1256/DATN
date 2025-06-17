// types.ts
export enum OrderStatus {
    Processing = "processing",
    Shipping = "shipping",
    Delivered = "delivered",
    Canceled = "canceled", // Đảm bảo giá trị này có trong enum
    Pending = "pending"
}
  

export interface Product {
    id: number;
    name: string;
    quantity: number;
    price_at_time: string;
    image: string[];
    shop_id: number;
    description?: string;
    option1?: string;
    option2?: string;
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
    order_status: OrderStatus;  // Sử dụng enum ở đây
    shipping_status: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    shipping_address: string;
    order_details: OrderDetail[];
}
