"use client";

import React from "react";

interface ActionButtonsProps {
  productId: number;
  images: { id: string; url: string }[];
  optionValues: {
    option1: string;
    value1: string;
    option2: string;
    value2: string;
  };
}

export default function ActionButtons({
  productId,
  images,
  optionValues,
}: ActionButtonsProps) {
  // Bạn có thể xử lý các props này hoặc truyền lên cha khi cần

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-gray-100"
        onClick={() => {
          // Ví dụ: reset form hoặc trạng thái
          console.log("Reset clicked", { productId, images, optionValues });
        }}
      >
        Reset
      </button>
      <button
        type="button"
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => {
          // Ví dụ: lưu thông tin, gọi API...
          console.log("Save clicked", { productId, images, optionValues });
        }}
      >
        Save
      </button>
    </div>
  );
}
