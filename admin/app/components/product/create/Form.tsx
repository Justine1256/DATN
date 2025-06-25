"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { Category } from "@/types/category";

interface ProductFormProps {
  images: { id: string; url: string }[];
  onOptionsChange?: (opts: {
    option1: string;
    value1: string;
    option2: string;
    value2: string;
  }) => void;
}

export default function ProductForm({ images, onOptionsChange }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  // Option states để truyền ngược lên cha
  const [option1, setOption1] = useState("");
  const [value1, setValue1] = useState("");
  const [option2, setOption2] = useState("");
  const [value2, setValue2] = useState("");

  useEffect(() => {
    const fetchUserAndCategories = async () => {
      try {
        const token = Cookies.get("authToken");
        const userRes = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        const shopId = userData?.shop?.id;
        setShopId(shopId);

        const catRes = await fetch(`${API_BASE_URL}/shop/categories/${shopId}`);
        const catData = await catRes.json();
        const onlySubCategories = (catData.categories || []).filter(
          (cat: Category) => cat.parent_id !== null
        );
        setCategories(onlySubCategories);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCategories();
  }, []);

  // Gửi option/value mỗi khi thay đổi
  useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange({ option1, value1, option2, value2 });
    }
  }, [option1, value1, option2, value2]);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">Tên sản phẩm</label>
          <input
            name="name"
            placeholder="Tên sản phẩm"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Giá gốc</label>
          <input
            name="price"
            type="number"
            placeholder="Giá gốc"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Giá khuyến mãi</label>
          <input
            name="sale_price"
            type="number"
            placeholder="Giá khuyến mãi"
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Số lượng</label>
          <input
            name="stock"
            type="number"
            placeholder="Số lượng"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 font-medium text-gray-700">Danh mục</label>
          <select
            name="category_id"
            defaultValue=""
            required
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Tên tuỳ chọn 1</label>
          <input
  name="option1"
  placeholder="Ví dụ: Bộ nhớ"
  value={option1}
  onChange={(e) => {
    const val = e.target.value;
    setOption1(val);
    if (!val) setValue1(""); // 👉 reset value1 nếu xoá option1
  }}
  className="border rounded px-3 py-2 w-full"
/>

        </div>

        <div>
  <label className="block mb-1 font-medium text-gray-700">Giá trị tuỳ chọn 1</label>
  <input
    name="value1"
    placeholder="Ví dụ: 256GB"
    value={value1}
    onChange={(e) => setValue1(e.target.value)}
    className="border rounded px-3 py-2 w-full"
    disabled={!option1} // ✅ Disable nếu chưa nhập option1
  />
</div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Tên tuỳ chọn 2</label>
          <input
  name="option2"
  placeholder="Ví dụ: Màu sắc"
  value={option2}
  onChange={(e) => {
    const val = e.target.value;
    setOption2(val);
    if (!val) setValue2(""); // 👉 reset value2 nếu xoá option2
  }}
  className="border rounded px-3 py-2 w-full"
/>

        </div>

        <div>
  <label className="block mb-1 font-medium text-gray-700">Giá trị tuỳ chọn 2</label>
  <input
    name="value2"
    placeholder="Ví dụ: Đen, Xám..."
    value={value2}
    onChange={(e) => setValue2(e.target.value)}
    className="border rounded px-3 py-2 w-full"
    disabled={!option2} // ✅ Disable nếu chưa nhập option2
  />
</div>
      </div>

      <div>
        <label className="block mb-1 font-medium text-gray-700">Mô tả sản phẩm</label>
        <textarea
          name="description"
          placeholder="Mô tả sản phẩm"
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>
    </div>
  );
}
