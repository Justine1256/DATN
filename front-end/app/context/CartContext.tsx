'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

// ---------- Interfaces ----------
interface Product {
    id: number;
    name: string;
    image: string[] | string;
    price: number;
    sale_price?: number | null;
}

interface Variant {
    id: number;
    option1?: string;
    option2?: string;
    value1?: string;
    value2?: string;
    price: number;
    sale_price?: number | null;
}

export interface CartItem {
    id: number;
    quantity: number;
    product: Product;
    variant?: Variant | null;
}

interface CartContextType {
    cartItems: CartItem[];
    setCartItems: (items: CartItem[]) => void;
    reloadCart: () => Promise<void>;
    removeCartItem: (itemId: number) => Promise<void>; // ✅ Thêm chức năng xóa
}

// ---------- Context ----------
const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------- Provider ----------
export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const reloadCart = async () => {
        const token = Cookies.get("authToken");
        if (!token) return setCartItems([]);

        try {
            const res = await axios.get(`${API_BASE_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setCartItems(res.data);
        } catch (err) {
            console.error("❌ Lỗi tải giỏ hàng:", err);
        }
    };

    const removeCartItem = async (itemId: number) => {
        const token = Cookies.get("authToken");
        if (!token) return;

        try {
            await axios.delete(`${API_BASE_URL}/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            // ✅ Cập nhật ngay UI sau khi xoá
            setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        } catch (err) {
            console.error("❌ Lỗi xóa sản phẩm khỏi giỏ hàng:", err);
        }
    };

    useEffect(() => {
        reloadCart();
    }, []);

    return (
        <CartContext.Provider value={{ cartItems, setCartItems, reloadCart, removeCartItem }}>
            {children}
        </CartContext.Provider>
    );
};

// ---------- Hook ----------
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
