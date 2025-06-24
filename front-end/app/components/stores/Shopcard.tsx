'use client';

import { User, MessageCircle, Star, Phone, Package, Calendar } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from "@/utils/api";

// Helper functions
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
            <div className="max-w-4xl mx-auto px-4">
                {/* Main Shop Card */}
                <div className="bg-gray-50 rounded-2xl overflow-hidden">
                    {/* Shop Info Section */}
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* Left Section - Avatar, Buttons, Status */}
                        <div className="col-span-4 flex flex-col items-center">
                            {/* Shop Avatar */}
                            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={`${API_BASE_URL}/image/${shop.logo}`}
                                    alt="Shop Logo"
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover w-full h-full"
                                />
                            </div>

                            {/* Follow and Chat Buttons */}
                            <div className="flex flex-col gap-2 w-full mb-4">
                                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#db4444] text-white rounded-lg hover:bg-[#c23939] transition-colors">
                                    <User size={18} />
                                    <span>Theo Dõi</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#db4444] text-white rounded-lg hover:bg-[#c23939] transition-colors">
                                    <MessageCircle size={18} />
                                    <span>Chat</span>
                                </button>
                            </div>

                            {/* Status */}
                            <div className="px-4 py-2 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                                {shop.status === 'activated' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                            </div>
                        </div>

                        {/* Right Section - Shop Details */}
                        <div className="col-span-8">
                            {/* Shop Name */}
                            <h1 className="text-2xl font-bold text-black mb-6">{shop.name}</h1>

                            {/* Shop Info Grid - 2 rows, 3 columns */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Row 1 */}
                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <Phone size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Điện thoại</div>
                                        <div className="font-semibold text-black">{shop.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <Package size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Đã bán</div>
                                        <div className="font-semibold text-black">{shop.total_sales}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <Star size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Đánh giá</div>
                                        <div className="font-semibold text-black">{shop.rating}</div>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <Calendar size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Tham gia</div>
                                        <div className="font-semibold text-black">{formatTimeAgo(shop.created_at)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <User size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Email</div>
                                        <div className="font-semibold text-black text-xs">{shop.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
                                    <MessageCircle size={20} className="text-[#db4444]" />
                                    <div>
                                        <div className="text-sm text-gray-500">Slug</div>
                                        <div className="font-semibold text-black text-xs">{shop.slug}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopCard;