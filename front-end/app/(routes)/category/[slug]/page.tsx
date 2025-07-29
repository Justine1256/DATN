"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCardcate from "@/app/components/product/ProductCardCate";
import LandingSlider from "@/app/components/home/LandingSlider";
import { API_BASE_URL } from "@/utils/api";
import CategoryGrid from "@/app/components/home/CategoryGrid";

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
    name: string;
    slug: string;
  };
  createdAt?: number;
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
  const [shopName, setShopName] = useState<Array<{ name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [currentPriceRangeValue, setCurrentPriceRangeValue] = useState<number>(50000000);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(50000000);
  const [startPrice, setStartPrice] = useState<number>(0);
  const [endPrice, setEndPrice] = useState<number>(50000);
  // Add string states for input fields
  const [startPriceInput, setStartPriceInput] = useState<string>("0");
  const [endPriceInput, setEndPriceInput] = useState<string>("50000");

  const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string | null>(null);
  const [selectedOriginalPriceFilter, setSelectedOriginalPriceFilter] = useState<string | null>(null);
  const [selectedShopSlug, setSelectedShopSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then((data) => {
        // console.log("Danh mục categories:", data);
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProducts([]);

    const url = slug ? `${API_BASE_URL}/category/${slug}/products` : `${API_BASE_URL}/product`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let items: Product[] = slug ? data.products : data;
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
        setShopName(shopInfo);

        items = items.filter((product: Product) => {
          const priceToFilter = product.sale_price != null ? product.sale_price : product.price || 0;
          return priceToFilter >= startPrice && priceToFilter <= filterPriceMax;
        });

        if (selectedPriceFilter === "asc") {
          items.sort((a: Product, b: Product) => (a.sale_price || 0) - (b.sale_price || 0));
        } else if (selectedPriceFilter === "desc") {
          items.sort((a: Product, b: Product) => (b.sale_price || 0) - (a.sale_price || 0));
        } else if (selectedPriceFilter === "discount") {
          items.sort((a: Product, b: Product) => (b.discount || 0) - (a.discount || 0));
        } else {
          if (selectedSort === "Mới Nhất") {
            items.sort((a: Product, b: Product) => (b.createdAt || 0) - (a.createdAt || 0));
          } else if (selectedSort === "Bán Chạy") {
            // Logic for sorting by "Best Selling"
          }
        }

        if (selectedOriginalPriceFilter === "asc") {
          items.sort((a: Product, b: Product) => (a.price || 0) - (b.price || 0));
        } else if (selectedOriginalPriceFilter === "desc") {
          items.sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
        } else {
          console.log("No original price filter applied");
        }

        if (selectedShopSlug) {
          items = items.filter(product => product.shop?.slug === selectedShopSlug);
        }

        // console.log("Fetched total:", items.length);
        setProducts(items);
        setCurrentPage(1);
        // console.log(selectedShopSlug);

      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, selectedSort, filterPriceMax, startPrice, selectedPriceFilter, selectedOriginalPriceFilter, selectedShopSlug]);

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
    if (categorySlug) {
      router.push(`/category/${categorySlug}`);
    } else {
      router.push(`/category`);
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
    setFilterPriceMax(currentPriceRangeValue);
  };

  const handleResetFilters = () => {
    setSelectedSort("Phổ Biến");
    setSelectedPriceFilter(null);
    setCurrentPriceRangeValue(50000000);
    setFilterPriceMax(50000000);
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
    <div className="max-w-[1170px] mx-auto px-4 pt-6 pb-10 text-black">
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
                  ${!slug ? "text-brand font-semibold" : "hover:text-brand"}`}
                >
                  Tất Cả Sản Phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full px-3 py-2 transition-colors text-left
                    ${cat.slug === slug ? "text-brand font-semibold" : "hover:text-brand"}`}
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
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full px-3 py-2 transition-colors text-left
                  ${!selectedShopSlug ? "text-brand font-semibold" : "hover:text-brand"}`}
                >
                  Tất Cả
                </button>
                {shopName.map((shop) => (
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
            {/* Lọc theo giá */}
            <div className="flex flex-col space-y-4">
              
              <div className="flex gap-2">
                <h4 className="font-semibold">Giá</h4>
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
      transition-transform duration-200"
                />
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
                  className="w-1/2 bg-[#DB4444] text-white px-4 py-3 rounded text-base font-semibold hover:opacity-90"
                >
                  Áp dụng
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-1/2 text-gray-600 border px-4 py-3 rounded text-base font-semibold hover:text-black"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[650px] justify-start items-start auto-rows-auto">
              {paginatedProducts.map((product, idx) => (
                <div key={idx}>
                  {loading ? (
                    <div className="h-[250px] bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <ProductCardcate product={product!} />
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-[#DB4444] hover:text-white transition"
                disabled={currentPage === 1}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              ))}

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
