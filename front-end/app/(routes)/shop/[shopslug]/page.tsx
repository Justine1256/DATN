'use client';

import { useEffect, useState, useCallback } from 'react';
import ShopCard from '@/app/components/stores/Shopcard';
import ProductCardCate from '@/app/components/product/ProductCardCate';
import { API_BASE_URL } from "@/utils/api";

export interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: number;
    oldPrice: number;
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
    rating: string; // <-- sửa từ string | null thành string
    total_sales: number;
    created_at: string;
    status: 'activated' | 'pending' | 'suspended';
    email: string;
    slug: string;
    followers_count: number;
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
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [slug, setSlug] = useState<string | null>(null); // state for slug
    const [filterPriceMax, setFilterPriceMax] = useState<number>(50000000);
    const [startPrice, setStartPrice] = useState<number>(0);
    const [currentPriceRangeValue, setCurrentPriceRangeValue] = useState<number>(50000000);
    const [selectedOriginalPriceFilter, setSelectedOriginalPriceFilter] = useState<string | null>(null);

    useEffect(() => {
        // Lấy slug từ URL sau khi component đã mount
        const pathSlug = window.location.pathname.split('/').pop();

        setSlug(pathSlug ?? null); // If the slug is undefined, set it to null
    }, []);

    const fetchData = useCallback(async (categorySlug: string | null = null) => {
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

            const [shopRes, categoryRes] = await Promise.all([
                fetch(shopUrl),
                fetch(categoryUrl)
            ]);

            const shopData = await shopRes.json();
            const categoryData = await categoryRes.json();

            if (shopData && shopData.shop) {
                setShop(shopData.shop);
            } else {
                setError('Không tìm thấy dữ liệu cửa hàng.');
                setLoading(false);
                return;
            }

            setCategories(categoryData.categories || []);

            let productUrl = categorySlug
                ? `${API_BASE_URL}/shop/${slug}/products-by-category/${categorySlug}`
                : `${API_BASE_URL}/shop/${slug}/products`;

            const productRes = await fetch(productUrl);
            const productData = await productRes.json();

            let fetchedProducts: Product[] = [];
            if (Array.isArray(productData.products)) {
                fetchedProducts = productData.products;
            } else if (Array.isArray(productData.products?.data)) {
                fetchedProducts = productData.products.data;
            }


            const productsWithTs = fetchedProducts.map(p => ({
                ...p,
                createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
                rating: p.rating.toString(),
                oldPrice: p.oldPrice ?? 0,
            }));

            setProducts(productsWithTs);
            setInitialProducts(productsWithTs);
        } catch (err) {
            setError('Đã xảy ra lỗi khi tải dữ liệu.');
            setShop(null);
            setCategories([]);
            setProducts([]);
            setInitialProducts([]);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) fetchData(); // fetch data only when slug is available
    }, [fetchData, slug]);

    const handleCategorySelect = (slug: string | null) => {
        setSelectedCategory(slug);
        fetchData(slug);
    };

    const handleApplyFilters = () => {
        let filtered = [...initialProducts];
        if (selectedSort === "Mới Nhất") {
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else if (selectedSort === "Bán Chạy") {
            filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        } else {
            filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
        }

        if (selectedPriceFilter === "asc") {
            filtered.sort((a, b) => (Number(a.sale_price) || Number(a.price)) - (Number(b.sale_price) || Number(b.price)));
        } else if (selectedPriceFilter === "desc") {
            filtered.sort((a, b) => (Number(b.sale_price) || Number(b.price)) - (Number(a.sale_price) || Number(a.price)));
        } else if (selectedPriceFilter === "discount") {
            filtered.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
        }

        setProducts(filtered);
    };

    const handleResetFilters = () => {
        setSelectedSort("Phổ Biến");
        setSelectedPriceFilter(null);
        setSelectedCategory(null);
        setProducts(initialProducts);
        fetchData();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    if (error) return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">{error}</div>;
    if (loading) return (
        <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
            <div className="animate-pulse space-y-6">
                {/* Fake ShopCard */}
                <div className="h-[150px] bg-gray-200 rounded-xl"></div>

                <div className="grid grid-cols-12 gap-6">
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className="col-span-12 sm:col-span-6 md:col-span-4 space-y-3">
                            <div className="bg-gray-200 h-[200px] w-full rounded-xl"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>

                {/* Footer fake */}
                <div className="h-[50px] bg-gray-100 rounded w-full mt-6"></div>
            </div>
        </div>
    );

    if (!shop) return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">Không thể tải thông tin.</div>;

    return (
        <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
            <ShopCard shop={shop} />

            {products.length > 0 ? (
                <div className="grid grid-cols-12 gap-6 mt-8">
                    {/* Sidebar bộ lọc */}
                    <div className="col-span-12 lg:col-span-3 text-[15px] max-h-[1000px] overflow-auto pr-2 no-scrollbar">
                        <h2 className="text-sm font-semibold text-brand mb-3 uppercase">Danh mục sản phẩm</h2>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleCategorySelect(null)}
                                className={`w-full text-left px-3 py-1 rounded truncate 
                      ${!selectedCategory ? "text-brand font-semibold" : "hover:text-brand"}`}>
                                Tất cả
                            </button>

                            {(showAllCategories ? categories : categories.slice(0, 6)).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.slug)}
                                    className={`w-full text-left px-3 py-1 rounded truncate max-w-[180px]
                        ${cat.slug === selectedCategory ? "text-brand font-semibold" : "hover:text-brand"}`}>
                                    {cat.name}
                                </button>
                            ))}

                            {categories.length > 6 && (
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="mt-2 text-sm text-[#db4444] hover:underline">
                                    {showAllCategories ? 'Ẩn bớt' : 'Xem thêm'}
                                </button>
                            )}
                        </div>

                        <div className="mt-6">
                            <h3 className="text-base font-semibold mb-3">Bộ lọc & Sắp xếp</h3>
                            {["Phổ Biến", "Mới Nhất", "Bán Chạy"].map(label => (
                                <div key={label} className="px-3 py-1 hover:text-brand">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="sortOption"
                                            checked={selectedSort === label}
                                            onChange={() => { setSelectedSort(label); setSelectedPriceFilter(null); }}
                                        />
                                        <span>{label}</span>
                                    </label>
                                </div>
                            ))}

                            {/* Lọc theo giá */}
                            <div className="flex flex-col space-y-4">

                                <div className="flex gap-2">
                                    <h4 className="text-[15px] font-medium mt-4 mb-2">Giá</h4>
                                    <p>(VNĐ)</p>
                                </div>

                                {/* Hiển thị khoảng giá */}
                                <div className="flex justify-between text-sm text-gray-700">
                                    <span>{formatCurrency(startPrice)}</span>
                                    <span>{formatCurrency(filterPriceMax)}</span>
                                </div>

                                {/* Thanh lọc 2 đầu */}
                                <div className="relative h-8 mt-2 mb-4">
                                    {/* Thanh nền */}
                                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2" />

                                    {/* Thanh vùng chọn đỏ */}
                                    <div
                                        className="absolute top-1/2 h-2 bg-[#DB4444] rounded-full transform -translate-y-1/2"
                                        style={{
                                            left: `${(startPrice / 50000000) * 100}%`,
                                            right: `${100 - (filterPriceMax / 50000000) * 100}%`,
                                        }}
                                    />

                                    {/* Slider trái */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={50000000}
                                        step={100000}
                                        value={startPrice}
                                        onChange={(e) => {
                                            const newStart = Number(e.target.value);
                                            if (newStart <= filterPriceMax) setStartPrice(newStart);
                                        }}
                                        className="absolute w-full h-8 appearance-none bg-transparent pointer-events-none
                                            [&::-webkit-slider-thumb]:pointer-events-auto
                                            [&::-webkit-slider-thumb]:appearance-none
                                            [&::-webkit-slider-thumb]:h-5
                                            [&::-webkit-slider-thumb]:w-5
                                            [&::-webkit-slider-thumb]:rounded-full
                                            [&::-webkit-slider-thumb]:bg-white
                                            [&::-webkit-slider-thumb]:border
                                            [&::-webkit-slider-thumb]:border-[#DB4444]
                                            [&::-webkit-slider-thumb]:shadow
                                            [&::-webkit-slider-thumb]:hover:scale-110
                                            transition-transform duration-200"
                                    />

                                    {/* Slider phải */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={50000000}
                                        step={100000}
                                        value={filterPriceMax}
                                        onChange={(e) => {
                                            const newEnd = Number(e.target.value);
                                            if (newEnd >= startPrice) {
                                                setFilterPriceMax(newEnd);
                                                setCurrentPriceRangeValue(newEnd);
                                            }
                                        }}
                                        className="absolute w-full h-8 appearance-none bg-transparent pointer-events-none
                                                    [&::-webkit-slider-thumb]:pointer-events-auto
                                                    [&::-webkit-slider-thumb]:appearance-none
                                                    [&::-webkit-slider-thumb]:h-5
                                                    [&::-webkit-slider-thumb]:w-5
                                                    [&::-webkit-slider-thumb]:rounded-full
                                                    [&::-webkit-slider-thumb]:bg-white
                                                    [&::-webkit-slider-thumb]:border
                                                    [&::-webkit-slider-thumb]:border-[#DB4444]
                                                    [&::-webkit-slider-thumb]:shadow
                                                    [&::-webkit-slider-thumb]:hover:scale-110
                                                    transition-transform duration-200"/>
                                </div>

                                {/* Dropdown sắp xếp giá */}
                                <select
                                    className="border w-full px-3 py-2 rounded cursor-pointer"
                                    value={selectedPriceFilter || ""}
                                    onChange={e => {
                                        setSelectedPriceFilter(e.target.value);
                                        setSelectedSort("Phổ Biến");
                                    }}
                                >
                                    <option value="">-- Sắp xếp giá --</option>
                                    <option value="asc">Thấp đến cao</option>
                                    <option value="desc">Cao đến thấp</option>
                                    <option value="discount">Giảm nhiều nhất</option>
                                </select>

                                <select
                                    className="border w-full px-3 py-2 rounded cursor-pointer"
                                    value={selectedOriginalPriceFilter || ""}
                                    onChange={e => {
                                        setSelectedOriginalPriceFilter(e.target.value);
                                        setSelectedSort("Phổ Biến");
                                    }}
                                >

                                    <option value="">-- Sắp xếp giá chưa giảm --</option>
                                    <option value="asc">Thấp đến cao</option>
                                    <option value="desc">Cao đến thấp</option>
                                </select>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleApplyFilters}
                                        className="w-full bg-brand text-white py-1.5 rounded text-sm hover:opacity-90"
                                    >
                                        Áp dụng
                                    </button>
                                    <button
                                        onClick={handleResetFilters}
                                        className="w-full text-gray-600 border py-1.5 rounded text-sm hover:text-black"
                                    >
                                        Đặt lại
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className="col-span-12 lg:col-span-9 grid grid-cols-12 items-start md:gap-y-[50px] h-fit">
                        {products.map(product => (
                            <div key={product.id} className="col-span-12 sm:col-span-6 md:col-span-4 max-h-fit">
                                <ProductCardCate product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center mt-10 text-gray-500">
                    Cửa hàng chưa có sản phẩm nào.
                </div>
            )}
        </div>
    );
}

export default ShopPage;
