// CategoryPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCard, { Product } from "@/app/components/product/ProductCard";
import LandingSlider from "@/app/components/home/LandingSlider";
import { LoadingSkeleton } from "@/app/components/loading/loading";
import { API_BASE_URL } from '@/utils/api';
import CategoryGrid from "@/app/components/home/CategoryGrid";
import PriceFilter from "@/app/components/categorry/CategoryFilter"; // Import the new PriceFilter component

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
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [sortOptions, setSortOptions] = useState({ asc: false, desc: false, discount: false });
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  const toggleOption = (key: keyof typeof sortOptions) => {
    setSortOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
        const items = slug ? data.products : data;
        if (!Array.isArray(items)) throw new Error("Data format invalid");
        setProducts(items);
        setCurrentPage(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-[1170px] mx-auto px-4 pt-6 pb-10 text-black">
      <LandingSlider />
      <div className="mt-8 mb-4">
        <CategoryGrid activeSlug={slug} noScroll />
      </div>

      {/* ✅ Bộ lọc danh mục và sắp xếp */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Danh mục dropdown */}
        <div className="w-full md:w-1/5 ml-2">
          <select
            value={slug || "all"}
            onChange={(e) => {
              const value = e.target.value;
              router.push(value === "all" ? `/category` : `/category/${value}`, { scroll: false });
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#DB4444] transition"
          >
            <option value="all">Tất Cả Danh Mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bộ lọc sắp xếp */}
        <div className="flex flex-wrap gap-2 items-center justify-end text-black relative">
          <span className="text-sm">Sắp xếp theo</span>
          {["Phổ Biến", "Mới Nhất", "Bán Chạy"].map((label, index) => (
            <button
              key={index}
              className="px-3 py-1 rounded border text-sm transition-colors duration-200 hover:bg-[#DB4444] hover:text-white"
            >
              {label}
            </button>
          ))}

          {/* Lọc nâng cao theo giá */}
          <PriceFilter
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            sortOptions={sortOptions}
            toggleOption={toggleOption}
            showPriceFilter={showPriceFilter}
            setShowPriceFilter={setShowPriceFilter}
          />
        </div>
      </div>

      {/* ✅ Danh sách sản phẩm */}
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : products.length === 0 && !loading ? (
        <p className="text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 min-h-[650px] justify-start items-start auto-rows-auto">
            {(loading ? Array(itemsPerPage).fill(null) : paginatedProducts).map((product, idx) => (
              <div key={idx}>
                {loading ? (
                  <div className="h-[250px] bg-gray-100 rounded animate-pulse" />
                ) : (
                  <ProductCard product={product!} />
                )}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mt-6">
              <div className="w-8 h-8 border-4 border-[#DB4444] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}

      {/* ✅ Phân trang */}
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
  );
}
