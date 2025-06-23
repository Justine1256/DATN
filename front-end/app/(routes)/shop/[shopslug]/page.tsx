import axios from 'axios';
import ShopInfo from '@/app/components/stores/storesinfor';
import { API_BASE_URL } from '@/utils/api';

export default async function ShopPage({ params }: { params: { shopslug: string } }) {
    try {
        console.log("🧪 Slug:", params.shopslug);
        const res = await axios.get(`${API_BASE_URL}/shop/slug/${params.shopslug}`);
        const shop = res.data.shop;

        if (!shop) throw new Error("Shop not found");

        return (
            <div className="max-w-screen-lg mx-auto px-4 py-6">
                <ShopInfo shop={shop} followed={false} onFollowToggle={() => { }} />
            </div>
        );
    } catch (error: any) {
        console.error("❌ Lỗi API:", error?.response?.data || error);
        return <div className="text-center text-red-500 mt-20">Không tìm thấy cửa hàng.</div>;
    }
}
