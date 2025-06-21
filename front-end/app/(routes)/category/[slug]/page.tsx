"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCardCate, { Product } from "@/app/components/product/ProductCardCate";
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

  const handleCategoryChange = (categorySlug: string) => {
    // Use router.push for client-side navigation, preventing page reload
    router.push(`/category/${categorySlug}`);
  };

  return (
    <div className="max-w-[1170px] mx-auto px-4 pt-6 pb-10 text-black">
      <LandingSlider />
      <div className="mt-8 mb-4">
        <CategoryGrid activeSlug={slug} noScroll />
      </div>

      {/* ✅ Flexbox layout for product grid and filter */}
      <div className="flex gap-6">
        {/* Left Column - Category List */}
        <div className="w-1/4 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Danh mục</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}  // Use client-side navigation
                className={`w-full text-left px-4 py-2 rounded transition-colors hover:bg-[#DB4444] hover:text-white ${cat.slug === slug ? "bg-[#DB4444] text-white" : "text-black"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Product Grid */}
        <div className="flex-1">
          {/* ✅ Danh sách sản phẩm */}
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : products.length === 0 && !loading ? (
            <p className="text-gray-500">Không có sản phẩm nào.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[650px] justify-start items-start auto-rows-auto">
                {(loading ? Array(itemsPerPage).fill(null) : paginatedProducts).map((product, idx) => (
                  <div key={idx}>
                    {loading ? (
                      <div className="h-[250px] bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <ProductCardCate product={product!} />
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
      </div>
    </div>
  );
}
