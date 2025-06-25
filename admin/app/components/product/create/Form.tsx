"use client";

import React, { useEffect, useState } from "react";
import { Category } from "@/types/category";
import Cookies from "js-cookie";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch("https://api.marketo.info.vn/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setShopId(data.shop?.id || null);
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!shopId) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.marketo.info.vn/api/shop/categories/${shopId}`
        );
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Lỗi khi load categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [shopId]);

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

        {/* Danh mục con */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục
          </label>
<select
  name="category_id"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="w-full border rounded px-3 py-2"
  required
>
  <option value="">Chọn danh mục</option>
  {categories
    .filter((cat) => cat.parent_id !== null) // Ẩn danh mục cha
    .map((cat) => (
      <option key={cat.id} value={cat.id.toString()}>
        {cat.name} {/* Chỉ hiển thị tên danh mục con */}
      </option>
    ))}
</select>


        </div>


        {/* Option 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên tuỳ chọn 1 (ví dụ: Bộ nhớ)
          </label>
          <input
            name="option1"
            defaultValue={data?.option1 || ""}
            type="text"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Value 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá trị tuỳ chọn 1 (ví dụ: 256GB)
          </label>
          <input
            name="value1"
            defaultValue={data?.value1 || ""}
            type="text"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Option 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên tuỳ chọn 2 (ví dụ: Màu sắc)
          </label>
          <input
            name="option2"
            defaultValue={data?.option2 || ""}
            type="text"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Value 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá trị tuỳ chọn 2 (ví dụ: Đen, Xám, Xanh...)
          </label>
          <input
            name="value2"
            defaultValue={data?.value2 || ""}
            type="text"
            className="w-full border rounded px-3 py-2"
          />
        </div>
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
