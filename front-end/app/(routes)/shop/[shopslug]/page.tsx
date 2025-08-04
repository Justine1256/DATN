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
    price: string | number;  // API returns string like "200000.00"
    oldPrice: number;
    rating: string;
    rating_avg?: string | number;  // API returns string like "5.0000"
    discount: number;
    sale_price?: string | number | null;  // API can return string, number, or null
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
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [slug, setSlug] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Price filter states
    const [tempStartPrice, setTempStartPrice] = useState<number>(0);
    const [tempEndPrice, setTempEndPrice] = useState<number>(50000000);
    const [appliedStartPrice, setAppliedStartPrice] = useState<number>(0);
    const [appliedEndPrice, setAppliedEndPrice] = useState<number>(50000000);

    // Sorting states
    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
    const [selectedDiscountSort, setSelectedDiscountSort] = useState<string | null>(null);
    const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);

    useEffect(() => {
        const pathSlug = window.location.pathname.split('/').pop();
        setSlug(pathSlug ?? null);
    }, []);

    const fetchData = useCallback(async () => {
        if (!slug) {
            setError('Không tìm thấy slug cửa hàng trên URL.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch shop info and categories first
            const [shopRes, categoryRes] = await Promise.all([
                fetch(`${API_BASE_URL}/shop/${slug}`),
                fetch(`${API_BASE_URL}/shop/${slug}/categories`)
            ]);

            const shopData = await shopRes.json();
            const categoryData = await categoryRes.json();

            if (!shopData?.shop) {
                setError('Không tìm thấy dữ liệu cửa hàng.');
                setLoading(false);
                return;
            }

            setShop(shopData.shop);
            setCategories(categoryData.categories || []);

            // Fetch all products by getting all pages
            let allProducts: Product[] = [];
            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const productRes = await fetch(`${API_BASE_URL}/shop/${slug}/products?page=${currentPage}`);
                const productData = await productRes.json();

                // Handle paginated product data
                let pageProducts: Product[] = [];
                if (Array.isArray(productData.products)) {
                    pageProducts = productData.products;
                } else if (Array.isArray(productData.products?.data)) {
                    pageProducts = productData.products.data;
                } else if (productData.data && Array.isArray(productData.data)) {
                    pageProducts = productData.data;
                }

                allProducts = [...allProducts, ...pageProducts];

                // Check if there are more pages
                hasMorePages = productData.next_page_url !== null || 
                              (productData.current_page && productData.last_page && 
                               productData.current_page < productData.last_page);
                
                currentPage++;
                
                // Safety check to prevent infinite loop
                if (currentPage > 50) break;
            }

            // Remove duplicates based on product ID
            const uniqueProducts = allProducts.filter((product, index, self) => 
                index === self.findIndex(p => p.id === product.id)
            );

            // Process products (without sorting/filtering here)
            const productsWithTs = uniqueProducts.map(p => ({
                ...p,
                createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
                rating: p.rating.toString(),
                oldPrice: p.oldPrice ?? 0,
            }));

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
        if (slug) fetchData();
    }, [fetchData, slug]);

    // Apply filters and sorting to products (client-side only)
    useEffect(() => {
        if (initialProducts.length === 0) return;

        let filteredProducts = [...initialProducts];

        // Apply category filter first
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter((product: Product) => {
                // Method 1: Check if product has category object with matching slug
                if (product.category && typeof product.category === 'object' && 'slug' in product.category) {
                    return product.category.slug === selectedCategory;
                }
                
                // Method 2: Find category by slug and compare with product.category_id
                const category = categories.find(cat => cat.slug === selectedCategory);
                if (category && product.category_id) {
                    return product.category_id === category.id;
                }
                
                return false;
            });
        }

        // Apply price filter
        filteredProducts = filteredProducts.filter((product: Product) => {
            const priceToFilter = Number(product.sale_price ?? product.price) || 0;
            return priceToFilter >= appliedStartPrice && priceToFilter <= appliedEndPrice;
        });

        // Apply sorting with priority system
        filteredProducts.sort((a: Product, b: Product) => {
            // Priority 1: Name sort
            if (selectedNameSort) {
                const nameA = a.name || "";
                const nameB = b.name || "";
                return selectedNameSort === "asc"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }

            // Priority 2: Price sort
            if (selectedPriceSort) {
                const priceA = Number(a.sale_price ?? a.price) || 0;
                const priceB = Number(b.sale_price ?? b.price) || 0;
                return selectedPriceSort === "asc" ? priceA - priceB : priceB - priceA;
            }

            // Priority 3: Discount sort
            if (selectedDiscountSort) {
                const calculateDiscount = (product: Product) => {
                    const originalPrice = Number(product.price) || 0;
                    const salePrice = Number(product.sale_price) || originalPrice;
                    return originalPrice > 0 && salePrice < originalPrice
                        ? ((originalPrice - salePrice) / originalPrice) * 100
                        : 0;
                };

                const discountA = calculateDiscount(a);
                const discountB = calculateDiscount(b);
                return selectedDiscountSort === "asc" ? discountA - discountB : discountB - discountA;
            }

            // Priority 4: Basic sorts (fallback)
            if (selectedSort === "Mới Nhất") {
                return (b.createdAt || 0) - (a.createdAt || 0);
            } else if (selectedSort === "Bán Chạy") {
                return (b.sold || 0) - (a.sold || 0);
            } else if (selectedSort === "Phổ Biến") {
                return Number(b.rating_avg || b.rating || 0) - Number(a.rating_avg || a.rating || 0);
            }

            return a.id - b.id;
        });

        setProducts(filteredProducts);
        setCurrentPage(1); // Reset to first page when filters change
    }, [initialProducts, selectedCategory, categories, appliedStartPrice, appliedEndPrice, selectedSort, selectedPriceSort, selectedDiscountSort, selectedNameSort]);

    // Pagination logic
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const paginatedProducts = products.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handler functions
    const handleCategorySelect = (categorySlug: string | null) => {
        setSelectedCategory(categorySlug);
        setCurrentPage(1);
        // No need to fetch API - filtering is done client-side
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
        setSelectedDiscountSort(null);
        setSelectedNameSort(null);
        setSelectedCategory(null);
        
        // Reset price filter states
        setTempStartPrice(0);
        setTempEndPrice(50000000);
        setAppliedStartPrice(0);
        setAppliedEndPrice(50000000);
        
        setCurrentPage(1);
        // No need to fetch API - filtering will be applied automatically via useEffect
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", { 
            style: "currency", 
            currency: "VND" 
        }).format(value);
    };

    // Loading state
    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 pb-10 text-black">
                <div className="animate-pulse space-y-6">
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
                    <div className="h-[50px] bg-gray-100 rounded w-full mt-6"></div>
                </div>
            </div>
        );
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

            {products.length > 0 ? (
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
                                    {(showAllCategories ? categories : categories.slice(0, 6)).map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.slug)}
                                        className={`w-full px-3 py-2 transition-colors text-left ${
                                            cat.slug === selectedCategory 
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
                        ) : products.length === 0 && !loading ? (
                            <p className="text-gray-500">Không có sản phẩm nào.</p>
                        ) : (
                            <div>
                                {/* Sắp xếp sản phẩm */}
                                <div className="flex mb-5 gap-2 items-center">
                                    <span className="w-full">Sắp xếp theo:</span>
                                    <select
                                        className="border w-full px-3 py-2 rounded cursor-pointer"
                                        value={selectedSort}
                                        onChange={e => {
                                            setSelectedSort(e.target.value);
                                            setSelectedPriceSort(null);
                                            setSelectedDiscountSort(null);
                                            setSelectedNameSort(null);
                                        }}>
                                        <option value="Phổ Biến">Phổ Biến</option>
                                        <option value="Mới Nhất">Mới Nhất</option>
                                        <option value="Bán Chạy">Bán Chạy</option>
                                    </select>

                                    {/* Sắp xếp giá đã giảm */}
                                    <select
                                        className="border w-full px-3 py-2 rounded cursor-pointer"
                                        value={selectedPriceSort || ""}
                                        onChange={e => {
                                            setSelectedPriceSort(e.target.value || null);
                                            if (e.target.value) {
                                                setSelectedDiscountSort(null);
                                                setSelectedNameSort(null);
                                            }
                                        }}
                                    >
                                        <option value="">Giá</option>
                                        <option value="asc">Thấp đến cao</option>
                                        <option value="desc">Cao đến thấp</option>
                                    </select>

                                    {/* Sắp xếp theo khuyến mãi */}
                                    <select
                                        className="border w-full px-3 py-2 rounded cursor-pointer"
                                        value={selectedDiscountSort || ""}
                                        onChange={e => {
                                            setSelectedDiscountSort(e.target.value || null);
                                            if (e.target.value) {
                                                setSelectedPriceSort(null);
                                                setSelectedNameSort(null);
                                            }
                                        }}
                                    >
                                        <option value="">Khuyến mãi</option>
                                        <option value="asc">Thấp đến cao</option>
                                        <option value="desc">Cao đến thấp</option>
                                    </select>

                                    {/* Sắp xếp tên sản phẩm */}
                                    <select 
                                        className="border w-full px-3 py-2 rounded cursor-pointer"
                                        value={selectedNameSort || ""}
                                        onChange={e => {
                                            setSelectedNameSort(e.target.value || null);
                                            if (e.target.value) {
                                                setSelectedPriceSort(null);
                                                setSelectedDiscountSort(null);
                                            }
                                        }}
                                    >
                                        <option value="">Tên</option>
                                        <option value="asc">A đến Z</option>
                                        <option value="desc">Z đến A</option>
                                    </select>

                                    {/* Reset sorts button */}
                                    <button
                                        onClick={() => {
                                            setSelectedSort("Phổ Biến");
                                            setSelectedPriceSort(null);
                                            setSelectedDiscountSort(null);
                                            setSelectedNameSort(null);
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm whitespace-nowrap"
                                    >
                                        Đặt lại
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[650px]">
                                    {paginatedProducts.map((product, idx) => (
                                        <div key={`product-${product.id}-${idx}`}>
                                            <ProductCardCate 
                                                product={{
                                                    ...product,
                                                    price: Number(product.price) || 0,
                                                    sale_price: product.sale_price ? Number(product.sale_price) : undefined,
                                                    rating_avg: product.rating_avg ? Number(product.rating_avg) : undefined
                                                }} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
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
                                    if (totalPages >= 1) pagesToShow.add(1);
                                    if (totalPages >= 2) pagesToShow.add(2);

                                    // Add current page and adjacent pages
                                    if (currentPage > 1) pagesToShow.add(currentPage - 1);
                                    pagesToShow.add(currentPage);
                                    if (currentPage < totalPages) pagesToShow.add(currentPage + 1);

                                    // Add last pages
                                    if (totalPages >= 2) pagesToShow.add(totalPages - 1);
                                    if (totalPages >= 1) pagesToShow.add(totalPages);

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
                                                className={`px-3 py-1 border rounded transition ${
                                                    currentPage === page
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
                                    disabled={currentPage === totalPages}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
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
