'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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

export default function ShopPage({ params }: { params: { shopslug: string } }) {
    const [shop, setShop] = useState<Shop | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Log slug to verify that it is being passed correctly
        console.log('Fetching shop with slug:', params.shopslug);

        const fetchShop = async () => {
            try {
                // Fetch shop data using slug
                const response = await axios.get(`${API_BASE_URL}/shop/${params.shopslug}`);

                // Check if shop data exists and set it
                if (response.data && response.data.shop) {
                    setShop(response.data.shop);
                } else {
                    setError('Cửa hàng không tìm thấy');
                }
            } catch (err: any) {
                setError('Lỗi khi lấy dữ liệu cửa hàng');
                console.error('Error fetching shop data:', err);
            }
        };

        fetchShop();
    }, [params.shopslug]);

    if (error) {
        return <div className="text-center text-red-500 mt-20">{error}</div>;
    }

    if (!shop) {
        return <div>Đang tải dữ liệu cửa hàng...</div>;
    }

    // Render shop information once it's available
    return (
        <div className="max-w-screen-lg mx-auto px-4 py-6">
            <div className="border rounded-lg bg-white p-4 sm:p-6 md:p-8 relative">
                <h1 className="text-xl font-bold">{shop.name}</h1>
                <p>{shop.description}</p>
                <img src={`${API_BASE_URL}/image/${shop.logo}`} alt="Shop Logo" className="w-20 h-20 rounded-full" />
                <div>
                    <p>Phone: {shop.phone}</p>
                    <p>Email: {shop.email}</p>
                    <p>Status: {shop.status}</p>
                    <p>Rating: {shop.rating}</p>
                    <p>Total Sales: {shop.total_sales}</p>
                    <p>Joined: {shop.created_at}</p>
                </div>
                <button onClick={() => router.push(`/shop/${shop.slug}`)} className="mt-4 text-blue-500 underline">
                    Xem Shop
                </button>
            </div>
        </div>
    );
}
