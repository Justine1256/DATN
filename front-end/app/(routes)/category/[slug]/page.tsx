"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCardcate from "@/app/components/product/ProductCardCate";
import LandingSlider from "@/app/components/home/LandingSlider";
import { API_BASE_URL } from "@/utils/api";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import { it } from "node:test";
import { log } from "console";

interface Product {
  id: number;
  name: string;
  image: string[];
  slug: string;
  price: string | number;  // API returns string like "200000.00"
  oldPrice: number;
  rating: number;
  rating_avg?: string | number;  // API returns string like "5.0000"
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: string | number | null;  // API can return string, number, or null
  shop_slug: string;
  shop?: {
    name: string;
    slug: string;
  };
  createdAt?: number;
  sold?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug?: string };
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredShops, setFilteredShops] = useState<Array<{ name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Temporary slider values (for UI display only)
  const [tempStartPrice, setTempStartPrice] = useState<number>(0);
  const [tempEndPrice, setTempEndPrice] = useState<number>(50000000);

  // Applied filter values (used for actual filtering)
  const [appliedStartPrice, setAppliedStartPrice] = useState<number>(0);
  const [appliedEndPrice, setAppliedEndPrice] = useState<number>(50000000);

  // Legacy states for compatibility
  const [currentPriceRangeValue, setCurrentPriceRangeValue] = useState<number>(50000000);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(50000000);
  const [startPrice, setStartPrice] = useState<number>(0);
  const [endPrice, setEndPrice] = useState<number>(50000);
  // Add string states for input fields
  const [startPriceInput, setStartPriceInput] = useState<string>("0");
  const [endPriceInput, setEndPriceInput] = useState<string>("50000");

  const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
  const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
  const [selectedDiscountSort, setSelectedDiscountSort] = useState<string | null>(null);
  const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);
  const [selectedShopSlug, setSelectedShopSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(slug || null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProducts([]);

    // Always fetch all products, then filter locally
    const url = `${API_BASE_URL}/product`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let items: Product[] = data;
        if (!Array.isArray(items)) throw new Error("Data format invalid");

        const shopInfoRaw = items
          .map(item => item.shop)
          .filter((shop): shop is { name: string; slug: string } => !!shop && typeof shop.name === "string" && typeof shop.slug === "string");
        const shopInfo: { name: string; slug: string }[] = [];
        const seenSlugs = new Set<string>();
        for (const shop of shopInfoRaw) {
          if (!seenSlugs.has(shop.slug)) {
            shopInfo.push(shop);
            seenSlugs.add(shop.slug);
          }
        }
        setFilteredShops(shopInfo);

        // Filter by category if selected
        if (selectedCategorySlug) {
          const categoryUrl = `${API_BASE_URL}/category/${selectedCategorySlug}/products`;
          return fetch(categoryUrl).then(res => res.json()).then(categoryData => {
            items = categoryData.products || [];

            // Update filtered shops based on category products
            const categoryShopInfoRaw = items
              .map(item => item.shop)
              .filter((shop): shop is { name: string; slug: string } => !!shop && typeof shop.name === "string" && typeof shop.slug === "string");
            const categoryShopInfo: { name: string; slug: string }[] = [];
            const categorySeenSlugs = new Set<string>();
            for (const shop of categoryShopInfoRaw) {
              if (!categorySeenSlugs.has(shop.slug)) {
                categoryShopInfo.push(shop);
                categorySeenSlugs.add(shop.slug);
              }
            }
            setFilteredShops(categoryShopInfo);

            // Apply price filter
            items = items.filter((product: Product) => {
              const priceToFilter = Number(product.sale_price ?? product.price) || 0;
              return priceToFilter >= appliedStartPrice && priceToFilter <= appliedEndPrice;
            });

            // Apply shop filter
            if (selectedShopSlug) {
              items = items.filter(product => product.shop?.slug === selectedShopSlug);
            }

            return items;
          });
        } else {
          // Show all shops when no category is selected
          setFilteredShops(shopInfo);

          // Apply price filter
          items = items.filter((product: Product) => {
            const priceToFilter = Number(product.sale_price ?? product.price) || 0;
            return priceToFilter >= appliedStartPrice && priceToFilter <= appliedEndPrice;
          });

          // Apply shop filter
          if (selectedShopSlug) {
            items = items.filter(product => product.shop?.slug === selectedShopSlug);
          }

          return Promise.resolve(items);
        }
      })
      .then((items) => {
        // Simple sorting logic - only one sort applies at a time
        items.sort((a: Product, b: Product) => {
          // Priority 1: Name sort (highest priority)
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



            if (selectedPriceSort === "asc") {
              return priceA - priceB;
            } else if (selectedPriceSort === "desc") {
              return priceB - priceA;
            }
          }

          // Priority 3: Discount sort
          if (selectedDiscountSort) {
            // Calculate discount percentage: ((original_price - sale_price) / original_price) * 100
            const calculateDiscount = (product: Product) => {
              const originalPrice = Number(product.price) || 0;
              const salePrice = Number(product.sale_price) || originalPrice;
              
              if (originalPrice > 0 && salePrice < originalPrice) {
                return ((originalPrice - salePrice) / originalPrice) * 100;
              }
              return 0; // No discount if sale_price is null or >= original price
            };

            const discountA = calculateDiscount(a);
            const discountB = calculateDiscount(b);


            if (selectedDiscountSort === "asc") {
              return discountA - discountB;
            } else if (selectedDiscountSort === "desc") {
              return discountB - discountA;
            }
          }

          // Priority 4: Basic sorts (lowest priority - fallback)
          if (selectedSort === "Mới Nhất") {
            return (b.createdAt || 0) - (a.createdAt || 0);
          } else if (selectedSort === "Bán Chạy") {
            return (b.sold || 0) - (a.sold || 0);
          } else if (selectedSort === "Phổ Biến") {
            return (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0);
          }

          // Default: sort by ID
          return a.id - b.id;
        });

        setProducts(items);
        setCurrentPage(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCategorySlug, selectedSort, appliedStartPrice, appliedEndPrice, selectedPriceSort, selectedDiscountSort, selectedNameSort, selectedShopSlug]);

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

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategorySlug(categorySlug);
    // Reset shop selection when category changes
    setSelectedShopSlug(null);
    // Update URL without page reload using history API
    if (categorySlug) {
      window.history.pushState({}, '', `/category/${categorySlug}`);
    } else {
      window.history.pushState({}, '', `/category`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };


  const formatInputValue = (value: number | string) => {
    if (value === null || value === undefined) return "";
    const num = typeof value === "string" ? Number(value.replace(/\D/g, "")) : value;
    return num ? num.toLocaleString("vi-VN") : "";
  };

  const handleApplyFilters = () => {
    setAppliedStartPrice(tempStartPrice);
    setAppliedEndPrice(tempEndPrice);
    // Update legacy states for compatibility
    setFilterPriceMax(tempEndPrice);
    setStartPrice(tempStartPrice);
    setCurrentPriceRangeValue(tempEndPrice);
  };

  const handleResetFilters = () => {
    setSelectedSort("Phổ Biến");
    setSelectedPriceSort(null);
    setSelectedDiscountSort(null);
    setSelectedNameSort(null);
    // Reset temporary values
    setTempStartPrice(0);
    setTempEndPrice(50000000);
    // Reset applied values
    setAppliedStartPrice(0);
    setAppliedEndPrice(50000000);
    // Reset legacy states
    setCurrentPriceRangeValue(50000000);
    setFilterPriceMax(50000000);
    setStartPrice(0);
    setSelectedShopSlug(null);
    setSelectedCategorySlug(null);
  };

  const filterByPrice = (startPrice: string, endPrice: string) => {
    // Parse input values to numbers
    const start = Number(startPriceInput.replace(/\D/g, "")) * 1000;
    const end = Number(endPriceInput.replace(/\D/g, "")) * 1000;
    if (start >= 0 && end >= start) {
      setStartPrice(start);
      setEndPrice(end);
      setFilterPriceMax(end);
      setCurrentPriceRangeValue(end);
      setError(null);
    } else {
      setError("Giá không hợp lệ");
    }
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 pt-16 pb-10 text-black">
      <LandingSlider />
      <CategoryGrid />

      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 flex flex-col gap-8">
          {/* Bộ lọc và sắp xếp */}
          <div className="pt-4 flex flex-col space-y-4">
            <h3 className="text-lg font-semibold pb-4 border-b">Bộ lọc </h3>

            {/* Danh mục */}
            <div className="flex flex-col space-y-4">
              <h3 className="font-semibold">Danh mục</h3>
              <div>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full px-3 py-2 transition-colors text-left
                  ${!selectedCategorySlug ? "text-brand font-semibold" : "hover:text-brand"}`}
                >
                  Tất Cả Sản Phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full px-3 py-2 transition-colors text-left
                    ${cat.slug === selectedCategorySlug ? "text-brand font-semibold" : "hover:text-brand"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cửa hàng */}
            <div className="flex flex-col space-y-4">
              <h3 className="font-semibold">Cửa hàng</h3>

              <div>
                <button
                  onClick={() => setSelectedShopSlug(null)}
                  className={`w-full px-3 py-2 transition-colors text-left
                  ${!selectedShopSlug ? "text-brand font-semibold" : "hover:text-brand"}`}
                >
                  Tất Cả
                </button>
                {filteredShops.map((shop) => (
                  <button
                    key={shop.slug}
                    onClick={() => setSelectedShopSlug(shop.slug)}
                    className={`w-full px-3 py-2 transition-colors text-left
                    ${shop.slug === selectedShopSlug ? "text-brand font-semibold" : "hover:text-brand"}`}
                  >
                    {shop.name}
                  </button>
                ))}
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
                    // Reset other sorts when price sort is selected
                    if (e.target.value) {
                      setSelectedDiscountSort(null);
                      setSelectedNameSort(null);
                    }
                  }}>
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
                    // Reset other sorts when discount sort is selected
                    if (e.target.value) {
                      setSelectedPriceSort(null);
                      setSelectedNameSort(null);
                    }
                  }}>
                  <option value="">Khuyến mãi</option>
                  <option value="asc">Thấp đến cao</option>
                  <option value="desc">Cao đến thấp</option>
                </select>

                {/* Sắp xếp tên sản phẩm */}
                <select className="border w-full px-3 py-2 rounded cursor-pointer"
                  value={selectedNameSort || ""}
                  onChange={e => {
                    setSelectedNameSort(e.target.value || null);
                    // Reset other sorts when name sort is selected
                    if (e.target.value) {
                      setSelectedPriceSort(null);
                      setSelectedDiscountSort(null);
                    }
                  }}>
                  <option value="">Tên</option>
                  <option value="asc">A đến Z</option>
                  <option value="desc">Z đến A</option>
                </select>

                {/* Clear All Sorts Button */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[650px] justify-start items-start auto-rows-auto">
                {paginatedProducts.map((product, idx) => (
                  <div key={idx}>
                    {loading ? (
                      <div className="h-[250px] bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <ProductCardcate product={{
                        ...product,
                        price: Number(product.price) || 0,
                        sale_price: product.sale_price ? Number(product.sale_price) : undefined,
                        rating_avg: product.rating_avg ? Number(product.rating_avg) : undefined
                      }} />
                    )}
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

                // Add first 2 pages
                if (totalPages >= 1) pagesToShow.add(1);
                if (totalPages >= 2) pagesToShow.add(2);

                // Add current page and adjacent pages
                if (currentPage > 1) pagesToShow.add(currentPage - 1);
                pagesToShow.add(currentPage);
                if (currentPage < totalPages) pagesToShow.add(currentPage + 1);

                // Add last 2 pages
                if (totalPages >= 2) pagesToShow.add(totalPages - 1);
                if (totalPages >= 1) pagesToShow.add(totalPages);

                // Convert to sorted array
                const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

                // Render buttons with ellipsis
                sortedPages.forEach((page, index) => {
                  // Add ellipsis if there's a gap
                  if (index > 0 && page - sortedPages[index - 1] > 1) {
                    pageButtons.push(
                      <span key={`ellipsis-${page}`} className="px-2">...</span>
                    );
                  }

                  pageButtons.push(
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded ${currentPage === page
                        ? "bg-[#DB4444] text-white"
                        : "hover:bg-[#DB4444] hover:text-white"
                        } transition`}
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
    </div>
  );
}
