'use client';

import { useEffect, useState } from 'react';
import ShopCard from '@/app/components/stores/Shopcard';
import ProductCardCate from '@/app/components/product/ProductCardCate';
import { API_BASE_URL } from "@/utils/api";

interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: number;
    oldPrice: number;
    rating: number;
    discount: number;
    option1?: string;
    value1?: string;
    sale_price?: number;
    shop_slug: string;
    shop?: {
        slug: string;
    };
    createdAt?: number;
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
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceFilter, setSelectedPriceFilter] = useState<string | null>(null);

    // Fetch shop and category data
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

                    // Fetch categories of the shop
                    const categoryResponse = await fetch(`${API_BASE_URL}/shop/${slug}/categories`);
                    const categoryData = await categoryResponse.json();

                    if (categoryData && categoryData.categories) {
                        setCategories(categoryData.categories);
                    }
                } else {
                    setError('Không tìm thấy dữ liệu cửa hàng');
                }
            } catch (err) {
                console.error('Error fetching shop data:', err);
                setError('Đã xảy ra lỗi khi tải dữ liệu cửa hàng');
            }
            setLoading(false);
        };

        fetchShop();
    }, []);

    // Handle category selection
    const handleCategorySelect = async (categorySlug: string | null) => {
        setSelectedCategory(categorySlug);

        try {
            const url = categorySlug
                ? `${API_BASE_URL}/shop/${shop?.slug}/category/${categorySlug}/products`
                : `${API_BASE_URL}/shop/${shop?.slug}/products`;

            const productResponse = await fetch(url);
            const productData = await productResponse.json();

            if (productData && productData.products) {
                setProducts(productData.products);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    // Apply price and sorting filters
    const handleApplyFilters = () => {
        let filteredProducts = products;

        // Sort products by price or discount
        if (selectedPriceFilter === "asc") {
            filteredProducts = filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (selectedPriceFilter === "desc") {
            filteredProducts = filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (selectedPriceFilter === "discount") {
            filteredProducts = filteredProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        // Sort products by the selected sorting option
        if (selectedSort === "Mới Nhất") {
            filteredProducts = filteredProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else if (selectedSort === "Bán Chạy") {
            // Logic for best-selling sorting can be implemented here
        }

        setProducts(filteredProducts);
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedSort("Phổ Biến");
        setSelectedPriceFilter(null);
        setSelectedCategory(null);
        setProducts(products);  // Reset to the original products
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
    return (
        <div className="max-w-[1170px] mx-auto px-4 pt-6 pb-10 text-black">
            {/* Hiển thị thông tin cửa hàng */}
            <ShopCard shop={shop} />

            {/* Danh mục và bộ lọc */}
            <div className="flex flex-col lg:flex-row gap-10 justify-between mt-8 ml-8">
                {/* Danh mục và Bộ lọc bên trái */}
                <div className="w-full lg:w-1/4 flex flex-col gap-8 mb-8">
                    {/* Danh mục */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-[#db4444]">Danh mục sản phẩm</h2>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.slug)}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors ${cat.slug === selectedCategory ? "text-[#DB4444] font-semibold" : "text-black hover:text-[#DB4444]"}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bộ lọc & Sắp xếp */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Bộ lọc & Sắp xếp</h3>
                        <div className="space-y-2 mb-6">
                            <h4 className="text-base font-medium mb-1">Sắp xếp</h4>
                            {["Phổ Biến", "Mới Nhất", "Bán Chạy"].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setSelectedSort(label)}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors ${selectedSort === label ? "text-[#DB4444] font-semibold" : "text-black hover:text-[#DB4444]"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Bộ lọc theo giá */}
                        <div className="space-y-3">
                            <h4 className="text-base font-medium mb-1">Giá</h4>
                            <label className="flex items-center space-x-2 text-black cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceFilterOptions"
                                    className="form-radio text-[#DB4444] rounded-sm focus:ring-0 accent-[#DB4444]"
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
                                    className="form-radio text-[#DB4444] rounded-sm focus:ring-0 accent-[#DB4444]"
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
                                    className="form-radio text-[#DB4444] rounded-sm focus:ring-0 accent-[#DB4444]"
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
                                className="w-full py-2 bg-[#DB4444] text-white rounded-lg hover:bg-red-600 transition-colors mt-4"
                            >
                                Lọc
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="w-full py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors mt-2"
                            >
                                Đặt lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hiển thị sản phẩm bên phải */}
                <div className="flex-1 ml-6">
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Sản phẩm trong danh mục "{selectedCategory || 'Tất cả'}"</h2>
                        {loading ? (
                            <div className="text-center">Đang tải sản phẩm...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[650px] justify-start items-start auto-rows-auto">
                                {products.length > 0 ? (
                                    products.map((product, idx) => (
                                        <div key={idx} className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.33%-1rem)] lg:w-[calc(25%-1rem)]">
                                            <ProductCardCate product={product} />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">Không có sản phẩm nào trong danh mục này.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
    


    
    
    
};

export default ShopPage;
