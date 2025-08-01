// src/types/order.ts
export type Buyer = {
    id: number;
    name: string;
    email: string;
    phone: string;
    rank: "member" | "gold" | "silver" | "bronze" | "diamond";
    avatar: string;
};

export type Product = {
    id: number;
    image: string | string[];
    name: string;
    price_at_time: string;
    quantity: number;
    subtotal: string;
};

export type Order = {
    id: number;
    created_at: string;
    order_status: "Pending" | "Delivered" | "Canceled";
    shipping_status: "Pending" | "Shipping" | "Delivered" | "Failed";
    buyer: Buyer;
    products: Product[];
    subtotal: number;
    discount: number;
    delivery: number;
    tax: number;
    total: number;
    cancel_reason?: string;
};
  