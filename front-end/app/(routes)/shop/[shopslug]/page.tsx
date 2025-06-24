'use client';

import { useEffect, useState } from 'react';
import ShopCard from '@/app/components/stores/Shopcard';
import { API_BASE_URL } from "@/utils/api";

const ShopPage = () => {
    const [shop, setShop] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const slug = window.location.pathname.split('/').pop();

        if (!slug) {
        
            return;
        }

        const fetchShop = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/shop/${slug}`);
                const data = await response.json();

                if (data && data.shop) {
                    setShop(data.shop);
                } else {
              
                }
            } catch (err) {
               
                console.error('Error fetching shop data:', err);
            }
        };

        fetchShop();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-xl" style={{ color: '#db4444' }}>{error}</div>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#db4444' }}></div>
                    <div className="text-lg" style={{ color: '#db4444' }}>Đang tải dữ liệu cửa hàng...</div>
                </div>
            </div>
        );
    }

    return <ShopCard shop={shop} />;
};

export default ShopPage;
