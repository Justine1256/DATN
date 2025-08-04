'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FiHeart, FiShoppingCart, FiEye } from "react-icons/fi";
import { AiOutlineHeart } from "react-icons/ai";

import { AiFillHeart, AiFillStar } from "react-icons/ai";
import { LoadingSkeleton } from "../loading/loading";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { useWishlist } from "@/app/context/WishlistContext";

export interface Product {
  id: number;
  name: string;
  image: string[];
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: number;
  shop_slug: string;
  variants: any[];
  sold?: number;
  review_count?: number;
  rating_avg?: number | string;
}

const formatImageUrl = (img: unknown): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== "string" || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  if (img.startsWith("http")) return img;
  return img.startsWith("/")
    ? `${STATIC_BASE_URL}${img}`
    : `${STATIC_BASE_URL}/${img}`;
};
const formatNumberShort = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

export default function ProductCard({
  product,
  onUnlike,
  onLiked,
  wishlistProductIds = [],
}: {
  product?: Product;
  onUnlike?: (productId: number) => void;
  onLiked?: (product: Product) => void;
  wishlistProductIds?: number[];
}) {

  const router = useRouter();
  const { addItem, removeItem } = useWishlist();

  const isInWishlist = product ? wishlistProductIds.includes(product.id) : false;

  const [liked, setLiked] = useState(isInWishlist);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    setLiked(isInWishlist);
    // console.log("Product Data:", product);
    // ✅ Auto-select biến thể đầu tiên nếu có ít nhất 1 biến thể
    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }

  }, [isInWishlist, product?.id, product]);

  if (!product) return <LoadingSkeleton />;

  const getPrice = () => {
    if (selectedVariant) {
      return Number(selectedVariant.sale_price || selectedVariant.price).toLocaleString('vi-VN');
    }
    return Number(product.sale_price || product.price).toLocaleString('vi-VN');
  };

  const mainImage = formatImageUrl(product.image?.[0]);
  const ratingValue = Number(product.rating_avg ?? 0);
  const reviewCount = product.review_count ?? 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("token") || Cookies.get("authToken");

    if (!token) {
      setPopupMessage("Bạn cần đăng nhập để thêm vào yêu thích");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked); // UI phản hồi ngay lập tức

    try {
      if (newLiked) {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: product.id }),
        });

        if (res.status === 409) {
          setPopupMessage("Sản phẩm đã có trong danh sách yêu thích");
        } else if (!res.ok) {
          throw new Error("Không thể thêm vào wishlist!");
        } else {
          setPopupMessage("Đã thêm vào yêu thích");
          addItem(product);          // ✅ Cập nhật context ngay
          onLiked?.(product);        // ✅ Gọi callback nếu có
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/wishlist/${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Không thể xóa khỏi wishlist!");
        }

        setPopupMessage("Đã xóa khỏi yêu thích");
        removeItem(product.id);      // ✅ Cập nhật context ngay
        onUnlike?.(product.id);      // ✅ Gọi callback nếu có
      }
    } catch (err) {
      console.error("❌ Lỗi xử lý wishlist:", err);
      setPopupMessage("Đã xảy ra lỗi khi xử lý yêu thích");
      setLiked(!newLiked); // Khôi phục trạng thái nếu thất bại
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("token") || Cookies.get("authToken");

    if (!token) {
      setPopupMessage("Bạn cần đăng nhập để thêm vào giỏ hàng");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    if (!selectedVariant?.id) {
      setPopupMessage("Vui lòng chọn biến thể trước khi thêm vào giỏ hàng");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant.id,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Thêm vào giỏ hàng thất bại");
      }

      setPopupMessage(`Đã thêm "${product.name}" vào giỏ hàng!`);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", err);
      setPopupMessage(err.message || "Đã xảy ra lỗi khi thêm sản phẩm");
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  const handleViewDetail = () => {
    const shopSlug = product.shop_slug || (product as any)?.shop?.slug;
    router.push(`/shop/${shopSlug}/product/${product.slug}`);
  };

  return (
    <div
      onClick={handleViewDetail}
      className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 w-full max-w-[250px] flex flex-col justify-start mx-auto overflow-hidden transition cursor-pointer"
      style={{ minHeight: '250px' }}
    >
      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">

          {popupMessage}
        </div>
      )}

      {product.sale_price && (
        <div className="absolute top-2 left-2 bg-brand text-white text-[10px] px-2 py-0.5 rounded">
          -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
        </div>
      )}

      <button
        onClick={handleLike}
        className="absolute top-2 right-2 text-xl z-20 pointer-events-auto"
      >
        {liked ? (
          <AiFillHeart className="text-red-500 transition" />
        ) : (
          <AiOutlineHeart className="text-red-500 transition" />
        )}

      </button>



      <div className="w-full h-[150px] mt-8 flex items-center justify-center overflow-hidden">
        <Image
          src={mainImage}
          alt={product.name}
          width={150}
          height={150}
          className="object-contain md:w-[150px] md:h-[150px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col mt-8 w-full px-1 pb-4">
        <h4 className="text-base font-semibold text-black leading-tight capitalize pointer-events-none overflow-hidden whitespace-nowrap text-ellipsis">
          {product.name}
        </h4>

        <div className="flex gap-2 mt-1 items-center">
          <span className="text-brand font-bold text-base">
            {getPrice()}₫
          </span>
          {product.sale_price && (
            <span className="text-gray-400 line-through text-xs">
              {new Intl.NumberFormat("vi-VN").format(product.price)}đ
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm mt-2 flex-wrap gap-y-1">
          {/* ⭐ Hiển thị 1 ngôi sao minh họa + số sao + lượt đánh giá */}
          <div className="flex items-center gap-1 flex-wrap">
            {Number(ratingValue) > 0 ? (
              <>
                <AiFillStar className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 text-xs">{Number(ratingValue).toFixed(1)}</span>
                <span className="text-gray-500 text-xs ml-1">
                  ({formatNumberShort(product.review_count || 0)} lượt đánh giá)
                </span>

              </>
            ) : (
              <span className="text-[#db4444] text-xs font-semibold">
                Chưa đánh giá
              </span>
            )}
          </div>

          {/* 🔢 Đã bán */}
          <span className="text-gray-600 text-xs">
            {product.sold ? `Đã bán: ${formatNumberShort(product.sold)}` : "Chưa bán"}
          </span>

        </div>


      </div>
    </div>
  );

}

