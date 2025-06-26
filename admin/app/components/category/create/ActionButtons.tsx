"use client";

import React from "react";

export default function ActionButtons() {
  return (
    <div className="flex justify-end gap-2">
      {/* Reset Button */}
      <button className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-[#db4444] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#db4444] transition-all">
        Reset
      </button>

      {/* Save Button */}
      <button className="px-4 py-2 rounded bg-[#db4444] text-white hover:bg-[#a13b3b] focus:outline-none focus:ring-2 focus:ring-[#db4444] transition-all">
        Save
      </button>
    </div>
  );
}
