"use client";

import React, { useEffect, useState } from "react";
import { Category } from "@/types/category";
import useCategories from "@/app/hooks/useCategories";

interface ProductInfoFormProps {
  data: any;
  category: string;
  setCategory: (value: string) => void;
}

export default function ProductInfoForm({
  data,
  category,
  setCategory,
}: ProductInfoFormProps) {
  const { categories, loading, error } = useCategories();

  const [subCategory, setSubCategory] = useState("");

  useEffect(() => {
    setSubCategory("");
  }, [category]);

  const currentCategory = categories.find(
    (cat) => cat.id.toString() === category
  );

  const subCategories = categories.filter(
    (cat) => cat.parent_id === currentCategory?.id
  );

  if (loading) return <p className="text-gray-600">Đang tải danh mục...</p>;

  return (
    <div className="bg-white p-4 rounded shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tên sản phẩm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sản phẩm
          </label>
          <input
            name="name"
            defaultValue={data?.name || ""}
            required
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Tên sản phẩm"
          />
        </div>

        {/* Giá gốc */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá gốc
          </label>
          <input
            name="price"
            defaultValue={data?.price || 0}
            required
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2"
            placeholder="Giá gốc"
          />
        </div>

        {/* Giá khuyến mãi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá khuyến mãi
          </label>
          <input
            name="sale_price"
            defaultValue={data?.sale_price || 0}
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2"
            placeholder="Giá khuyến mãi"
          />
        </div>

        {/* Số lượng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng
          </label>
          <input
            name="stock"
            defaultValue={data?.stock || 0}
            required
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2"
            placeholder="Số lượng"
          />
        </div>

        {/* Danh mục cha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục
          </label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Chọn danh mục</option>
            {categories
              .filter((cat) => cat.parent_id === null)
              .map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Danh mục con */}
        {subCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục con
            </label>
            <select
              name="sub_category_id"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Chọn danh mục con</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id.toString()}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mô tả sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả sản phẩm
        </label>
        <textarea
          name="description"
          defaultValue={data?.description || ""}
          className="w-full border rounded px-3 py-2"
          rows={4}
          placeholder="Mô tả sản phẩm"
        />
      </div>
    </div>
  );
}
