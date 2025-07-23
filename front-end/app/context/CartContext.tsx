'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

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
    mergeLocalCartToServer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const normalizeImage = (img: string | string[]): string[] => {
        if (Array.isArray(img)) {
            return img.length > 0
                ? img.map(i => i?.trim() || `${STATIC_BASE_URL}/products/default-product.png`)
                : [`${STATIC_BASE_URL}/products/default-product.png`];
        }
        return [img?.trim() || `${STATIC_BASE_URL}/products/default-product.png`];
    };

    const reloadCart = useCallback(async () => {
        const token = Cookies.get('authToken');
        const local = localStorage.getItem('cart');
        const localCart = local ? JSON.parse(local) : [];

        if (!token) {
            const formattedLocal = localCart.map((item: any, idx: number) => ({
                id: item.id ?? idx,
                quantity: item.quantity,
                product: {
                    id: item.product?.id ?? item.product_id,
                    name: item.product?.name ?? item.name ?? '',
                    image: normalizeImage(item.product?.image ?? item.image ?? []),
                    price: Number(item.product?.price ?? item.price) || 0,
                    sale_price: item.product?.sale_price ?? item.sale_price ?? null,
                },
                variant: item.variant_id || item.variant?.id
                    ? {
                        id: item.variant?.id ?? item.variant_id,
                        option1: item.variant?.option1 ?? '',
                        option2: item.variant?.option2 ?? '',
                        value1: item.variant?.value1 ?? '',
                        value2: item.variant?.value2 ?? '',
                        price: Number(item.variant?.price ?? item.price) || 0,
                        sale_price: item.variant?.sale_price ?? item.sale_price ?? null,
                    }
                    : null,
            }));
            setCartItems(formattedLocal);
            return;
        }

        try {
            const res = await axios.get(`${API_BASE_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setCartItems(res.data);
        } catch (err) {
            console.error('❌ Lỗi tải giỏ hàng:', err);
        }
    }, []);

    useEffect(() => {
        const syncCartAcrossTabs = (event: StorageEvent) => {
            if (event.key === 'cart') {
                reloadCart();
            }
        };
        window.addEventListener('storage', syncCartAcrossTabs);
        return () => window.removeEventListener('storage', syncCartAcrossTabs);
    }, [reloadCart]);

    const removeCartItem = async (itemId: number) => {
        const token = Cookies.get('authToken');

        if (!token) {
            const local = localStorage.getItem('cart');
            let cart = local ? JSON.parse(local) : [];
            cart = cart.filter((item: any) => item.id !== itemId);
            localStorage.setItem('cart', JSON.stringify(cart));

            const updatedCart: CartItem[] = cart.map((item: any) => ({
                ...item,
                product: {
                    ...item.product,
                    price: item.product?.price || 0,
                    sale_price: item.product?.sale_price ?? null,
                    image: normalizeImage(item.product?.image),
                    name: item.product?.name ?? '',
                },
                variant: item.variant || null,
            }));
            setCartItems(updatedCart);

            window.dispatchEvent(new Event('cartUpdated'));
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            await reloadCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (err) {
            console.error('❌ Lỗi xóa sản phẩm khỏi giỏ hàng:', err);
        }
    };

    const mergeLocalCartToServer = async () => {
        const token = Cookies.get('authToken');
        if (!token) return;

        const local = localStorage.getItem('cart');
        const localCart = local ? JSON.parse(local) : [];

        if (localCart.length === 0) return;

        try {
            await Promise.all(
                localCart.map((item: any) =>
                    axios.post(`${API_BASE_URL}/cart`, item, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    })
                )
            );
            localStorage.removeItem('cart');
            await reloadCart();
        } catch (err) {
            console.error('❌ Lỗi đồng bộ local cart lên server:', err);
        }
    };

    return (
        <CartContext.Provider
            value={{ cartItems, setCartItems, reloadCart, removeCartItem, mergeLocalCartToServer }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
