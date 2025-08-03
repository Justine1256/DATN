"use client";

import React from "react";

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
    <div
      className="border border-dashed border-gray-200 rounded p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer"
      onClick={handleClick}
    >
      <input
        type="file"
        accept="image/*"
        id="cate-image-input"
        className="hidden"
        onChange={handleChange}
      />
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
        Drop your images here, or{" "}
        <span className="text-blue-600 font-medium cursor-pointer">click to browse</span>
      </p>
      <p className="text-xs text-gray-400">
        1600x1200 (4:3) recommended. PNG, JPG, GIF.
      </p>
    </div>
  );
}
