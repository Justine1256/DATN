import axios from 'axios';
import ShopInfo from '@/app/components/stores/storesinfor';
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

export default async function ShopPage({ params }: { params: { shopslug: string } }) {
    try {
        const res = await axios.get(`${API_BASE_URL}/shop/${params.shopslug}`);
        const shop: Shop = res.data.shop;

        return (
            <div className="max-w-screen-lg mx-auto px-4 py-6">
                <ShopInfo shop={shop} followed={false} onFollowToggle={() => { }} />
            </div>
        );
    } catch (error) {
        console.error("❌ Không tìm thấy shop:", error);
        return <div className="text-center text-red-500 mt-20">Không tìm thấy cửa hàng.</div>;
    }
}
