'use client';

import { useEffect, useState, useCallback } from 'react';
import ShopCard from '@/app/components/stores/Shopcard';
import ProductCardCate from '@/app/components/product/ProductCardCate';
import { API_BASE_URL } from "@/utils/api";

// Define Shop and Category interfaces
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

interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: number;
    oldPrice: number;
    rating: number;
    sold?: number;
    discount: number;
    option1?: string;
    value1?: string;
    sale_price?: number;
    shop_slug: string;
    updated_at?: string;  // Add updated_at as optional string
}

const ShopPage = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [initialProducts, setInitialProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const slug = window.location.pathname.split('/').pop();
        if (!slug) {
            setError('Không tìm thấy slug cửa hàng trên URL.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const shopUrl = `${API_BASE_URL}/shop/${slug}`;
            const categoryUrl = `${API_BASE_URL}/shop/${slug}/categories`;
            const productUrl = `${API_BASE_URL}/shop/${slug}/products`;

            const [shopResponse, categoryResponse, productResponse] = await Promise.all([
                fetch(shopUrl),
                fetch(categoryUrl),
                fetch(productUrl)
            ]);

            const shopData = await shopResponse.json();
            const categoryData = await categoryResponse.json();
            const productData = await productResponse.json();

            if (shopData && shopData.shop) {
                setShop(shopData.shop);
            } else {
                setError('Không tìm thấy dữ liệu cửa hàng.');
                setLoading(false);
                return;
            }

            if (categoryData && categoryData.categories) {
                setCategories(categoryData.categories);
            } else {
                setCategories([]);
            }

            let fetchedProducts: Product[] = [];

            if (productData && productData.products && Array.isArray(productData.products.data)) {
                fetchedProducts = productData.products.data;
            } else {
                fetchedProducts = [];
            }

            // Ensure discount is always a number
            const productsWithTimestamp = fetchedProducts.map(p => ({
                ...p,
                createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
                rating: parseFloat(p.rating ? p.rating.toString() : "0"),  // Ensure rating is a number
                discount: p.discount ?? 0, // Ensure discount is a number (default to 0 if undefined)
            }));

            setProducts(productsWithTimestamp);
            setInitialProducts(productsWithTimestamp);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu cửa hàng:', err);
            setError('Đã xảy ra lỗi khi tải dữ liệu cửa hàng.');
            setShop(null);
            setCategories([]);
            setProducts([]);
            setInitialProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-xl" style={{ color: '#db4444' }}>{error}</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#db4444' }}></div>
                    <div className="text-lg" style={{ color: '#db4444' }}>Đang tải dữ liệu cửa hàng...</div>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-xl" style={{ color: '#db4444' }}>Không thể tải thông tin cửa hàng.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
            <ShopCard shop={shop} />
            <div className="flex flex-col lg:flex-row gap-10 justify-between mt-8">
                <div className="w-full lg:w-1/5 flex flex-col gap-8 mb-8">
                    {/* Category filter */}
                </div>

                <div className="flex flex-wrap gap-4 justify-start items-start">
                    {loading ? (
                        Array(6).fill(0).map((_, idx) => (
                            <div key={idx} className="h-[250px] bg-gray-100 rounded animate-pulse w-full sm:w-1/2 md:w-1/3 lg:w-1/4" />
                        ))
                    ) : products.length === 0 ? (
                        <p className="text-gray-500 col-span-full text-center">Không có sản phẩm nào trong danh mục này. Vui lòng thử lại sau.</p>
                    ) : (
                        products.map((product) => (
                            <ProductCardCate key={product.id} product={product} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;
