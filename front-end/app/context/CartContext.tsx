"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

interface Product {
    id: number;
    name: string;
    image: string[];
    price: number;
    sale_price?: number | null;
}

interface Variant {
    id: number;
    option1: string;
    option2?: string;
    value1: string;
    value2?: string;
    price: number;
    sale_price?: number | null;
}

export interface CartItem {
    id: number; // cart item id (optional if from API)
    quantity: number;
    product: Product;
    variant?: Variant | null;
}

interface CartContextType {
    cartItems: CartItem[];
    setCartItems: (items: CartItem[]) => void;
    reloadCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const reloadCart = async () => {
        const token = Cookies.get("authToken");
        if (!token) {
            const guestCart = localStorage.getItem("cart");
            if (guestCart) {
                const parsedCart = JSON.parse(guestCart).map((item: any) => ({
                    id: item.product_id,
                    quantity: item.quantity,
                    product: {
                        id: item.product_id,
                        name: item.name,
                        image: [item.image],
                        price: item.price,
                        sale_price: item.sale_price ?? null,
                    },
                    variant: item.variant_id
                        ? {
                            id: item.variant_id,
                            option1: "Phân loại 1",
                            option2: "Phân loại 2",
                            value1: item.value1,
                            value2: item.value2,
                            price: item.price,
                            sale_price: item.sale_price ?? null,
                        }
                        : null,
                }));
                setCartItems(parsedCart);
            } else {
                setCartItems([]);
            }
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setCartItems(data);
        } catch (error) {
            console.error("🔴 Lỗi lấy giỏ hàng:", error);
            setCartItems([]);
        }
    };

    useEffect(() => {
        reloadCart();
    }, []);

    return (
        <CartContext.Provider value={{ cartItems, setCartItems, reloadCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
