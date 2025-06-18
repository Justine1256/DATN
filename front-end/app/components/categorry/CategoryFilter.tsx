"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Định nghĩa kiểu dữ liệu
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

// Mock data cho demo
const mockCategories: Category[] = [
  { id: 1, name: "Điện thoại", slug: "dien-thoai" },
  { id: 2, name: "Laptop", slug: "laptop" },
  { id: 3, name: "Máy tính bảng", slug: "may-tinh-bang" },
  { id: 4, name: "Đồng hồ thông minh", slug: "dong-ho-thong-minh" },
  { id: 5, name: "Tai nghe", slug: "tai-nghe" },
];

export default function CategoryFilterBar({
  slug = "",
  categories = mockCategories,
  sortOptions = { asc: false, desc: false, discount: false },
  toggleOption = () => { },
  priceRange = [0, 50000000],
  setPriceRange = () => { },
  showPriceFilter = false,
  setShowPriceFilter = () => { },
}: Props) {
  const router = useRouter();
  const [localSortOptions, setLocalSortOptions] = useState(sortOptions);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localShowPriceFilter, setLocalShowPriceFilter] = useState(showPriceFilter);

  const handleToggleOption = (key: keyof SortOptions) => {
    setLocalSortOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toggleOption(key);
  };

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setLocalPriceRange(newRange);
    setPriceRange(newRange);
  };

  return (
    <div className="bg-white">
      {/* Header với danh mục */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        {/* Dropdown danh mục */}
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục sản phẩm
          </label>
          <select
            onChange={(e) => {
              const value = e.target.value;
              router.push(value === "all" ? `/category` : `/category/${value}`);
            }}
            className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-[#DB4444] focus:ring-1 focus:ring-[#DB4444] transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="all" selected={!slug}>
              Tất cả danh mục
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug} selected={cat.slug === slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bộ lọc sắp xếp */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Sắp xếp:</span>

          {[
            { label: "Phổ biến", key: "popular" },
            { label: "Mới nhất", key: "newest" },
            { label: "Bán chạy", key: "bestseller" }
          ].map((item) => (
            <button
              key={item.key}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-[#DB4444] hover:text-[#DB4444] transition-all duration-200 bg-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thanh lọc giá riêng biệt */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Bộ lọc giá */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lọc theo giá</h3>

            {/* Checkbox options */}
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { key: "asc", label: "Giá thấp → cao" },
                { key: "desc", label: "Giá cao → thấp" },
                { key: "discount", label: "Giảm giá nhiều" }
              ].map((option) => (
                <label key={option.key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localSortOptions[option.key as keyof SortOptions]}
                    onChange={() => handleToggleOption(option.key as keyof SortOptions)}
                    className="w-4 h-4 text-[#DB4444] bg-white border-2 border-gray-300 rounded focus:ring-[#DB4444] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#DB4444] transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Thanh trượt giá */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Khoảng giá</span>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#DB4444]">
                  <span>{localPriceRange[0].toLocaleString()}₫</span>
                  <span className="text-gray-400">-</span>
                  <span>{localPriceRange[1].toLocaleString()}₫</span>
                </div>
              </div>

              {/* Dual range slider */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={localPriceRange[0]}
                  onChange={(e) =>
                    handlePriceRangeChange([parseInt(e.target.value), localPriceRange[1]])
                  }
                  className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={localPriceRange[1]}
                  onChange={(e) =>
                    handlePriceRangeChange([localPriceRange[0], parseInt(e.target.value)])
                  }
                  className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Giá trị cụ thể */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Từ</label>
                  <input
                    type="number"
                    value={localPriceRange[0]}
                    onChange={(e) => handlePriceRangeChange([parseInt(e.target.value) || 0, localPriceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#DB4444] focus:ring-1 focus:ring-[#DB4444]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Đến</label>
                  <input
                    type="number"
                    value={localPriceRange[1]}
                    onChange={(e) => handlePriceRangeChange([localPriceRange[0], parseInt(e.target.value) || 50000000])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#DB4444] focus:ring-1 focus:ring-[#DB4444]"
                    placeholder="50,000,000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nút áp dụng */}
          <div className="flex flex-col gap-3">
            <button
              className="px-8 py-3 bg-[#DB4444] text-white font-semibold rounded-lg hover:bg-[#c23e3e] focus:outline-none focus:ring-2 focus:ring-[#DB4444] focus:ring-offset-2 transition-all duration-200 shadow-md"
              onClick={() => {
                console.log("Áp dụng bộ lọc:", localSortOptions, localPriceRange);
              }}
            >
              Áp dụng lọc
            </button>
            <button
              className="px-8 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              onClick={() => {
                setLocalSortOptions({ asc: false, desc: false, discount: false });
                setLocalPriceRange([0, 50000000]);
                console.log("Đặt lại bộ lọc");
              }}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #DB4444;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #DB4444;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider-thumb::-webkit-slider-track {
          height: 8px;
          background: linear-gradient(to right, #DB4444 0%, #DB4444 100%);
          border-radius: 4px;
        }
        
        .slider-thumb::-moz-range-track {
          height: 8px;
          background: linear-gradient(to right, #DB4444 0%, #DB4444 100%);
          border-radius: 4px;
          border: none;
        }
      `}</style>
    </div>
  );
}