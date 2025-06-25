"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { Category } from "@/types/category";

interface ProductFormProps {
  images: { id: string; url: string }[];
}



export default function ProductForm({ images }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

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



  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Tên sản phẩm"
            required
            className="border rounded px-3 py-2"
          />

        <input
          name="price"
          type="number"
          placeholder="Giá gốc"
          required
          className="border rounded px-3 py-2"
        />

        <input
          name="sale_price"
          type="number"
          placeholder="Giá khuyến mãi"
          className="border rounded px-3 py-2"
        />

        <input
          name="stock"
          type="number"
          placeholder="Số lượng"
          required
          className="border rounded px-3 py-2"
        />

        <select
  name="category_id"
  defaultValue=""
  required
  className="border rounded px-3 py-2"
>
  <option value="">Chọn danh mục con</option>
  {categories.map((cat) => (
    <option key={cat.id} value={cat.id.toString()}>
      {cat.name}
    </option>
  ))}
</select>


        <input
          name="option1"
          placeholder="Tên tuỳ chọn 1 (ví dụ: Bộ nhớ)"
          className="border rounded px-3 py-2"
        />
        <input
          name="value1"
          placeholder="Giá trị tuỳ chọn 1 (ví dụ: 256GB)"
          className="border rounded px-3 py-2"
        />

        <input
          name="option2"
          placeholder="Tên tuỳ chọn 2 (ví dụ: Màu sắc)"
          className="border rounded px-3 py-2"
        />
        <input
          name="value2"
          placeholder="Giá trị tuỳ chọn 2 (ví dụ: Đen, Xám...)"
          className="border rounded px-3 py-2"
        />
      </div>

      <textarea
        name="description"
        placeholder="Mô tả sản phẩm"
        rows={4}
        className="w-full border rounded px-3 py-2"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Thêm sản phẩm
      </button>
    </div>
  );
}
