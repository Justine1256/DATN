"use client";
import React from "react";

interface ProductDescriptionAndSpecsProps {
  specs: { label: string; value: string }[];
  descriptionLines: string[];
  hashtags?: string[]; // ✅ Thêm hỗ trợ hashtag
}

const ProductDescriptionAndSpecs: React.FC<ProductDescriptionAndSpecsProps> = ({
  specs,
  descriptionLines,
  hashtags = [],
}) => {
  return (
    <div className="bg-white border rounded-xl p-6 md:p-10 mt-10 flex flex-col md:flex-row gap-10">
      {/* ✅ Chi tiết bên trái */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#DC4B47] uppercase mb-4">
          Chi tiết sản phẩm
        </h2>
        <ul className="text-sm space-y-2 text-gray-800">
          {specs.map((item, idx) => (
            <li key={idx}>
              <span className="font-medium text-gray-600">{item.label}:</span>{" "}
              <span className="font-semibold text-gray-900">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ Gạch chia dọc */}
      <div className="w-px bg-gray-200 hidden md:block" />

      {/* ✅ Mô tả bên phải */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#DC4B47] uppercase mb-4">
          Mô tả sản phẩm
        </h2>
        <div className="text-sm leading-6 text-gray-800 space-y-2">
          {descriptionLines.map((line, idx) => (
            <p key={idx}>• {line}</p>
          ))}

          {/* ✅ Hashtags SEO */}
          {hashtags.length > 0 && (
            <div className="pt-4 text-sm text-gray-500 flex flex-wrap gap-2">
              {hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[#DC4B47] hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionAndSpecs;
