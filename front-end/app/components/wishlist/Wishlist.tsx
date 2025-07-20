'use client';

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import ProductCard from "../product/ProductCard";
import { API_BASE_URL } from '@/utils/api';
import { useRouter } from 'next/navigation'; // To navigate to product details

// ✅ Kiểu dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  image: string[]; // Đảm bảo image là mảng chuỗi
  slug: string;
  price: number;
  oldPrice: number;
  sale_price?: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  reviewCount?: number;
  shop_slug: string;
  variants: any[];
}

// ✅ Kiểu dữ liệu mỗi item trong wishlist
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

  // ✅ Check token hợp lệ
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) {
      setLoading(false);
      return;
    }

    // Only fetch wishlist if token exists
    fetchWishlist(token);
  }, []);

  // ✅ Fetch wishlist data
const fetchWishlist = (token: string) => {
  fetch(`${API_BASE_URL}/wishlist`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Không thể lấy wishlist!");
      return res.json();
    })
    .then((data: WishlistItem[]) => {
      // ✅ Lọc ra những item có product hợp lệ
      const validData = data.filter((item) => item.product !== null);

      // ✅ Log toàn bộ mảng wishlist
      console.log("✅ Dữ liệu wishlist fetch được:", validData);

      // ✅ Log từng sản phẩm để kiểm tra rating và lượt đánh giá
      validData.forEach((item, index) => {
        const p = item.product;
        console.log(`🔍 Sản phẩm ${index + 1}:`, {
          id: p.id,
          name: p.name,
          rating_avg: p.rating_avg,
          review_count: p.review_count,
        });
      });

      // ✅ Cập nhật state
      setWishlistItems(validData);
      setLoading(false);
    })
    .catch((error) => {
      console.error("❌ Lỗi lấy wishlist:", error);
      setLoading(false);
    });
};


  // ✅ Gỡ sản phẩm khỏi danh sách hiển thị khi đã unlike (xóa khỏi UI)
  const removeItem = (productId: number) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.product?.id !== productId)

    );
  };

  // ✅ Thêm sản phẩm vào danh sách nếu được like từ ProductCard (thêm vào UI)
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

  // ✅ Trích danh sách product_id để truyền xuống ProductCard
  const wishlistProductIds = wishlistItems
    .map((item) => item.product?.id)
    .filter((id): id is number => id !== undefined);

  // ✅ Navigate to product detail page
  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`); // Navigate to product details page using the slug
  };

  return (
    <div className="container mx-auto px-4">
      {/* ✅ Khoảng trắng phía trên */}
      <div className="py-6" />

      {/* ✅ Tiêu đề & Nút hành động */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-black">
          Danh sách yêu thích ({wishlistItems.length})
        </h2>
        <button className="px-6 py-2 border border-gray-300 text-black text-sm font-medium rounded transition-colors duration-300 ease-in-out hover:bg-[#DB4444] hover:text-white">
          Di chuyển tất cả vào Giỏ hàng
        </button>
      </div>

      {/* ✅ Hiển thị nội dung */}
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
              key={item.id}
              product={item.product}
              onUnlike={removeItem} // ✅ Gỡ khỏi UI nếu bỏ like
              onLiked={addItem} // ✅ Thêm vào UI nếu click ❤️
              wishlistProductIds={wishlistProductIds} // ✅ Kiểm tra hiện trạng ❤️
             
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
