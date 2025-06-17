"use client";

import React, { useState } from "react";

interface Props {
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  selectedColors: string[];
  toggleColor: (color: string) => void;
  setSelectedColors: (colors: string[]) => void;
  description?: string;
  data: any;
  category: string;
}

export default function OptionsInputAndColorPicker({
  selectedSizes,
  toggleSize,
  selectedColors,
  toggleColor,
  setSelectedColors,
  description = "",
  data,
  category
}: Props) {
  const defaultColors = ["#222", "#facc15", "#60a5fa", "#f87171", "#10b981", "#e5e7eb"];
  const presetOptions: string[] =
    category === "fashion"
      ? ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
      : ["32GB", "64GB", "128GB", "256GB"];

  const [customLabel, setCustomLabel] = useState("Input / Label");
  const [editingLabel, setEditingLabel] = useState(false);
  
  const [colorLabel, setColorLabel] = useState("Colors");
  const [editingColorLabel, setEditingColorLabel] = useState(false);
  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && !selectedSizes.includes(val)) {
        toggleSize(val);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  const handleAddColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (/^#([0-9A-F]{3}){1,2}$/i.test(val) && !selectedColors.includes(val)) {
        setSelectedColors([...selectedColors, val]);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  const priceFields = [
    { label: "Price", icon: "$", key: "price" },
    {
      label: "Discount (%)",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l3 3L22 4M2 20h.01M2 2h.01M12 12h.01" />
        </svg>
      ),
      key: "discount"
    },
    {
      label: "Tax",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M3 21h18M5 7h14M5 11h14M5 15h14" />
        </svg>
      ),
      key: "tax"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Size / Storage + Color */}
      <div className="bg-white p-4 rounded shadow-sm">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
          {editingLabel ? (
  <input
    type="text"
    value={customLabel}
    onChange={(e) => setCustomLabel(e.target.value)}
    onBlur={() => setEditingLabel(false)}
    className="block text-base font-semibold text-gray-700 mb-1 ..."

    autoFocus
  />
) : (
  <label
  className="block text-base font-semibold text-gray-700 mb-1 cursor-pointer hover:text-blue-600 flex items-center gap-1"
  onClick={() => setEditingLabel(true)}
>
  {customLabel}
  <svg
    className="w-4 h-4 text-gray-400 hover:text-blue-500 transition"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z"
    />
  </svg>
</label>

)}


            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {selectedSizes.map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1"
                >
                  {size}
                  <span onClick={() => toggleSize(size)} className="text-red-500 cursor-pointer">
                    ✕
                  </span>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add ..."
                onKeyDown={handleAddSize}
                className="border border-gray-300 px-2 py-1 rounded font-medium text-gray-800"
              />
            </div>

            {/* Gợi ý size/dung lượng */}
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((val) => (
                <button
                  key={val}
                  onClick={() => toggleSize(val)}
                  className={`px-3 py-1 rounded text-sm font-semibold border transition ${
                    selectedSizes.includes(val)
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

        
         {/* Color Picker */}
        {/* Color Picker */}
<div>
  {editingColorLabel ? (
    <input
      type="text"
      value={colorLabel}
      onChange={(e) => setColorLabel(e.target.value)}
      onBlur={() => setEditingColorLabel(false)}
      className="block text-base font-semibold text-gray-700 mb-1 border border-gray-300 px-2 py-1 rounded"
      autoFocus
    />
  ) : (
    <label
      className="block text-base font-semibold text-gray-700 mb-1 cursor-pointer hover:text-blue-600 flex items-center gap-1"
      onClick={() => setEditingColorLabel(true)}
    >
      {colorLabel}
      <svg
        className="w-4 h-4 text-gray-400 hover:text-blue-500 transition"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z"
        />
      </svg>
    </label>
  )}

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
    onKeyDown={handleAddColor}
    className="border border-gray-300 px-2 py-1 rounded w-52 font-semibold text-gray-800"
  />

  <div className="flex gap-2 flex-wrap mt-2">
    {defaultColors.map((color) => (
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


        </div>
      </div>

      {/* Description */}
      <div className="bg-white p-4 rounded shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
          rows={4}
          defaultValue={description}
        />
      </div>

      {/* Price fields */}
      <div className="bg-white p-4 rounded shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priceFields.map(({ label, icon, key }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  {icon}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full border border-gray-200 p-2 pl-8 font-medium text-gray-800 rounded"
                  defaultValue={data?.[key] ?? (key === "tax" ? 3 : 0)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
