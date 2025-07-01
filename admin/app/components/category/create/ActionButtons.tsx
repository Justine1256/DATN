"use client";

import React from "react";

interface ActionButtonsProps {
  onReset?: () => void;
  loading?: boolean;
  success?: boolean;
  submitLabel?: string;
}

export default function ActionButtons({
  onReset,
  loading = false,
  success = false,
  submitLabel = "Save",
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      {/* Reset Button */}
      <button
        type="button"
        onClick={onReset}
        className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-[#db4444] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#db4444] transition-all"
      >
        Reset
      </button>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`px-4 py-2 rounded ${success ? "bg-green-600" : "bg-[#db4444]"
          } text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#db4444] transition-all`}
      >
        {loading ? "Đang lưu..." : submitLabel}
      </button>
    </div>
  );
}
