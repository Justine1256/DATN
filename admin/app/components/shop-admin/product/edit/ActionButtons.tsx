"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

interface Variant {
  value1: string;
  value2: string;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string[];
}

interface ActionButtonsProps {
  productId: number;
  images: { id: string; url: string }[];
  optionValues: {
    option1: string;
    value1: string;
    option2: string;
    value2: string;
  };
  formValues: {
    name: string;
    description: string;
    price: number;
    sale_price: number;
    stock: number;
  };
  categoryId: string;
  variants: Variant[]; // ✅ THÊM VÀO ĐÂY
  onPopup: (msg: string, type: "success" | "error") => void;
}

export default function ActionButtons({
  productId,
  images,
  optionValues,
  formValues,
  categoryId,
  variants,
  onPopup,
}: ActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) throw new Error("Chưa đăng nhập");

      setLoading(true);

      const payload = {
        name: formValues.name,
        description: formValues.description,
        price: formValues.price,
        sale_price: formValues.sale_price,
        stock: formValues.stock,
        category_id: parseInt(categoryId),
        image: images.map((img) => img.url),
        option1: optionValues.option1 || null,
        value1: optionValues.value1 || null,
        option2: optionValues.option2 || null,
        value2: optionValues.value2 || null,
        variants: variants.length > 0 ? variants : null, // ✅ GỬI LÊN BACKEND
      };

      const res = await fetch(`${API_BASE_URL}/shop/products/${productId}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data?.error ||
          (data?.errors && Object.values(data.errors).flat().join(", ")) ||
          "Cập nhật thất bại";
        throw new Error(errorMessage);
      }

      onPopup("Cập nhật sản phẩm thành công", "success");
      setTimeout(() => router.push("/shop-admin/product"), 2000);
    } catch (err: any) {
      onPopup(err.message || "Đã xảy ra lỗi khi cập nhật", "error");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-start">
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="bg-[#db4444] text-white px-4 py-2 rounded hover:bg-[#c0392b] disabled:opacity-50"
      >
        {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
      </button>
    </div>
  );
}
