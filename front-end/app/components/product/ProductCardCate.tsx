'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AiFillHeart, AiFillStar, AiOutlineHeart } from "react-icons/ai";
import { LoadingSkeleton } from "../loading/loading";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

// ✅ Kiểu dữ liệu sản phẩm
export interface Product {
  id: number;
  name: string;
  image: string[];
  slug: string;
  price: number;
  sale_price?: number;
  oldPrice?: number;
  rating: string | number;
  rating_avg?: number;
  review_count?: number;
  discount?: number;
  shop_slug?: string;
  shop_id?: number;
  category_id?: number;
  createdAt?: number;
  updated_at?: string;
  sold?: number;
  shop?: {
    name?: string;
    logo?: string;
    slug?: string;
  };
  shop_name?: string;
  shop_logo?: string;
}

// ✅ Rút gọn số (VD: 1000 => 1k)
const formatNumberShort = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

// ✅ Format URL ảnh
const formatImageUrl = (img: unknown): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== "string" || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  return img.startsWith("http") ? img : `${STATIC_BASE_URL}/${img.replace(/^\//, '')}`;
}

export default function ProductCardCate({
  product,
  onLiked,
  wishlistProductIds = [],
}: {
  product?: Product;
  onLiked?: (product: Product) => void;
  wishlistProductIds?: number[];
}) {
  const router = useRouter();

  const isInWishlist = product ? wishlistProductIds.includes(product.id) : false;
  const [liked, setLiked] = useState(isInWishlist);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setLiked(isInWishlist);
  }, [isInWishlist, product?.id]);

  if (!product) return <LoadingSkeleton />;

  const ratingValue = Number(product.rating_avg ?? 0);
  const mainImage = formatImageUrl(product.image?.[0]);

  const getPrice = () => {
    const price = product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // 🔹 Lấy thông tin shop linh hoạt
  const shopObj: any = product.shop ?? {};
  const shopSlug = product.shop_slug || shopObj.slug;
  const shopName = shopObj.name || product.shop_name || "Shop";
  const shopLogo = formatImageUrl(shopObj.logo || product.shop_logo);

  // ✅ Xử lý yêu thích
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;

    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token) {
      setPopupMessage("Bạn cần đăng nhập để thêm vào yêu thích");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    setIsLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);

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
          setLiked(true);
        } else if (!res.ok) {
          throw new Error("Không thể thêm vào wishlist!");
        } else {
          setPopupMessage("Đã thêm vào yêu thích");
          onLiked?.(product);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/wishlist/${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể xóa khỏi wishlist!");
        setPopupMessage("Đã xóa khỏi yêu thích");
      }
    } catch (err) {
      console.error("❌ Lỗi xử lý wishlist:", err);
      setPopupMessage("Lỗi khi xử lý yêu thích");
      setLiked(!newLiked);
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      setIsLiking(false);
    }
  };

  // ✅ Chuyển đến trang chi tiết sản phẩm
  const handleViewDetail = () => {
    router.push(`/shop/${shopSlug}/product/${product.slug}`);
  };

  // ✅ Chuyển đến trang shop
  const handleGoShop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shopSlug) return;
    router.push(`/shop/${shopSlug}`);
  };

  return (
    <div
      onClick={handleViewDetail}
      className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 w-full max-w-[240px] flex flex-col justify-start mx-auto overflow-hidden transition cursor-pointer"
      style={{ minHeight: "250px" }}
    >
      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
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
        disabled={isLiking}
        className={`absolute top-2 right-2 text-xl z-20 pointer-events-auto transition ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {liked ? <AiFillHeart className="text-red-500 transition" /> : <AiOutlineHeart className="text-red-500 transition" />}
      </button>

      <div className="w-full h-[150px] mt-4 flex items-center justify-center overflow-hidden">
        <Image
          src={mainImage}
          alt={product.name}
          width={150}
          height={150}
          className="object-contain max-h-[150px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col mt-4 w-full px-1 pb-4">
        <h4 className="text-sm font-semibold text-black leading-tight capitalize pointer-events-none overflow-hidden whitespace-nowrap text-ellipsis">
          {product.name}
        </h4>

        {/* 🔥 NEW: Logo + tên shop */}
        <button
          onClick={handleGoShop}
          className="mt-1 inline-flex items-center gap-2 text-xs text-gray-700 hover:text-brand transition pointer-events-auto"
        >
          <span className="relative w-5 h-5 overflow-hidden rounded-full border border-gray-200 bg-white shrink-0">
            <Image src={shopLogo} alt={shopName} width={20} height={20} className="object-cover" />
          </span>
          <span className="font-medium truncate max-w-[160px]">{shopName}</span>
        </button>

        <div className="flex gap-2 mt-2 items-center">
          <span className="text-brand font-bold text-base">{getPrice()}₫</span>
          {product.sale_price && (
            <span className="text-gray-400 line-through text-xs">
              {new Intl.NumberFormat("vi-VN").format(product.price)}đ
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm mt-2 flex-wrap gap-y-1">
          <div className="flex items-center gap-1 flex-wrap">
            {Number(ratingValue) > 0 && (product.review_count ?? 0) > 0 ? (
              <>
                <AiFillStar className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 text-xs">{Number(ratingValue).toFixed(1)}</span>
                <span className="text-gray-500 text-xs ml-1">
                  ({formatNumberShort(product.review_count ?? 0)} lượt đánh giá)
                </span>
              </>
            ) : (
              <span className="text-[#db4444] text-xs font-semibold">Chưa đánh giá</span>
            )}
          </div>
          <span className="text-gray-600 text-xs">
            {product.sold ? `Đã bán: ${formatNumberShort(product.sold)}` : "Chưa bán"}
          </span>
        </div>
      </div>
    </div>
  );
}
