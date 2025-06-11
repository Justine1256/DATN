"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { LoadingShopInfo } from "../loading/loading";

// ✅ Interface dữ liệu cửa hàng
interface Shop {
  id: number;
  name: string;
  description: string;
  logo: string;
  phone: string;
  rating: string;
  total_sales: number;
  created_at: string;
  status: "activated" | "pending" | "suspended";
  email: string;
}

interface ShopInfoProps {
  shop: Shop;
  followed: boolean;
  onFollowToggle: () => void;
}

export default function ShopInfo({
  shop,
  followed,
  onFollowToggle,
}: ShopInfoProps) {
  const [popupText, setPopupText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // ✅ Bấm Flow
  const handleFollowClick = () => {
    onFollowToggle();
    setPopupText("Đã theo dõi shop");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  // ✅ Bấm Hủy theo dõi
  const handleUnfollowClick = () => {
    onFollowToggle();
    setPopupText("Đã bỏ theo dõi shop");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  if (!isLoaded) return <LoadingShopInfo />;

  return (
    <div className="mt-12 border rounded-lg bg-white p-6 relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* ✅ Trái: logo + tên + nút */}
        <div className="flex gap-4 items-start">
          <div className="relative w-20 h-20">
            <Image
              src={`/${shop.logo}`}
              alt="Shop"
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
            {!followed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handleFollowClick}
                  className="bg-[#DC4B47] text-white text-[11px] font-semibold px-2 py-[2px] rounded shadow hover:brightness-110 transition"
                >
                  Flow
                </button>
              </div>
            )}
          </div>

          {/* ✅ Tên shop + trạng thái + "Hủy theo dõi" */}
          <div className="text-black">
            <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
              {shop.name}
              {followed && (
                <button
                  onClick={handleUnfollowClick}
                  className="text-sm text-[#DC4B47] underline hover:text-red-600 transition"
                >
                  Hủy theo dõi
                </button>
              )}
            </h3>
            <p
              className={`font-medium text-sm ${
                shop.status === "activated"
                  ? "text-green-600"
                  : shop.status === "pending"
                  ? "text-yellow-500"
                  : "text-gray-500"
              }`}
            >
              {shop.status === "activated" && "Đang hoạt động"}
              {shop.status === "pending" && "Đang chờ duyệt"}
              {shop.status === "suspended" && "Tạm khóa"}
            </p>

            <div className="flex gap-2 mt-2">
              <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 3v18l4-4h14V3H2zm2 2h14v10H6l-2 2V5z" />
                </svg>
                Chat Ngay
              </button>
              <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Xem Shop
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Phải: Thông tin chia cột dọc */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 text-sm text-gray-800">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Đánh Giá:</span>
            <span className="text-red-500 font-semibold">
              {Number(shop.rating).toFixed(1)}
            </span>
            <span className="text-yellow-400 text-base">★</span>
          </div>
          <div className="w-px h-5 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Sản Phẩm:</span>
            <span className="text-red-500 font-semibold">{shop.total_sales}</span>
          </div>
          <div className="w-px h-5 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Phản Hồi:</span>
            <span className="text-red-500 font-semibold">Trong vài giờ</span>
          </div>
          <div className="w-px h-5 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Tham Gia:</span>
            <span className="text-red-500 font-semibold">
              {(() => {
                const createdAt = new Date(shop.created_at);
                const now = new Date();
                const diffMs = now.getTime() - createdAt.getTime();
                const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const months = Math.floor(days / 30);
                const years = Math.floor(days / 365);
                if (days <= 1) return "1 ngày";
                if (years >= 1) return `${years} năm`;
                if (months >= 1) return `${months} tháng`;
                return `${days} ngày`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Popup feedback */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#DC4B47] animate-slideInFade">
          {popupText}
        </div>
      )}
    </div>
  );
}
