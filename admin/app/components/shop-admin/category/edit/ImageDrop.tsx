"use client";

import React from "react";
import Image from "next/image";

interface Props {
  image: string;
  setImage: (url: string) => void;
}

export default function CateImageDrop({ image, setImage }: Props) {
  const handleClick = () => {
    document.getElementById("cate-image-input")?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImage(url);
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        id="cate-image-input"
        className="hidden"
        onChange={handleChange}
      />

      <div
        onClick={handleClick}
        className="border border-dashed bg-white p-6 rounded shadow-sm border-gray-200 text-center hover:bg-[#F9FAFB] transition cursor-pointer max-w-full mx-auto"
      >
        <div className="w-full mx-auto">
          {image ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="relative w-full h-[200px]">
                  <Image
                    src={image}
                    alt="Ảnh chính"
                    fill
                    className="object-contain rounded border"
                  />
                </div>
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  Ảnh chính
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage("");
                  }}
                  className="absolute top-1 right-1 bg-white border border-gray-300 text-red-500 px-2 py-0.5 rounded text-xs hover:bg-red-100"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[150px]">
              <svg
                className="w-8 h-8 text-blue-500 mb-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-gray-600">
                Kéo thả hình ảnh vào đây, hoặc{" "}
                <span className="text-blue-600 font-medium cursor-pointer">nhấn để chọn</span>
              </p>
              <p className="text-xs text-gray-400">
                Khuyến nghị 1600x1200 (4:3). Hỗ trợ PNG, JPG, GIF.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
