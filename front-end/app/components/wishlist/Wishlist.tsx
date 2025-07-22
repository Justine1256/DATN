'use client';

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';
import ProductCard from "../product/ProductCard";
import { API_BASE_URL } from '@/utils/api';
import type { Product } from "../product/ProductCard";


interface WishlistItem {
  id: number;
  product_id: number;
  user_id: number;
  product: Product;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchWishlist(token);
  }, []);

  const fetchWishlist = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Không thể lấy wishlist!");

      const data: WishlistItem[] = await res.json();
      const validData = data.filter((item) => item.product !== null);

      setWishlistItems(validData);
    } catch (error) {
      console.error("❌ Lỗi lấy wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (productId: number) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.product?.id !== productId)
    );
  };

  const addItem = (product: Product) => {
    setWishlistItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) return prev;
      return [
        ...prev,
        { id: product.id, product_id: product.id, user_id: 0, product },
      ];
    });
  };

  const wishlistProductIds = wishlistItems
    .map((item) => item.product?.id)
    .filter((id): id is number => id !== undefined);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-black">
          Danh sách yêu thích ({wishlistItems.length})
        </h2>
        <button className="px-6 py-2 border border-gray-300 text-black text-sm font-medium rounded transition hover:bg-[#DB4444] hover:text-white">
          Di chuyển tất cả vào Giỏ hàng
        </button>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : wishlistItems.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          Hiện tại bạn chưa có sản phẩm yêu thích nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.product.id}
              product={item.product}
              onUnlike={removeItem}
              onLiked={addItem}
              wishlistProductIds={wishlistProductIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
