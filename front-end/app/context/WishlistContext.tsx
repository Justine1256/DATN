'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

// ✅ Định nghĩa kiểu sản phẩm
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
    variants: any[]; // Nếu có thể, bạn nên định nghĩa rõ Variant
}

// ✅ Kiểu WishlistItem
interface WishlistItem {
    id: number;
    product_id: number;
    user_id: number;
    product: Product;
}

// ✅ Kiểu context
interface WishlistContextType {
    wishlistItems: WishlistItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    reloadWishlist: () => void;
}

// ✅ Khởi tạo context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// ✅ Provider
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

    // ✅ Kiểm tra đã đăng nhập chưa
    const isLoggedIn = useCallback((): boolean => {
        return !!Cookies.get('authToken');
    }, []);

    // ✅ Gọi API lấy danh sách yêu thích
    const fetchWishlist = useCallback(async () => {
        if (!isLoggedIn()) {
            setWishlistItems([]);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/wishlist`, {
                headers: {
                    Authorization: `Bearer ${Cookies.get('authToken')}`,
                },
            });

            const data: WishlistItem[] = await res.json();
            const validItems: WishlistItem[] = data.filter((item: WishlistItem) => item.product !== null);

            // ✅ Tránh setState nếu không có thay đổi
            setWishlistItems((prev: WishlistItem[]) => {
                const prevIds = prev.map((i: WishlistItem) => i.product_id).sort().join(',');
                const newIds = validItems.map((i: WishlistItem) => i.product_id).sort().join(',');
                return prevIds === newIds ? prev : validItems;
            });
        } catch (error) {
            console.error('❌ Lỗi fetch wishlist:', error);
        }
    }, [isLoggedIn]);

    // ✅ Lắng nghe sự kiện reload wishlist
    useEffect(() => {
        fetchWishlist();

        let debounceTimer: NodeJS.Timeout | null = null;

        const handleWishlistUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchWishlist();
                debounceTimer = null;
            }, 300);
        };

        window.addEventListener('wishlistUpdated', handleWishlistUpdate);

        return () => {
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [fetchWishlist]);

    // ✅ Thêm sản phẩm vào wishlist context
    const addItem = useCallback((product: Product): void => {
        setWishlistItems((prev: WishlistItem[]) => {
            if (prev.some((item: WishlistItem) => item.product.id === product.id)) return prev;
            return [
                ...prev,
                {
                    id: product.id,
                    product_id: product.id,
                    user_id: 0,
                    product,
                },
            ];
        });
    }, []);

    // ✅ Xoá sản phẩm khỏi wishlist context
    const removeItem = useCallback((productId: number): void => {
        setWishlistItems((prev: WishlistItem[]) =>
            prev.filter((item: WishlistItem) => item.product.id !== productId)
        );
    }, []);

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                addItem,
                removeItem,
                reloadWishlist: fetchWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

// ✅ Hook tiện dụng
export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
