"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import ProductPreviewCard from "@/app/components/ProductPreviewCard";
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
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    data?.category === "phone"
      ? data?.storage
        ? [data.storage]
        : []
      : data?.size || []
  );
  
  
  const [selectedColors, setSelectedColors] = useState<string[]>(data?.color || []);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const isFashion = category === "fashion";
  const isPhone = category === "phone";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Product Edit (ID: {id})
      </h1>
           {/* card */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
      <ProductPreviewCard
  image={data?.image || "/placeholder.png"}
  name={data?.name || ""}
  category={category}
  price={data?.price || 0}
  discount={data?.discount || 0}
  sizes={selectedSizes}
  colors={selectedColors}
  isFashion={isFashion}
/>

              {/* giao diện edit */}
        <div className="xl:col-span-2 space-y-6">
          <div className="border border-dashed border-gray-200 rounded p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer">
            <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
            <p className="text-gray-600">Drop your images here, or <span className="text-blue-600 font-medium cursor-pointer">click to browse</span></p>
            <p className="text-xs text-gray-400">1600x1200 (4:3) recommended. PNG, JPG, GIF.</p>
          </div>

          <div className="bg-white p-4 rounded shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Product Name", "Brand", "Weight", "Stock", "Tag"].map((label) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="text" className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded" defaultValue={data?.[label.toLowerCase().replace(/ /g, "")] || ""} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
                >
                  <option value="fashion">Fashion</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>

            {isFashion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full border border-gray-300 p-2 rounded text-gray-800 font-medium">
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size / Storage</label>
              <div className="flex gap-2 flex-wrap">
                {selectedSizes.map((size) => (
                  <div
                    key={size}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-1 border border-gray-300 hover:bg-red-100 cursor-pointer"
                    onClick={() => toggleSize(size)}
                  >
                    {size} <span className="text-red-500 font-bold">✕</span>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add size/storage..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !selectedSizes.includes(val)) {
                        setSelectedSizes([...selectedSizes, val]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  className="border border-gray-300 px-2 py-1 rounded w-40 font-semibold text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {selectedColors.map((color) => (
                  <div key={color} className="flex items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span
                      onClick={() => toggleColor(color)}
                      className="text-red-500 font-bold cursor-pointer hover:scale-125 transition"
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add hex color (#...)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (/^#([0-9A-F]{3}){1,2}$/i.test(val) && !selectedColors.includes(val)) {
                      setSelectedColors([...selectedColors, val]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="border border-gray-300 px-2 py-1 rounded w-52 font-semibold text-gray-800"
              />

              <div className="flex gap-2 flex-wrap mt-2">
                {["#222", "#facc15", "#60a5fa", "#f87171", "#10b981", "#e5e7eb"].map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`w-8 h-8 rounded-full border border-gray-300 transition ${
                      selectedColors.includes(color)
                        ? "ring-2 ring-blue-500"
                        : "opacity-50 hover:opacity-100 hover:ring-2 hover:ring-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded" rows={4} defaultValue={data?.description} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Price", "Discount (%)", "Tax"].map((label) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      {label === "Price" && "$"}
                      {label === "Discount (%)" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13l3 3L22 4M2 20h.01M2 2h.01M12 12h.01" /></svg>
                      )}
                      {label === "Tax" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M3 21h18M5 7h14M5 11h14M5 15h14" /></svg>
                      )}
                    </span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 p-2 pl-8 font-medium text-gray-800 rounded"
                      defaultValue={label === "Price" ? data?.price : label === "Discount (%)" ? data?.discount : 3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-gray-100">Reset</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}