'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import ShopCard from '@/app/components/stores/Shopcard';
import ProductCardCate from '@/app/components/product/ProductCardCate';
import { API_BASE_URL } from "@/utils/api";

export interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: string | number;
    oldPrice: number;
    rating: string;
    rating_avg?: string | number;
    discount: number;
    sale_price?: string | number | null;
    shop_slug?: string;
    shop_id?: number;
    category_id?: number;
    category?: {
        id: number;
        name: string;
        slug: string;
        parent_id?: number;
    };
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
    followers_count: number;
}

// SWR fetcher function
const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    return response.json();
};


const ShopPage = () => {
    const [slug, setSlug] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Price filter states
    const [tempStartPrice, setTempStartPrice] = useState<number>(0);
    const [tempEndPrice, setTempEndPrice] = useState<number>(50000000);
    const [appliedStartPrice, setAppliedStartPrice] = useState<number>(0);
    const [appliedEndPrice, setAppliedEndPrice] = useState<number>(50000000);

    // Sorting states
    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
    const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);

    useEffect(() => {
        const pathSlug = window.location.pathname.split('/').pop();
        setSlug(pathSlug ?? null);
    }, []);

    // Build query parameters for API calls including filters and sorting
    const buildQueryParams = (page: number) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());

        // Add price filters
        if (appliedStartPrice > 0) {
            params.append('min_price', appliedStartPrice.toString());
        }
        if (appliedEndPrice < 50000000) {
            params.append('max_price', appliedEndPrice.toString());
        }

        // Add sorting parameter
        const sortParam = getSortingParam();
        if (sortParam) {
            params.append('sorting', sortParam);
        }

        return params.toString();
    };

    // Convert UI sorting states to API sorting parameter
    const getSortingParam = () => {
        if (selectedNameSort === "asc") {
            return "name_asc";
        } else if (selectedNameSort === "desc") {
            return "name_desc";
        }

        // Price sort
        if (selectedPriceSort) {
            return selectedPriceSort === "asc" ? "price_asc" : "price_desc";
        }

        // Basic sorts
        if (selectedSort === "Mới Nhất") {
            return "latest";
        } else if (selectedSort === "Bán Chạy") {
            return "sold_desc";
        } else if (selectedSort === "Phổ Biến") {
            return "rating_desc";
        }

        return "latest";
    };

    // Build the products URL using the new API endpoint
    const getProductsUrl = () => {
        const queryParams = buildQueryParams(currentPage);
        if (selectedCategory) {
            // Use shop products-by-category endpoint when category is selected
            return `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${queryParams}`;
        } else {
            // Use shop products endpoint when no category is selected
            return `${API_BASE_URL}/shop/${slug}/products?${queryParams}`;
        }
    };

    // SWR hooks for data fetching
    const { data: shopData, error: shopError } = useSWR(
        slug ? `${API_BASE_URL}/shop/${slug}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000,
        }
    );

    const { data: categoryData, error: categoryError } = useSWR(
        slug ? `${API_BASE_URL}/shop/${slug}/categories` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000,
        }
    );

    const productQueryParams = buildQueryParams(currentPage);
    const { data: productData, error: productError, isLoading: isLoadingProducts } = useSWR(
        slug ? getProductsUrl() : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
        }
    );

    // Prefetch next page
    const { data: nextPageData } = useSWR(
        slug && productData?.products?.next_page_url ?
            (selectedCategory
                ? `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${buildQueryParams(currentPage + 1)}`
                : `${API_BASE_URL}/shop/${slug}/products?${buildQueryParams(currentPage + 1)}`
            ) : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    // Prefetch previous page
    const { data: prevPageData } = useSWR(
        slug && currentPage > 1 ?
            (selectedCategory
                ? `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${buildQueryParams(currentPage - 1)}`
                : `${API_BASE_URL}/shop/${slug}/products?${buildQueryParams(currentPage - 1)}`
            ) : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    // Extract data from SWR responses
    const shop = shopData?.shop || null;
    const categories = categoryData?.categories || [];

    // The API returns products nested under productData.products.data
    const products = productData?.products?.data || [];
    const pagination = {
        current_page: productData?.products?.current_page || 1,
        last_page: productData?.products?.last_page || 1,
        total: productData?.products?.total || 0,
        per_page: productData?.products?.per_page || 15,
        next_page_url: productData?.products?.next_page_url || null,
        prev_page_url: productData?.products?.prev_page_url || null,
    };

    // Loading and error states
    const isLoading = !slug || !shopData || !categoryData || isLoadingProducts;
    const error = shopError || categoryError || productError;

    // Process products with TypeScript-safe operations
    const processedProducts = products.map((p: Product) => ({
        ...p,
        createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
        rating: p.rating.toString(),
        oldPrice: p.oldPrice ?? 0,
    }));

    // Apply filters and sorting to current page products
    const filteredAndSortedProducts = (() => {
        if (processedProducts.length === 0) return [];
        let filteredProducts = [...processedProducts];
        return filteredProducts;
    })();

    // Scroll to top when page changes
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Pagination logic - now working with server-side pagination
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.last_page) {
            setCurrentPage(page);
            scrollToTop();
        }
    };

    // Handler functions
    const handleCategorySelect = (categorySlug: string | null) => {
        setSelectedCategory(categorySlug);
        setCurrentPage(1);
    };

    const handleApplyFilters = () => {
        setAppliedStartPrice(tempStartPrice);
        setAppliedEndPrice(tempEndPrice);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        // Reset all states
        setSelectedSort("Phổ Biến");
        setSelectedPriceSort(null);
        setSelectedNameSort(null);
        setSelectedCategory(null);

        // Reset price filter states
        setTempStartPrice(0);
        setTempEndPrice(50000000);
        setAppliedStartPrice(0);
        setAppliedEndPrice(50000000);

        setCurrentPage(1);
    };

    // Handlers for sorting that trigger immediate refetch
    const handleSortChange = (sortType: string) => {
        setSelectedSort(sortType);
        setSelectedPriceSort(null);
        setSelectedNameSort(null);
        setCurrentPage(1);
    };

    const handlePriceSortChange = (sortDirection: string | null) => {
        setSelectedPriceSort(sortDirection);
        if (sortDirection) {
            setSelectedSort("Phổ Biến");
            setSelectedNameSort(null);
        }
        setCurrentPage(1);
    };

    const handleDiscountSortChange = (sortDirection: string | null) => {
        if (sortDirection) {
            setSelectedSort("Phổ Biến");
            setSelectedPriceSort(null);
            setSelectedNameSort(null);
        }
        setCurrentPage(1);
    };

    const handleNameSortChange = (sortDirection: string | null) => {
        setSelectedNameSort(sortDirection);
        if (sortDirection) {
            setSelectedSort("Phổ Biến");
            setSelectedPriceSort(null);
        }
        setCurrentPage(1);
    };

    const handleResetSort = () => {
        setSelectedSort("Phổ Biến");
        setSelectedPriceSort(null);
        setSelectedNameSort(null);
        setCurrentPage(1);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(value);
    };

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
            <div className="animate-pulse space-y-6">
                <div className="h-[150px] bg-gray-200 rounded-xl"></div>
                <div className="grid grid-cols-12 gap-6">
                    {Array.from({ length: 15 }).map((_, idx) => (
                        <div key={idx} className="col-span-12 sm:col-span-6 md:col-span-4 space-y-3">
                            <div className="bg-gray-200 h-[200px] w-full rounded-xl"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
                <div className="h-[50px] bg-gray-100 rounded w-full mt-6"></div>
            </div>
        </div>
    );

    // Loading state
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Error states
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xl text-red-600">
                {error}
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xl text-red-600">
                Không thể tải thông tin.
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
            <ShopCard shop={shop} />
            <div className="mt-8 flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/4 flex flex-col gap-8">
                    {/* Sidebar bộ lọc */}
                    <div className="pt-4 flex flex-col space-y-4">
                        <h3 className="text-lg font-semibold pb-4 border-b">Bộ lọc</h3>
                        <div className="flex flex-col space-y-4">
                            <h3 className="font-semibold">Danh mục</h3>
                            <div>
                                <button
                                    onClick={() => handleCategorySelect(null)}
                                    className={`w-full px-3 py-2 transition-colors text-left
                                        ${!selectedCategory ? "text-brand font-semibold" : "hover:text-brand"}`}>
                                    Tất Cả Sản Phẩm
                                </button>
                                {(showAllCategories ? categories : categories.slice(0, 6)).map((cat: Category) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.slug)}
                                        className={`w-full px-3 py-2 transition-colors text-left ${cat.slug === selectedCategory
                                                ? "text-brand font-semibold"
                                                : "hover:text-brand"
                                            }`}
                                    >
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
                        </div>

                        {/* Lọc theo giá */}
                        <div className="flex flex-col space-y-4">

                            <div className="flex gap-2">
                                <h4 className="font-semibold">Giá</h4>
                                <p>(VNĐ)</p>
                            </div>

                            {/* Hiển thị khoảng giá */}
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>{formatCurrency(tempStartPrice)}</span>
                                <span>{formatCurrency(tempEndPrice)}</span>
                            </div>

                            {/* Thanh lọc 2 đầu */}
                            <div className="relative h-8 mt-2 mb-4">
                                {/* Thanh nền */}
                                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2" />

                                {/* Thanh vùng chọn đỏ */}
                                <div
                                    className="absolute top-1/2 h-2 bg-[#DB4444] rounded-full transform -translate-y-1/2"
                                    style={{
                                        left: `${(tempStartPrice / 50000000) * 100}%`,
                                        right: `${100 - (tempEndPrice / 50000000) * 100}%`,
                                    }}
                                />

                                {/* Slider trái */}
                                <input
                                    type="range"
                                    min={0}
                                    max={50000000}
                                    step={100000}
                                    value={tempStartPrice}
                                    onChange={(e) => {
                                        const newStart = Number(e.target.value);
                                        if (newStart <= tempEndPrice) setTempStartPrice(newStart);
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
                                    value={tempEndPrice}
                                    onChange={(e) => {
                                        const newEnd = Number(e.target.value);
                                        if (newEnd >= tempStartPrice) {
                                            setTempEndPrice(newEnd);
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
                                        transition-transform duration-200"
                                />
                            </div>

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

                <div className="flex-1">
                    {error ? (
                        <p className="text-red-500">{error}</p>
                    ) : products.length === 0 && !isLoading ? (
                        <p className="text-gray-500">Không có sản phẩm nào.</p>
                    ) : (
                        <div>
                            {/* Sắp xếp sản phẩm */}
                            <div className="flex mb-5 gap-2 items-center">
                                <span className="w-full">Sắp xếp theo:</span>
                                <select
                                    className="border w-full px-3 py-2 rounded cursor-pointer"
                                    value={selectedSort}
                                    onChange={e => handleSortChange(e.target.value)}>
                                    <option value="Phổ Biến">Phổ Biến</option>
                                    <option value="Mới Nhất">Mới Nhất</option>
                                    <option value="Bán Chạy">Bán Chạy</option>
                                </select>

                                {/* Sắp xếp giá đã giảm */}
                                <select
                                    className="border w-full px-3 py-2 rounded cursor-pointer"
                                    value={selectedPriceSort || ""}
                                    onChange={e => handlePriceSortChange(e.target.value || null)}
                                >
                                    <option value="">Giá</option>
                                    <option value="asc">Thấp đến cao</option>
                                    <option value="desc">Cao đến thấp</option>
                                </select>

                                {/* Sắp xếp tên sản phẩm */}
                                <select
                                    className="border w-full px-3 py-2 rounded cursor-pointer"
                                    value={selectedNameSort || ""}
                                    onChange={e => handleNameSortChange(e.target.value || null)}
                                >
                                    <option value="">Tên</option>
                                    <option value="asc">A đến Z</option>
                                    <option value="desc">Z đến A</option>
                                </select>

                                {/* Reset sorts button */}
                                <button
                                    onClick={handleResetSort}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm whitespace-nowrap"
                                >
                                    Đặt lại
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[650px]">
                                {/* Show loading skeleton while fetching new page */}
                                {isLoadingProducts ? (
                                    Array.from({ length: 15 }).map((_, idx) => (
                                        <div key={`skeleton-${idx}`} className="animate-pulse space-y-3">
                                            <div className="bg-gray-200 h-[200px] w-full rounded-xl"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))
                                ) : (
                                    filteredAndSortedProducts.map((product: Product, idx: number) => (
                                        <div key={`product-${product.id}-${currentPage}-${idx}`}>
                                            <ProductCardCate
                                                product={{
                                                    ...product,
                                                    price: Number(product.price) || 0,
                                                    sale_price: product.sale_price ? Number(product.sale_price) : undefined,
                                                    rating_avg: product.rating_avg ? Number(product.rating_avg) : undefined
                                                }}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="flex justify-center mt-6 gap-2 flex-wrap">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-[#DB4444] hover:text-white transition"
                                disabled={currentPage === 1}
                            >
                                Trước
                            </button>

                            {(() => {
                                const pageButtons: React.JSX.Element[] = [];
                                const pagesToShow = new Set<number>();

                                // Add strategic pages
                                if (pagination.last_page >= 1) pagesToShow.add(1);
                                if (pagination.last_page >= 2) pagesToShow.add(2);

                                // Add current page and adjacent pages
                                if (currentPage > 1) pagesToShow.add(currentPage - 1);
                                pagesToShow.add(currentPage);
                                if (currentPage < pagination.last_page) pagesToShow.add(currentPage + 1);

                                // Add last pages
                                if (pagination.last_page >= 2) pagesToShow.add(pagination.last_page - 1);
                                if (pagination.last_page >= 1) pagesToShow.add(pagination.last_page);

                                const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

                                // Render buttons with ellipsis
                                sortedPages.forEach((page, index) => {
                                    if (index > 0 && page - sortedPages[index - 1] > 1) {
                                        pageButtons.push(
                                            <span key={`ellipsis-${page}`} className="px-2">...</span>
                                        );
                                    }

                                    pageButtons.push(
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 border rounded transition ${currentPage === page
                                                    ? "bg-[#DB4444] text-white"
                                                    : "hover:bg-[#DB4444] hover:text-white"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                });

                                return pageButtons;
                            })()}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-[#DB4444] hover:text-white transition"
                                disabled={currentPage === pagination.last_page}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShopPage;
