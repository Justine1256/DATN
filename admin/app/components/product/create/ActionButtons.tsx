"use client";

import React from "react";

export default function ActionButtons() {
  return (
    <div className="flex justify-end gap-4 mt-6">
      {/* Nút Reset */}
      <button
        className="px-4 py-2 rounded border border-[#db4444] text-[#db4444] font-medium hover:bg-[#ffeaea] transition-colors duration-200"
      >
        Hủy
      </button>

      {/* Nút Save */}
      <button
        className="px-4 py-2 rounded bg-[#db4444] text-white font-medium hover:bg-[#c23333] transition-colors duration-200"
      >
        Lưu
      </button>
    </div>
  );
}
