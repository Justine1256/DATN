'use client';

import { User, MessageCircle, Star, Phone, Package, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from "@/utils/api";
import ShopProductSlider from '../home/ShopProduct'; // Gợi ý sản phẩm từ shop

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
    slug: string;
}

const ShopCard = ({ shop }: { shop: Shop }) => {
    return (
        <div className="min-h-screen bg-white py-4">
            <div className="max-w-6xl mx-auto px-4">
                {/* Main Shop Card */}
                <div className="bg-gray-50 w-full rounded-2xl overflow-hidden">
                    {/* Shop Info Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6">
                        {/* Left Section - Avatar, Buttons, Status */}
                        <div className="col-span-12 sm:col-span-4 flex flex-col items-center">
                            {/* Shop Avatar */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={`${API_BASE_URL}/image/${shop.logo}`}
                                    alt="Shop Logo"
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover w-full h-full"
                                />
                            </div>

                            {/* Follow and Chat Buttons */}
                            <div className="flex gap-2 w-[250px]">
                                <button className="flex items-center justify-center gap-2 px-2 py-1 bg-white text-[#db4444] border border-[#db4444] rounded-lg hover:bg-[#db4444] hover:text-white transition-colors text-sm w-full">
                                    <User size={16} />
                                    <span>Theo Dõi</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 px-2 py-1 bg-white text-[#db4444] border border-[#db4444] rounded-lg hover:bg-[#db4444] hover:text-white transition-colors text-sm w-full">
                                    <MessageCircle size={16} />
                                    <span>Chat</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Section - Shop Details */}
                        <div className="col-span-12 sm:col-span-8">
                            {/* Shop Name */}
                            <h1 className="text-2xl font-bold text-black mb-2">{shop.name}</h1>

                            {/* Status */}
                            <div className="inline-block px-2 rounded-full text-sm bg-green-100 text-green-800 font-medium mb-6">
                                {shop.status === 'activated' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                            </div>

                            {/* Shop Info Grid - 2 rows, 3 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Row 1 */}
                                <div className="flex items-center gap-2">
                                    <Phone size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Điện thoại</div>
                                        <div className="font-semibold text-black">{shop.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Package size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đã bán</div>
                                        <div className="font-semibold text-black">{shop.total_sales}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đánh giá</div>
                                        <div className="font-semibold text-black">{shop.rating}</div>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Tham gia</div>
                                        <div className="font-semibold text-black">{formatTimeAgo(shop.created_at)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Người theo dõi</div>
                                        <div className="font-semibold text-black">1.2K</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <MessageCircle size={18} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="font-semibold text-black text-xs">{shop.email}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gợi ý sản phẩm shop */}
            {shop.slug && (
                <div className="w-full max-w-screen-xl mx-auto mt-8 ">
                    <ShopProductSlider shopSlug={shop.slug} />
                </div>
            )}
        </div>
  
);

}
export default ShopCard;
