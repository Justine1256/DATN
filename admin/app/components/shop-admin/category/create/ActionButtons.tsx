"use client";

import React from "react";

interface ActionButtonsProps {
  loading: boolean;
  success: boolean;
  submitLabel: string;
}

export default function ActionButtons({
  loading,
  success,
  submitLabel,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-4 mt-6">
      {/* Nút Reset */}
      <button
        type="reset"
        className="px-4 py-2 rounded border border-[#db4444] text-[#db4444] font-medium hover:bg-[#ffeaea] transition-colors duration-200"
      >
        Hủy
      </button>

      {/* Nút Save */}
      <button
        type="submit"
        className="px-4 py-2 rounded bg-[#db4444] text-white font-medium hover:bg-[#c23333] transition-colors duration-200"
      >
        {submitLabel}
      </button>
    </div>
  );
}
