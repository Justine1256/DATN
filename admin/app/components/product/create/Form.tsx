"use client";

import React, { useEffect, useState } from "react";

interface ProductInfoFormProps {
  data: any;
  category: string;
  setCategory: (value: string) => void;
}

const categoryOptions = [
  { value: "fashion", label: "Thời trang", sub: ["Áo", "Quần", "Giày"] },
  { value: "phone", label: "Điện thoại", sub: ["iPhone", "Samsung", "Xiaomi"] },
];

export default function ProductInfoForm({
  data,
  category,
  setCategory,
}: ProductInfoFormProps) {
  const [subCategory, setSubCategory] = useState("");

  const currentCategory = categoryOptions.find((cat) => cat.value === category);

  // Khi thay đổi danh mục cha, reset danh mục con
  useEffect(() => {
    setSubCategory("");
  }, [category]);

  return (
    <div className="bg-white p-4 rounded shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tên sản phẩm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
          <input
            type="text"
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            defaultValue={data?.name || ""}
          />
        </div>

        {/* Giá */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc</label>
          <input
            type="number"
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            defaultValue={data?.price || ""}
          />
        </div>

        {/* Giá khuyến mãi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi (nếu có)</label>
          <input
            type="number"
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            defaultValue={data?.sale_price || ""}
          />
        </div>

        {/* Số lượng tồn kho */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
          <input
            type="number"
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            defaultValue={data?.stock || ""}
          />
        </div>

        {/* Danh mục cha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục sản phẩm</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
          >
            <option value="">-- Chọn danh mục --</option>
            {categoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Danh mục con */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục con</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            disabled={!currentCategory}
          >
            <option value="">-- Chọn danh mục con --</option>
            {currentCategory?.sub.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
        <textarea
          className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
          rows={4}
          defaultValue={data?.description || ""}
        />
      </div>
    </div>
  );
}
