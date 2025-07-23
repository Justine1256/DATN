'use client';

import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

interface Product {
    id: number;
    name: string;
    image: string[];
    price: number;
    sale_price?: number;
    slug: string;
    shop_slug: string;
    rating: number;
    reviewCount?: number;
    discount?: number;
    variants: any[];
}

interface WishlistItem {
    id: number;
    product_id: number;
    user_id: number;
    product: Product;
}

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    reloadWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

    const fetchWishlist = async () => {
        const token = Cookies.get("authToken");
        if (!token) {
            // ✅ Nếu không có token (đã đăng xuất) => reset wishlist
            setWishlistItems([]);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/wishlist`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            const validItems = data.filter((item: WishlistItem) => item.product !== null);
            setWishlistItems(validItems);
        } catch (error) {
            console.error("Lỗi fetch wishlist:", error);
        }
    };

    useEffect(() => {
        fetchWishlist();

        const handleWishlistUpdate = () => {
            fetchWishlist();
        };

        window.addEventListener("wishlistUpdated", handleWishlistUpdate);

        return () => {
            window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
        };
    }, []);

    const addItem = (product: Product) => {
        setWishlistItems((prev) => {
            const exists = prev.some((item) => item.product.id === product.id);
            if (exists) return prev;
            return [...prev, { id: product.id, product_id: product.id, user_id: 0, product }];
        });
    };

    const removeItem = (productId: number) => {
        setWishlistItems((prev) =>
            prev.filter((item) => item.product.id !== productId)
        );
    };

    const reloadWishlist = fetchWishlist;

    return (
        <WishlistContext.Provider
            value={{ wishlistItems, addItem, removeItem, reloadWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
};
