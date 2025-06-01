"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PreviewCard from "@/app/components/product/create/PreviewCard";
import ImageDrop from "@/app/components/product/create/ImageDrop";
import ProductInfoForm from "@/app/components/product/create/Form";
import Options from "@/app/components/product/create/Option";
import ActionButtons from "@/app/components/product/create/ActionButtons";

const mockProducts = [
  {
    id: "1",
    name: "Váy Suông Công Sở",
    category: "fashion",
    brand: "NEM",
    image: "https://techzaa.in/venton/assets/images/product/p-1.png",
    price: 300000,
    discount: 0,
    weight: "250g",
    stock: 10,
    sold: 1,
    tag: "Váy",
    size: ["M"],
    color: ["#f472b6"],
    description: "Váy suông công sở thanh lịch phù hợp môi trường làm việc."
  },
  {
    id: "2",
    name: "Điện thoại mẫu 1",
    category: "phone",
    brand: "Samsung",
    image: "/phone.png",
    price: 9931725,
    discount: 0,
    weight: "180g",
    stock: 64,
    sold: 28,
    tag: "Điện thoại",
    storage: "64GB",
    manufacturer: "Samsung",
    color: ["#60a5fa"],
    description: "Smartphone mẫu với đầy đủ chức năng, thiết kế hiện đại."
  }
];

export default function EditProductMockPage() {
  const id = useParams()?.id as string;
  const data = mockProducts.find((p) => p.id === id);

  const [category, setCategory] = useState(data?.category || "fashion");
  const [option1Values, setOption1Values] = useState<string[]>(
    data?.category === "phone"
      ? data?.storage
        ? [data.storage]
        : []
      : data?.size || []
  );
  const [option2Values, setOption2Values] = useState<string[]>(data?.color || []);

  // Thêm state quản lý label option
  const [option1Label, setOption1Label] = useState("Option 1");
  const [option2Label, setOption2Label] = useState("Option 2");

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

  return (
    <form className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Product Edit (ID: {id})
      </h1>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <PreviewCard
          image={data?.image || "/placeholder.png"}
          name={data?.name || ""}
          category={category}
          price={data?.price || 0}
          discount={data?.discount || 0}
          sizes={option1Values}
          colors={option2Values}
          isFashion={isFashion}
        />

        <div className="xl:col-span-2 space-y-6">
          <ImageDrop />
          <ProductInfoForm
            data={data}
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

