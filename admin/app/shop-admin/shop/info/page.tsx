'use client';

import { useEffect, useState } from 'react';
import { Phone, Package, Calendar, Users, MessageCircle, Star } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from "@/utils/api";
import Cookies from 'js-cookie';

// Helper function để định dạng thời gian
const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
        return 'Vừa xong';
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} ngày trước`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} tháng trước`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} năm trước`;
};

// Định nghĩa kiểu dữ liệu của Shop
interface Shop {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    rating: string;
    total_sales: number;
    created_at: string;
    status: 'activated' | 'pending' | 'suspended';
    email: string;
    followers_count: number;
}

const ShopCard = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Lấy thông tin shop từ API /user
        const fetchShopData = async () => {
            try {
                const token = Cookies.get("authToken");
                if (!token) {
                    setError("Vui lòng đăng nhập để lấy thông tin cửa hàng");
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    setError("Không thể lấy thông tin cửa hàng.");
                    return;
                }

                const data = await response.json();
                setShop(data.shop);  // Lưu dữ liệu cửa hàng vào state
            } catch (error) {
                setError("Có lỗi xảy ra khi tải dữ liệu cửa hàng.");
                console.error("Lỗi:", error);
            } finally {
                setIsLoading(false);  // Khi dữ liệu đã tải xong
            }
        };

        fetchShopData();
    }, []);

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    if (isLoading || !shop) {
        return (
            <div className="w-full h-96 bg-gray-300 animate-pulse rounded-2xl">
                {/* Hiển thị ô vuông xám khi đang load */}
            </div>
        );
    }

    return (
        <div>
            <div className='mt-10 relative h-80 rounded-2xl outline-1 outline-gray-200'>
                {/* Cover photo */}
                <div className='absolute w-full h-full overflow-hidden'>
                    <Image
                        src="/shop_cover.jpg"
                        alt="Shop Cover"
                        width={1200}
                        height={320}
                        className="w-full h-80 object-cover rounded-2xl"
                        onLoadingComplete={() => setIsLoading(false)} // Khi ảnh tải xong
                    />
                </div>
                {/* Shop Avatar */}
                <div className="absolute z-10 left-12 top-16 w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden transition-transform duration-300 hover:scale-105">
                    <Image
                        src={`${API_BASE_URL}/image/${shop.logo}`}
                        alt="Shop Logo"
                        width={56}
                        height={56}
                        className="rounded-full object-cover w-full h-full border-4 border-white"
                        onLoadingComplete={() => setIsLoading(false)} // Khi ảnh tải xong
                    />
                </div>
                {/* Main Shop Card */}
                <div className="absolute z-1 bottom-0 bg-gray-50 w-full rounded-2xl overflow-hidden pr-8 pb-8 pt-4 flex justify-end">
                    {/* Shop Info Section */}
                    <div className='w-full md:w-[83%]'>
                        {/* Shop Name and Status */}
                        <div className="flex gap-8 items-center mb-8">
                            {/* Shop Name */}
                            <h1 className="text-2xl font-bold ">{shop.name}</h1>

                            {/* Status */}
                            <div className="inline-block px-2 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                                {shop.status === 'activated' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            {/* Shop Info Grid - 2 rows, 3 columns */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Row 1 */}
                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Phone size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Điện thoại</div>
                                        <div className="font-semibold text-black w-max">{shop.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Package size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đã bán</div>
                                        <div className="font-semibold text-black w-max">{shop.total_sales == null || shop.total_sales === 0 ? "Chưa có lượt bán" : shop.total_sales}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Star size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đánh giá</div>
                                        <div className="font-semibold text-black w-max">
                                            {shop.rating == null || shop.rating === "0.0" ? "Chưa có đánh giá" : shop.rating}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Calendar size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Tham gia</div>
                                        <div className="font-semibold text-black w-max">{formatTimeAgo(shop.created_at)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Users size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Người theo dõi</div>
                                        <div className="font-semibold text-black w-max">{shop.followers_count == null || shop.followers_count === 0 ? "Chưa có người theo dõi" : shop.followers_count}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <MessageCircle size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="font-semibold text-black w-max">{shop.email}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShopCard;
