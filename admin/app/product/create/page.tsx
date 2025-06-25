"use client";

import { useState } from "react";
import PreviewCard from "@/app/components/product/create/PreviewCard";
import ImageDrop from "@/app/components/product/create/ImageDrop";
import ProductInfoForm from "@/app/components/product/create/Form";
import Options from "@/app/components/product/create/Option";
import ActionButtons from "@/app/components/product/create/ActionButtons";
import Category from "@/types/category";
import { API_BASE_URL } from "@/utils/api";
import { useAuth } from "@/app/AuthContext";
import Cookies from "js-cookie";

export default function AddProductPage() {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [category, setCategory] = useState("fashion");
  const [option1Values, setOption1Values] = useState<string[]>([]);
  const [option2Values, setOption2Values] = useState<string[]>([]);
  const [option1Label, setOption1Label] = useState("Option 1");
  const [option2Label, setOption2Label] = useState("Option 2");
  const { user } = useAuth();

  const toggleOption1 = (val: string) => {
    setOption1Values((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleOption2 = (val: string) => {
    setOption2Values((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const isFashion = category === "fashion";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: any = {
      name: formData.get("name"),
      category_id: parseInt(formData.get("category_id") as string, 10),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      sale_price: parseFloat(formData.get("sale_price") as string),
      stock: parseInt(formData.get("stock") as string, 10),
      option1: formData.get("option1") || null,
      value1: formData.get("value1") || null,
      option2: formData.get("option2") || null,
      value2: formData.get("value2") || null,
      image: images.map((img) => img.url),
    };
console.log("Payload gửi:", payload);

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/shop/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
  const text = await res.text();
  console.error("❌ Lỗi server trả về:", text);
  alert("Lỗi: " + text);
  return;
}


      const result = await res.json();
      alert("Thêm sản phẩm thành công!");
      console.log("Kết quả:", result);
    } catch (error) {
      console.error(error);
      alert("Gửi sản phẩm thất bại.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Add New Product</h1>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <PreviewCard
          image={images[0]?.url || ""}
          name=""
          category={category}
          price={0}
          discount={0}
          sizes={option1Values}
          colors={option2Values}
          isFashion={isFashion}
        />

        <div className="xl:col-span-2 space-y-6">
          <ImageDrop images={images} setImages={setImages} />
          <ProductInfoForm images={images} />

          <ActionButtons />
        </div>
      </div>
    </form>
  );
}
