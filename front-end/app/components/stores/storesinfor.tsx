'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BuildingStorefrontIcon,
    UsersIcon,
    UserGroupIcon,
    StarIcon,
    ChatBubbleBottomCenterTextIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/solid';

import { API_BASE_URL } from '@/utils/api';

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

interface ShopInfoProps {
    shop: Shop | undefined;
    followed: boolean;
    onFollowToggle: () => void;
}

export default function ShopInfo({ shop, followed, onFollowToggle }: ShopInfoProps) {
    const [popupText, setPopupText] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => setIsLoaded(true), 500);
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

    const handleNavigateToOrders = () => {
        router.push('/orders');
    };

    const getJoinedTime = () => {
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
    };

    return (
        <div className="mt-10 border rounded-lg bg-white p-4 sm:p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
                {/* Bên trái: logo và tên shop */}
                <div className="flex gap-4 flex-shrink-0">
                    <div className="relative w-20 h-20">
                        <Image
                            src={`${API_BASE_URL}/image/${shop.logo}`}
                            alt="Logo"
                            width={80}
                            height={80}
                            className="rounded-full object-cover border-2 border-[#db4444]"
                        />
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                            {!followed ? (
                                <button
                                    onClick={handleFollowClick}
                                    className="bg-[#db4444] text-white text-sm font-bold px-2 py-1 rounded shadow hover:bg-[#b92f2f] transition"
                                >
                                    + Theo dõi
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnfollowClick}
                                    className="bg-gray-300 text-[#db4444] text-sm font-semibold px-2 py-1 rounded shadow hover:bg-gray-400 transition"
                                >
                                    ✔ Đang theo dõi
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-black mb-1">{shop.name}</h2>
                        <p className={`text-sm font-medium ${shop.status === 'activated'
                            ? 'text-green-600'
                            : shop.status === 'pending'
                                ? 'text-yellow-500'
                                : 'text-gray-500'
                            }`}>
                            {shop.status === 'activated' && 'Đang hoạt động'}
                            {shop.status === 'pending' && 'Đang chờ duyệt'}
                            {shop.status === 'suspended' && 'Tạm khóa'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <button className="text-sm px-3 py-1 border border-[#db4444] text-[#db4444] rounded hover:bg-[#db4444] hover:text-white transition flex items-center gap-1">
                                💬 Chat
                            </button>
                            <button
                                onClick={handleNavigateToOrders}
                                className="text-sm px-3 py-1 border border-[#db4444] text-[#db4444] rounded hover:bg-[#db4444] hover:text-white transition flex items-center gap-1"
                            >
                                🛍️ Xem Shop
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bên phải: Thông tin chi tiết */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm text-gray-700 mt-4 md:mt-0">
                    <div className="flex items-center gap-2">
                        <BuildingStorefrontIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Sản Phẩm:</span>
                        <span className="text-[#db4444] font-semibold">{shop.total_sales}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Đang Theo:</span>
                        <span className="text-[#db4444] font-semibold">94</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Người Theo Dõi:</span>
                        <span className="text-[#db4444] font-semibold">4,3k</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Đánh Giá:</span>
                        <span className="text-[#db4444] font-semibold">{Number(shop.rating).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Phản Hồi:</span>
                        <span className="text-[#db4444] font-semibold">Trong vài giờ</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-[#db4444]" />
                        <span className="text-gray-500">Tham Gia:</span>
                        <span className="text-[#db4444] font-semibold">{getJoinedTime()}</span>
                    </div>
                </div>
            </div>

            {showPopup && (
                <div className="fixed top-20 right-5 z-50 bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#db4444] animate-slideInFade">
                    {popupText}
                </div>
            )}
        </div>
    );
}
