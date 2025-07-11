'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Link from 'next/link'; // Import the Link component

interface Shop {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  phone: string;
  rating: string;
  total_sales: number;
  created_at: string;
  status: 'activated' | 'pending' | 'suspended';
  email: string;
  slug: string;
  user_id: number;
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
interface ShopInfoProps {
  shop: Shop | undefined;
  followed: boolean;
  onFollowToggle: () => void;
}

export default function ShopInfo({
  shop,
  followed,
  onFollowToggle,
}: ShopInfoProps) {
  const [popupText, setPopupText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => { }, 500);
    return () => clearTimeout(timeout);
  }, []);

  if (!shop) return <div>Shop không tồn tại</div>;

  const handleFollowClick = () => {
    onFollowToggle();
    setPopupText('Đã theo dõi shop');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleUnfollowClick = () => {
    onFollowToggle();
    setPopupText('Đã bỏ theo dõi shop');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className="mt-12 border rounded-lg bg-white p-4 sm:p-6 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        {/* Left: logo + name + follow button */}
        <div className="flex gap-4 flex-shrink-0">
          <div className="cursor-pointer relative w-21 h-20">
            {/* Add a Link around the logo to navigate to the shop page */}
            <Link href={`/shop/${shop.slug}`}>
              <div className="w-[60px] h-[60px] rounded-full overflow-hidden">
                <Image
                  src={shop.logo ? formatImageUrl(shop.logo) : `${STATIC_BASE_URL}/avatars/default-avatar.png`}
                  alt="Logo"
                  width={60}
                  height={60}
                  className="object-cover w-full h-full"
                />
              </div>
            </Link>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              {!followed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowClick();
                  }}
                  className="bg-[#DC4B47] text-white text-[18px] font-semibold w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-[#FF5733] transition-all hover:scale-110"
                >
                  +
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowClick();
                  }}
                  className="bg-[#DC4B47] text-white text-[18px] font-semibold w-8 h-8 rounded-full flex items-center justify-center shadow-md animate-rotate-to-check"
                >
                  <span className="text-[14px]">✔</span>
                </button>
              )}
            </div>
          </div>

          {/* Shop name + status + unfollow button */}
          <div className="text-black max-w-[200px] sm:max-w-none">
            <h3 className="text-xl font-semibold mb-1 flex items-center gap-2 flex-wrap">
              {/* Wrap the shop name in a Link component */}
              <Link href={`/shop/${shop.slug}`} className="relative group text-black hover:text-[#DC4B47] transition-colors duration-300">
                <span>{shop.name}</span>
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#DC4B47] transition-all duration-300 group-hover:w-full"></span>
              </Link>

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
              className={`font-medium text-sm ${shop.status === 'activated'
                ? 'text-green-600'
                : shop.status === 'pending'
                  ? 'text-yellow-500'
                  : 'text-gray-500'
                }`}
            >
              {shop.status === 'activated' && 'Đang hoạt động'}
              {shop.status === 'pending' && 'Đang chờ duyệt'}
              {shop.status === 'suspended' && 'Tạm khóa'}
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
<button
  onClick={() => {
    const receiverId = shop.user_id;
    const receiverName = shop.name;
    const avatar = shop.logo || '';
    
    // Gọi tới chat box bằng custom event
    window.dispatchEvent(new CustomEvent('open-chat-box', {
      detail: { receiverId, receiverName, avatar }
    }));
  }}
  className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1"
>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2 3v18l4-4h14V3H2zm2 2h14v10H6l-2 2V5z" />
  </svg>
  Chat Ngay
</button>



              <button
                onClick={() => router.push(`/shop/${shop.slug}`)}
                className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Xem Shop
              </button>
            </div>
          </div>
        </div>

        {/* Right: additional info */}
        <div className="flex flex-wrap gap-y-2 gap-x-6 mt-6 md:mt-0 text-sm text-gray-800">
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Đánh Giá:</span>
            <span className="text-red-500 font-semibold">
              {Number(shop.rating).toFixed(1)}
            </span>
            <span className="text-yellow-400 text-base">★</span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Sản Phẩm:</span>
            <span className="text-red-500 font-semibold">
              {shop.total_sales}
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Phản Hồi:</span>
            <span className="text-red-500 font-semibold">Trong vài giờ</span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Tham Gia:</span>
            <span className="text-red-500 font-semibold">
              {(() => {
                const createdAt = new Date(shop.created_at);
                const now = new Date();
                const diff = now.getTime() - createdAt.getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                const months = Math.floor(days / 30);
                const years = Math.floor(days / 365);
                if (days <= 1) return '1 ngày';
                if (years >= 1) return `${years} năm`;
                if (months >= 1) return `${months} tháng`;
                return `${days} ngày`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#DC4B47] animate-slideInFade">
          {popupText}
        </div>
      )}
    </div>
  );
}
