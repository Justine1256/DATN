"use client";

import { useState } from "react";
import PreviewCard from "@/app/components/product/create/PreviewCard";
import ImageDrop from "@/app/components/product/create/ImageDrop";
import ProductInfoForm from "@/app/components/product/create/Form";
import Options from "@/app/components/product/create/Option";
import ActionButtons from "@/app/components/product/create/ActionButtons";
import Category from "@/types/category";

export default function AddProductPage() {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [category, setCategory] = useState("fashion");
  const [option1Values, setOption1Values] = useState<string[]>([]);
  const [option2Values, setOption2Values] = useState<string[]>([]);
  const [option1Label, setOption1Label] = useState("Option 1");
  const [option2Label, setOption2Label] = useState("Option 2");
  const {  loading } = Category();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const sale_price = Number(formData.get("sale_price"));
    const stock = Number(formData.get("stock"));
    const description = formData.get("description") as string;

    const payload = {
      name,
      price,
      sale_price,
      stock,
      description,
      category,
      images: images.map((img) => img.url),
      option1Values,
      option2Values,
      option1Label,
      option2Label,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/shop/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer 11|93aV9h4PlwtJ2i4jsHtzNsLZnGIsxJTaruFcb9kLa31fc58a",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = text;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {}
        throw new Error(errorMessage);
      }

      alert("Product added successfully!");
    } catch (error) {
      alert("Error: " + (error as Error).message);
    }
  };

  if (loading) return <p>Đang tải danh mục...</p>;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Add New Product</h1>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <PreviewCard
          image={images[0]?.url || "/placeholder.png"}
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
          <ProductInfoForm
            data={{}}
            category={category}
            setCategory={setCategory}
          />
          <Options
            selectedOption1={option1Values}
            toggleOption1={toggleOption1}
            selectedOption2={option2Values}
            toggleOption2={toggleOption2}
            option1Label={option1Label}
            setOption1Label={setOption1Label}
            option2Label={option2Label}
            setOption2Label={setOption2Label}
          />
          <ActionButtons />
        </div>
      </div>
    </form>
  );
}
