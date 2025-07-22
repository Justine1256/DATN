'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

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
    removeCartItem: (itemId: number) => Promise<void>;
}

// ---------- Context ----------
const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------- Provider ----------
export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Chuẩn hóa ảnh (nếu rỗng hoặc không hợp lệ sẽ lấy ảnh mặc định)
    const normalizeImage = (img: string | string[]): string[] => {
        if (Array.isArray(img)) {
            if (img.length === 0) return [`${STATIC_BASE_URL}/products/default-product.png`];
            return img.map(i => (i && i.trim() ? i : `${STATIC_BASE_URL}/products/default-product.png`));
        }
        if (!img || !img.trim()) return [`${STATIC_BASE_URL}/products/default-product.png`];
        return [img];
    };

    // Tải lại giỏ hàng (tự đồng bộ localStorage lên API nếu đăng nhập)
    const reloadCart = async () => {
        const token = Cookies.get("authToken");
        const local = localStorage.getItem("cart");
        const localCart = local ? JSON.parse(local) : [];

        if (!token) {
            // Chưa đăng nhập => trả về localStorage đã chuẩn hóa
            const normalizedLocalCart = localCart.map((item: any, idx: number) => ({
                ...item,
                id: item.id ?? idx,
                product: {
                    id: item.product_id,
                    name: item.name,
                    image: normalizeImage(item.image),
                    price: Number(item.price) || 0,
                    sale_price: item.sale_price ?? null,
                },
                variant: item.variant_id
                    ? {
                        id: item.variant_id,
                        value1: item.value1,
                        value2: item.value2,
                        price: Number(item.price) || 0,
                        sale_price: item.sale_price ?? null,
                    }
                    : null,
                quantity: item.quantity,
            }));

            setCartItems(normalizedLocalCart);
            return;
        }

        try {
            // Đã đăng nhập
            if (localCart.length > 0) {
                // Đồng bộ localCart lên API
                await Promise.all(
                    localCart.map(item =>
                        axios.post(`${API_BASE_URL}/cart`, item, {
                            headers: { Authorization: `Bearer ${token}` },
                            withCredentials: true,
                        })
                    )
                );
                // Xóa localStorage sau khi đồng bộ
                localStorage.removeItem("cart");
            }

            // Lấy giỏ hàng mới nhất từ API
            const res = await axios.get(`${API_BASE_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setCartItems(res.data);
        } catch (err) {
            console.error("❌ Lỗi tải giỏ hàng:", err);
            // Nếu lỗi thì fallback về localCart
            const normalizedLocalCart = localCart.map((item: any, idx: number) => ({
                ...item,
                id: item.id ?? idx,
                product: {
                    id: item.product_id,
                    name: item.name,
                    image: normalizeImage(item.image),
                    price: Number(item.price) || 0,
                    sale_price: item.sale_price ?? null,
                },
                variant: item.variant_id
                    ? {
                        id: item.variant_id,
                        value1: item.value1,
                        value2: item.value2,
                        price: Number(item.price) || 0,
                        sale_price: item.sale_price ?? null,
                    }
                    : null,
                quantity: item.quantity,
            }));
            setCartItems(normalizedLocalCart);
        }
    };

    // Xóa sản phẩm khỏi giỏ hàng
    const removeCartItem = async (itemId: number) => {
        const token = Cookies.get("authToken");
        if (!token) {
            // Xóa local cart và cập nhật UI ngay
            const local = localStorage.getItem("cart");
            let cart = local ? JSON.parse(local) : [];
            cart = cart.filter((item: any) => item.id !== itemId);

            // Chuẩn hóa cart trước khi cập nhật state
            const normalizedCart: CartItem[] = cart.map((item: any) => ({
                ...item,
                product: {
                    ...item.product,
                    sale_price: item.product?.sale_price ?? null,
                    price: item.product?.price ?? 0,
                    image: normalizeImage(item.product?.image),
                    name: item.product?.name ?? '',
                },
                variant: item.variant || null,
            }));

            localStorage.setItem("cart", JSON.stringify(cart));
            setCartItems(normalizedCart);
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            // Cập nhật UI ngay, xóa luôn item khỏi state
            setCartItems(prev => {
                const filtered = prev.filter(item => item.id !== itemId);
                console.log("Cart sau khi xóa:", filtered);
                return filtered;
            });
        } catch (err) {
            console.error("❌ Lỗi xóa sản phẩm khỏi giỏ hàng:", err);
        }
    };


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
