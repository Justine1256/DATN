"use client";

import { useRouter } from "next/navigation";

// ✅ Định nghĩa kiểu dữ liệu ngay trong file
type Category = {
  id: number;
  name: string;
  slug: string;
};

type SortOptions = {
  asc: boolean;
  desc: boolean;
  discount: boolean;
};

interface Props {
  slug?: string;
  categories: Category[];
  sortOptions: SortOptions;
  toggleOption: (key: keyof SortOptions) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  showPriceFilter: boolean;
  setShowPriceFilter: (val: boolean) => void;
}

export default function CategoryFilterBar({
  slug,
  categories,
  sortOptions,
  toggleOption,
  priceRange,
  setPriceRange,
  showPriceFilter,
  setShowPriceFilter,
}: Props) {
  const router = useRouter();

  return (
    <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Dropdown danh mục */}
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
            <option key={cat.id} value={cat.slug} selected={cat.slug === slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bộ lọc sắp xếp + dropdown giá */}
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
              <button
                className="mt-4 w-full bg-[#DB4444] text-white text-sm py-2 rounded hover:opacity-90 transition"
                onClick={() => {
                  setShowPriceFilter(false);
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
  );
}
