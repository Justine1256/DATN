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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [currentPriceRangeValue, setCurrentPriceRangeValue] = useState<number>(50000000);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(50000000);

  const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then(setCategories)
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

        items = items.filter((product: Product) =>
          (product.price || 0) >= 0 && (product.price || 0) <= filterPriceMax
        );

        if (selectedPriceFilter === "asc") {
          items.sort((a: Product, b: Product) => (a.price || 0) - (b.price || 0));
        } else if (selectedPriceFilter === "desc") {
          items.sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
        } else if (selectedPriceFilter === "discount") {
          items.sort((a: Product, b: Product) => (b.discount || 0) - (a.discount || 0));
        } else {
          if (selectedSort === "Mới Nhất") {
            items.sort((a: Product, b: Product) => (b.createdAt || 0) - (a.createdAt || 0));
          } else if (selectedSort === "Bán Chạy") {
            // Logic for sorting by "Best Selling"
          }
        }

        setProducts(items);
        setCurrentPage(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, selectedSort, filterPriceMax, selectedPriceFilter]);

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

  const handleApplyFilters = () => {
    setFilterPriceMax(currentPriceRangeValue);
  };

  const handleResetFilters = () => {
    setSelectedSort("Phổ Biến");
    setSelectedPriceFilter(null);
    setCurrentPriceRangeValue(50000000);
    setFilterPriceMax(50000000);
  };

  return (
    <div className="max-w-[1170px] mx-auto px-4 pt-6 pb-10 text-black">
      <LandingSlider />
      <CategoryGrid />

      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 flex flex-col gap-8">


          <div className="pt-4 flex flex-col space-y-4">
            <h3 className="text-lg font-semibold pb-4 border-b">Bộ lọc </h3>

            {/* Danh sách danh mục */}
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

            {/* Sắp xếp */}


            <div className="flex flex-col space-y-4">
              <h4 className="font-semibold">Giá</h4>
              <div className="flex flex-col">
                <label className="space-x-2 cursor-pointer w-full px-3 py-2 transition-colors hover:text-brand">
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
                <label className="space-x-2 cursor-pointer w-full px-3 py-2 transition-colors hover:text-brand">
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
                <label className="space-x-2 cursor-pointer w-full px-3 py-2 transition-colors hover:text-brand">
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
              </div>


              {/* <button
                onClick={handleApplyFilters}
                className="w-[160px] py-2 bg-[#DB4444] text-white rounded-lg hover:bg-red-600 transition-colors mt-4"
              >
                Lọc
              </button>
              <button
                onClick={handleResetFilters}
                className="w-[160px] py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors mt-2"
              >
                Đặt lại
              </button> */}
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
