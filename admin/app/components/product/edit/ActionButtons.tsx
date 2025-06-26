"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

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
}

export default function ActionButtons({
  productId,
  images,
  optionValues,
  formValues,
  categoryId,
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
        image: images.map(img => img.url),
        option1: optionValues.option1 || null,
        value1: optionValues.value1 || null,
        option2: optionValues.option2 || null,
        value2: optionValues.value2 || null,
      };
      console.log("Images before submit", images);
      console.log("Mapped URLs", images.map(img => img.url));

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

      alert("Cập nhật thành công");
      router.push("/product");
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi cập nhật sản phẩm");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end">
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="bg-[#db4444] text-white px-5 py-2 rounded hover:bg-[#c0392b] disabled:opacity-50"
      >
        {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
      </button>
    </div>
  );
}