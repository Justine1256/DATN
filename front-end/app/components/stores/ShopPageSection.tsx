'use client';

import ShopInfo from '@/app/components/stores/storesinfor';
import ProductCard from '@/app/components/product/ProductCard';

interface Shop {
    id: number;
    name: string;
    slug: string;
    description: string;
    logo: string;
    rating: string;
    phone: string;
    total_sales: number;
    email: string;
    status: string;
}

interface Product {
    id: number;
    name: string;
    image: string[];
    price: number;
    sale_price?: number;
    shop_slug: string;
    slug: string;
}

interface Props {
    shop: Shop;
    products: Product[];
}

export default function ShopPageSection({ shop, products }: Props) {
    return (
        <div className="max-w-screen-xl mx-auto px-4 py-6">
            <ShopInfo shop={shop} followed={false} onFollowToggle={() => { }} />

            <h2 className="text-xl font-semibold mt-8 mb-4">Sản phẩm của shop</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </div>
    );
}
