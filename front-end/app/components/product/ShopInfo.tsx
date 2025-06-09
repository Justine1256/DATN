"use client";

import Image from "next/image";

// ✅ Interface định nghĩa dữ liệu cửa hàng
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

// ✅ Props truyền vào component
interface ShopInfoProps {
  shop: Shop;
  followed: boolean;
  onFollowToggle: () => void;
}

// ✅ Component hiển thị thông tin cửa hàng
export default function ShopInfo({
  shop,
  followed,
  onFollowToggle,
}: ShopInfoProps) {
  return (
    <div className="mt-12 border rounded-lg bg-white p-6 relative">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:items-stretch">
        {/* ✅ Cột trái: logo, tên shop, trạng thái, nút */}
        <div className="flex-[1.2] flex gap-4">
          <div className="relative w-20 h-20">
            <Image
              src={`/${shop.logo}`}
              alt="Shop Logo"
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
            {/* ✅ Nút Flow nằm đè lên giữa logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={onFollowToggle}
                className="bg-[#DC4B47] text-white text-[11px] font-semibold px-2 py-[1px] rounded shadow hover:brightness-110 transition"
              >
                {followed ? "Un Flow" : "Flow"}
              </button>
            </div>
          </div>

          {/* ✅ Tên shop, trạng thái, nút chat */}
          <div className="text-black">
            <h3 className="text-xl font-semibold mb-1">{shop.name}</h3>
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
              <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition">
                💬 Chat Ngay
              </button>
              <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition">
                🏪 Xem Shop
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Gạch chia dọc */}
        <div className="hidden md:block w-px bg-gray-200 mx-10 -translate-x-12" />

        {/* ✅ Cột phải: thống kê đánh giá */}
        <div className="flex-[1] w-full flex justify-start items-start -translate-x-16 items-center">
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-800 whitespace-nowrap">
            {/* ✅ Đánh giá sao gọn lại */}
            <div className="flex items-center gap-2">
              <p className="text-gray-500">Đánh Giá:</p>
              <span className="text-red-500 font-semibold">
                {Number(shop.rating).toFixed(1)} / 5
              </span>
              <span className="text-yellow-400 text-xl">★</span>
            </div>

            {/* ✅ Sản phẩm đã bán */}
            <div className="flex items-center gap-2">
              <p className="text-gray-500">Sản Phẩm:</p>
              <p className="text-red-500 font-semibold">{shop.total_sales}</p>
            </div>

            {/* ✅ Tốc độ phản hồi */}
            <div className="flex items-center gap-2">
              <p className="text-gray-500">Phản Hồi:</p>
              <p className="text-red-500 font-semibold">Trong vài giờ</p>
            </div>

            {/* ✅ Thời gian tham gia */}
            <div className="flex items-center gap-2">
              <p className="text-gray-500">Tham Gia:</p>
              <p className="text-red-500 font-semibold">
                {(() => {
                  const createdAt = new Date(shop.created_at);
                  const now = new Date();
                  const diffMs = now.getTime() - createdAt.getTime();
                  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const months = Math.floor(days / 30);
                  const years = Math.floor(days / 365);
                  if (days < 30) return `${days} ngày`;
                  if (years >= 1) return `${years} năm`;
                  return `${months} tháng`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
