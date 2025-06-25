'use client';

import { useEffect, useState, useCallback } from 'react';
import ShopCard from '@/app/components/stores/Shopcard';
import ProductCardCate from '@/app/components/product/ProductCardCate';
import { API_BASE_URL } from "@/utils/api";

interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: number;
    oldPrice?: number;
    rating: string;
    discount?: number;
    sale_price?: number;
    shop_slug?: string;
    shop_id?: number;
    category_id?: number;
    createdAt?: number;
    updated_at?: string;
    sold?: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

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

const ShopPage = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [initialProducts, setInitialProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceFilter, setSelectedPriceFilter] = useState<string | null>(null);

    const fetchData = useCallback(async (categorySlug: string | null = null) => {
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
            let productUrl = `${API_BASE_URL}/shop/${slug}/products`;
            // let productUrl = `${API_BASE_URL}/shop/${slug}/products-by-category/${categorySlug}`;
            if (categorySlug) {
                productUrl += `?category=${categorySlug}`;
            }

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

            const productsWithTimestamp = fetchedProducts.map(p => ({
                ...p,
                createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
                rating: p.rating ? p.rating.toString() : "0"
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

    const handleCategorySelect = (categorySlug: string | null) => {
        setSelectedCategory(categorySlug);
        fetchData(categorySlug);
    };

    const handleApplyFilters = () => {
        let filteredProducts = [...initialProducts];

        if (selectedSort === "Mới Nhất") {
            filteredProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else if (selectedSort === "Bán Chạy") {
            filteredProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        } else {
            filteredProducts.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
        }

        if (selectedPriceFilter === "asc") {
            filteredProducts.sort((a, b) => (a.sale_price || a.price || 0) - (b.sale_price || b.price || 0));
        } else if (selectedPriceFilter === "desc") {
            filteredProducts.sort((a, b) => (b.sale_price || b.price || 0) - (a.sale_price || a.price || 0));
        } else if (selectedPriceFilter === "discount") {
            filteredProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        setProducts(filteredProducts);
    };

    const handleResetFilters = () => {
        setSelectedSort("Phổ Biến");
        setSelectedPriceFilter(null);
        setSelectedCategory(null);
        setProducts(initialProducts);
        fetchData();
    };

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
            {/* Hiển thị thông tin cửa hàng */}
            <ShopCard shop={shop} />

            <div className="flex flex-col lg:flex-row gap-10 justify-between mt-8">
                {/* Sidebar cho Danh mục sản phẩm và Bộ lọc */}
                <div className="w-full lg:w-1/5 flex flex-col gap-8 mb-8">
                    <div className="mb-4">
                        <h2 className="text-xs font-semibold text-brand">Danh mục sản phẩm</h2>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.slug)}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors text-xs 
                        ${cat.slug === selectedCategory ? "text-brand font-semibold" : "text-black hover:text-brand text-sm whitespace-nowrap"}`}
                                    style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Bộ lọc & Sắp xếp</h3>
                        <div className="space-y-3 mb-6">
                            <h4 className="text-base font-medium mb-1">Sắp xếp</h4>
                            {["Phổ Biến", "Mới Nhất", "Bán Chạy"].map((label) => (
                                <label key={label} className="flex items-center space-x-2 text-black cursor-pointer w-full px-4 py-2 rounded transition-colors hover:text-brand">
                                    <input
                                        type="radio"
                                        name="sortOption"
                                        className="form-radio text-brand rounded-sm focus:ring-0 accent-[#DB4444]"
                                        checked={selectedSort === label}
                                        onChange={() => {
                                            setSelectedSort(label);
                                            setSelectedPriceFilter(null);
                                        }}
                                    />
                                    <span className={`${selectedSort === label && !selectedPriceFilter ? "text-brand font-semibold" : ""}`}>
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-base font-medium mb-1">Giá</h4>
                            <label className="flex items-center space-x-2 text-black cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceFilterOptions"
                                    className="form-radio text-brand rounded-sm focus:ring-0 accent-[#DB4444]"
                                    checked={selectedPriceFilter === "asc"}
                                    onChange={() => {
                                        setSelectedPriceFilter("asc");
                                        setSelectedSort("Phổ Biến");
                                    }}
                                />
                                <span>Giá: thấp đến cao</span>
                            </label>
                            <label className="flex items-center space-x-2 text-black cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceFilterOptions"
                                    className="form-radio text-brand rounded-sm focus:ring-0 accent-[#DB4444]"
                                    checked={selectedPriceFilter === "desc"}
                                    onChange={() => {
                                        setSelectedPriceFilter("desc");
                                        setSelectedSort("Phổ Biến");
                                    }}
                                />
                                <span>Giá: cao đến thấp</span>
                            </label>
                            <label className="flex items-center space-x-2 text-black cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceFilterOptions"
                                    className="form-radio text-brand rounded-sm focus:ring-0 accent-[#DB4444]"
                                    checked={selectedPriceFilter === "discount"}
                                    onChange={() => {
                                        setSelectedPriceFilter("discount");
                                        setSelectedSort("Phổ Biến");
                                    }}
                                />
                                <span>Giảm giá nhiều nhất</span>
                            </label>

                            <button
                                onClick={handleApplyFilters}
                                className="w-[180px] py-2 bg-[#DB4444] text-white rounded-lg hover:bg-red-600 transition-colors mt-4"
                            >
                                Lọc
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="w-[180px] py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors mt-2"
                            >
                                Đặt lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* Khu vực hiển thị sản phẩm */}
                <div className="flex flex-wrap gap-4 justify-start items-start">
                    <div className="w-full lg:w-4/5 flex flex-wrap gap-4 justify-start items-start">
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
        </div>
    );
      
};

export default ShopPage;