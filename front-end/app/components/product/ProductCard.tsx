"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import { AiFillHeart, AiFillStar } from "react-icons/ai";
import { LoadingSkeleton } from "../loading/loading";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

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
  const isInWishlist = product
    ? wishlistProductIds.includes(product.id)
    : false;

  const [liked, setLiked] = useState(isInWishlist);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    setLiked(isInWishlist);
  }, [isInWishlist, product?.id]);

  if (!product) return <LoadingSkeleton />;

  const hasDiscount = !!(product.sale_price && product.sale_price > 0);
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const mainImage = formatImageUrl(product.image?.[0]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token) {
      setPopupMessage("Bạn cần đăng nhập để thêm vào yêu thích");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

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
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 2000);
          return;
        }

        if (!res.ok) throw new Error("Không thể thêm vào wishlist!");

        setPopupMessage("Đã thêm vào yêu thích");
        onLiked?.(product);
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
        onUnlike?.(product.id);
      }
    } catch (err) {
      console.error("❌ Lỗi xử lý wishlist:", err);
      setPopupMessage("Lỗi khi xử lý yêu thích");
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

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
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
    >
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {popupMessage}
        </div>
      )}

      {hasDiscount && discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-brand text-white text-[10px] px-2 py-0.5 rounded">
          -{discountPercentage}%
        </div>
      )}

      <button
        onClick={handleLike}
        className="absolute top-2 right-2 text-xl z-20 pointer-events-auto"
      >
        {liked ? (
          <AiFillHeart className="text-brand transition" />
        ) : (
          <FiHeart className="text-gray-500 transition" />
        )}
      </button>

      <div className="w-full h-[140px] mt-8 flex items-center justify-center">
        <Image
          src={mainImage}
          alt={product.name}
          width={150}
          height={20}
          className="object-contain max-h-[2220px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col mt-4 w-full px-1 pb-14">
        <h4 className="text-base font-semibold text-black leading-tight line-clamp-2 capitalize pointer-events-none">
          {product.name}
        </h4>

        <div className="flex gap-2 mt-1 items-center">
          <span className="text-brand font-bold text-base">
            {new Intl.NumberFormat("vi-VN").format(
              hasDiscount ? product.sale_price! : product.price
            )}
            đ
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-xs">
              {new Intl.NumberFormat("vi-VN").format(product.price)}đ
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <AiFillStar
                key={i}
                className={`w-4 h-4 ${i < Math.round(product.rating)
                    ? "text-yellow-500"
                    : "text-gray-300"
                  }`}
              />
            ))}
          <span className="text-gray-600 text-[10px]">({product.rating})</span>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className="absolute bottom-0 left-0 right-0 bg-brand text-white text-sm py-2.5 rounded-b-lg items-center justify-center gap-2 transition-all duration-300 hidden group-hover:flex"
      >
        <FiShoppingCart className="text-base" />
        Thêm Vào Giỏ Hàng
      </button>
    </div>
  );
}