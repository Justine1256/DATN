"use client";

import React from "react";

interface ProductInfoFormProps {
  data: any;
  category: string;
  setCategory: (value: string) => void;
  isFashion: boolean;
}

export default function ProductInfoForm({
  data,
  category,
  setCategory,
  isFashion
}: ProductInfoFormProps) {
  return (
    <div className="bg-white p-4 rounded shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["Product Name", "Brand", "Weight", "Stock", "Tag"].map((label) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
              defaultValue={data?.[label.toLowerCase().replace(/ /g, "")] || ""}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Category
          </label>
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
    </div>
  );
}
