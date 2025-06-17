"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCard, { Product } from "@/app/components/product/ProductCard";
import LandingSlider from "@/app/components/home/LandingSlider";
import { LoadingSkeleton } from "@/app/components/loading/loading";
import { API_BASE_URL } from '@/utils/api';         
// ✅ Kiểu dữ liệu cho danh mục
interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug?: string };
  const router = useRouter();

  // ✅ Danh sách sản phẩm, danh mục, trạng thái
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Bộ lọc giá nâng cao
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [sortOptions, setSortOptions] = useState({
    asc: false,
    desc: false,
    discount: false,
  });
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // ✅ Toggle checkbox bộ lọc
  const toggleOption = (key: keyof typeof sortOptions) => {
    setSortOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Lấy danh sách danh mục
  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // ✅ Khi thay đổi danh mục → load sản phẩm & scroll đầu trang
  useEffect(() => {
    setLoading(true);
    setError(null);
    setProducts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const url = slug
      ? `${API_BASE_URL}/category/${slug}/products`
      : `${API_BASE_URL}/product`;

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

      {/* ✅ Bộ lọc danh mục và sắp xếp */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* ✅ Dropdown danh mục */}
        <div className="w-full md:w-1/5 ml-2">
          <select
            onChange={(e) => {
              const value = e.target.value;
              router.push(value === "all" ? `/category` : `/category/${value}`);
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#DB4444] transition"
          >
            <option value="all" selected={!slug}>
              Tất Cả Danh Mục
            </option>
            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.slug}
                selected={cat.slug === slug}
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Bộ lọc sắp xếp + dropdown giá */}
        <div className="flex flex-wrap gap-2 items-center justify-end text-black relative">
          <span className="text-sm">Sắp xếp theo</span>

          {/* ✅ Nút lọc cơ bản */}
          {["Phổ Biến", "Mới Nhất", "Bán Chạy"].map((label, index) => (
            <button
              key={index}
              className="px-3 py-1 rounded border text-sm transition-colors duration-200 hover:bg-[#DB4444] hover:text-white"
            >
              {label}
            </button>
          ))}

          {/* ✅ Dropdown "Giá" nâng cao */}
          <div className="relative">
            <button
              onClick={() => setShowPriceFilter(!showPriceFilter)}
              className="border px-3 py-1 mr-2 rounded text-sm text-black hover:border-[#DB4444] transition"
            >
              Giá ▾
            </button>

            {showPriceFilter && (
              <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow z-50 p-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={sortOptions.asc}
                    onChange={() => toggleOption("asc")}
                  />
                  Giá: thấp đến cao
                </label>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={sortOptions.desc}
                    onChange={() => toggleOption("desc")}
                  />
                  Giá: cao đến thấp
                </label>
                <label className="flex items-center gap-2 text-sm mb-4">
                  <input
                    type="checkbox"
                    checked={sortOptions.discount}
                    onChange={() => toggleOption("discount")}
                  />
                  Giảm giá nhiều nhất
                </label>

                {/* ✅ Slider khoảng giá */}
                <div className="mb-1 text-sm font-medium">Khoảng giá (₫):</div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>{priceRange[0].toLocaleString()}₫</span>
                  <span>{priceRange[1].toLocaleString()}₫</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([parseInt(e.target.value), priceRange[1]])
                  }
                  className="w-full mb-2 accent-[#DB4444]"
                />
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value)])
                  }
                  className="w-full accent-[#DB4444]"
                />

                {/* ✅ Nút "Lọc" */}
                <button
                  className="mt-4 w-full bg-[#DB4444] text-white text-sm py-2 rounded hover:opacity-90 transition"
                  onClick={() => {
                    setShowPriceFilter(false);
                    // TODO: Gọi API hoặc lọc dữ liệu ở đây
                    console.log("Lọc với:", sortOptions, priceRange);
                  }}
                >
                  Lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Danh sách sản phẩm */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <LoadingSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 min-h-[650px] justify-start place-items-start">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
              className={`px-3 py-1 border rounded ${
                currentPage === page
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
