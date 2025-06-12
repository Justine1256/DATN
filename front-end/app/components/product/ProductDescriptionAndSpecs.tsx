"use client";
import React from "react";

interface ProductDescriptionAndSpecsProps {
  specs: { label: string; value: string }[];  // Kiểu dữ liệu array
  descriptionLines: string[];
  imageUrl: string; // Thêm prop ảnh
  hashtags?: string[]; // ✅ Thêm hỗ trợ hashtag
}

const ProductDescriptionAndSpecs: React.FC<ProductDescriptionAndSpecsProps> = ({
  specs = [],  // Gán giá trị mặc định cho specs là một mảng trống
  descriptionLines,
  imageUrl,
  hashtags = [],
}) => {
  return (
    <div className="bg-white p-6 mt-10">
      {/* Gạch ngang xám trên đầu */}
      <div className="border-t border-gray-200 mb-4" />

      {/* Thêm thanh màu đỏ và chữ "CHI TIẾT SẢN PHẨM" */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
        <p className="text-red-500 font-semibold text-sm">CHI TIẾT SẢN PHẨM</p>
      </div>

      {/* Thông tin sản phẩm và ảnh */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thông tin sản phẩm bên trái */}
        <div className="flex-1">
          <ul className="text-base space-y-4 text-gray-700">
            {specs && specs.length > 0 ? (
              specs.map((item, idx) => (
                <li key={idx} className="flex">
                  <span className="font-semibold text-gray-600 mr-2">{item.label}:</span>
                  <span className="font-normal text-gray-900">{item.value}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">Thông tin sản phẩm không có sẵn.</li>
            )}
          </ul>
        </div>

        {/* Hình ảnh sản phẩm bên phải */}
        <div className="flex-shrink-0 w-full md:w-[300px] ml-auto">
          <img
            src={imageUrl}
            alt="Product image"
            className="w-full h-[300px] object-cover rounded-xl" // Tăng chiều cao ảnh và dùng object-cover để duy trì tỷ lệ
          />
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
          <p className="text-red-500 font-semibold text-sm">MÔ TẢ SẢN PHẨM</p>
        </div>
        <div className="text-base leading-6 text-gray-700 space-y-3">
          {descriptionLines.map((line, idx) => (
            <p key={idx}>• {line}</p>
          ))}

          {/* Hashtags SEO */}
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
