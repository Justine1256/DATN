"use client";

import React from "react";

interface Props {
  loading: boolean;
  success: boolean;
  submitLabel: string;
}

export default function ActionButtons({ loading, success, submitLabel }: Props) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="reset"
        className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-gray-100"
      >
        Reset
      </button>
      <button
        type="submit"
        disabled={loading}
        className={`px-4 py-2 rounded bg-[#db4444] text-white hover:bg-[#c63a3a] transition 
          ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Đang xử lý..." : success ? "Thành công!" : submitLabel}
      </button>
    </div>
  );
}
