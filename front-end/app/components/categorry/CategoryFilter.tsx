// PriceFilter.tsx
import React from "react";

interface PriceFilterProps {
  priceRange: [number, number];
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  sortOptions: { asc: boolean; desc: boolean; discount: boolean };
  toggleOption: (key: "asc" | "desc" | "discount") => void; // Explicitly typing the key parameter
  showPriceFilter: boolean;
  setShowPriceFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  setPriceRange,
  sortOptions,
  toggleOption,
  showPriceFilter,
  setShowPriceFilter,
}) => {
  return (
    <div className="relative">
      <button
        onClick={() => setShowPriceFilter(!showPriceFilter)}
        className="border px-3 py-1 mr-2 rounded text-sm text-black hover:border-[#DB4444] transition"
      >
        Giá ▾
      </button>

      {showPriceFilter && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow z-50 p-4">
          {["asc", "desc", "discount"].map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={sortOptions[key as keyof typeof sortOptions]}
                onChange={() => toggleOption(key as "asc" | "desc" | "discount")} // Type assertion to the specific string literals
              />
              {key === "asc" && "Giá: thấp đến cao"}
              {key === "desc" && "Giá: cao đến thấp"}
              {key === "discount" && "Giảm giá nhiều nhất"}
            </label>
          ))}

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
            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
            className="w-full mb-2 accent-[#DB4444]"
          />
          <input
            type="range"
            min={0}
            max={50000000}
            step={100000}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-[#DB4444]"
          />

          {/* <button
            className="mt-4 w-full bg-[#DB4444] text-white text-sm py-2 rounded hover:opacity-90 transition"
            onClick={() => {
              setShowPriceFilter(false);
              console.log("Lọc với:", sortOptions, priceRange);
            }}
          >
            Lọc
          </button> */}
        </div>
      )}
    </div>
  );
};

export default PriceFilter;
