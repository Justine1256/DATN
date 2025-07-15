'use client';

import { useEffect, useState } from 'react';
import { User, MessageCircle, Star, Phone, Package, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from "@/utils/api";
import Cookies from 'js-cookie';
import ShopProductSlider from '../home/ShopProduct';

const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`;

    return `${Math.floor(diffInMonths / 12)} năm trước`;
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
    followers_count: number;
}

const ShopCard = ({ shop }: { shop: Shop }) => {
    const [followed, setFollowed] = useState(false);

    // Kiểm tra shop đã được follow chưa
    useEffect(() => {
        const checkFollow = async () => {
            const token = Cookies.get('authToken') || localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE_URL}/shops/${shop.id}/follow-check`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setFollowed(!!data.is_following);
            } catch {
                // ignore
            }
        };
        checkFollow();
    }, [shop.id]);

    const handleFollow = async () => {
        const token = Cookies.get('authToken') || localStorage.getItem('token');
        if (!token) return alert('Vui lòng đăng nhập để theo dõi');

        const url = `${API_BASE_URL}/shops/${shop.id}/${followed ? 'unfollow' : 'follow'}`;
        await fetch(url, {
            method: followed ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        setFollowed(!followed);
    };

    return (
        <div className="bg-white py-4">
            <div className='mt-10 relative h-80 rounded-2xl outline-1 outline-gray-200'>
                <div className='absolute w-full h-full overflow-hidden'>
                    <Image
                        src="/shop_cover.jpg"
                        alt="Shop Cover"
                        width={1200}
                        height={320}
                        className="w-full h-80 object-cover rounded-2xl"
                    />
                </div>

                <div className="absolute z-10 left-12 top-16 w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden transition-transform duration-300 hover:scale-105">
                    <Image
                        src={`${API_BASE_URL}/image/${shop.logo}`}
                        alt="Shop Logo"
                        width={56}
                        height={56}
                        className="rounded-full object-cover w-full h-full border-4 border-white"
                    />
                </div>

                <div className="absolute z-1 bottom-0 bg-gray-50 w-full rounded-2xl overflow-hidden pr-8 pb-8 pt-4 flex justify-end">
                    <div className='w-full md:w-[83%]'>
                        <div className="flex gap-8 items-center mb-8">
                            <h1 className="text-2xl font-bold text-black">{shop.name}</h1>
                            <div className="inline-block px-2 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                                {shop.status === 'activated' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Phone size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Điện thoại</div>
                                        <div className="font-semibold text-black w-max">{shop.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Package size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đã bán</div>
                                        <div className="font-semibold text-black w-max">{shop.total_sales || "Chưa có lượt bán"}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Star size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Đánh giá</div>
                                        <div className="font-semibold text-black w-max">{shop.rating || "Chưa có đánh giá"}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Calendar size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Tham gia</div>
                                        <div className="font-semibold text-black w-max">{formatTimeAgo(shop.created_at)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <Users size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Người theo dõi</div>
                                        <div className="font-semibold text-black w-max">{shop.followers_count || "Chưa có"}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:min-w-[200px]">
                                    <MessageCircle size={18} className="text-brand" />
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="font-semibold text-black w-max truncate max-w-[150px]">
                                            {shop.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-[200px] justify-end flex-wrap">
                                <button
                                    onClick={handleFollow}
                                    className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-sm w-full border transition-colors
                                    ${followed
                                            ? 'bg-brand text-white border-brand hover:opacity-80'
                                            : 'bg-white text-brand border-brand hover:bg-brand hover:text-white'
                                        }`}>
                                    <User size={20} />
                                    <span>{followed ? 'Đã theo dõi' : 'Theo Dõi'}</span>
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 px-2 py-1 bg-white text-brand border border-[#db4444] rounded-lg hover:bg-[#db4444] hover:text-white transition-colors text-sm w-full">
                                    <MessageCircle size={20} />
                                    <span>Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {shop.slug && (
                <div className="w-full max-w-screen-xl mx-auto mt-8 ">
                    <ShopProductSlider shopSlug={shop.slug} />
                </div>
            )}
        </div>
    );
}

export default ShopCard;
