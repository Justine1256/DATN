"use client";

import React from "react";

export default function ActionButtons() {
  return (
    <div className="flex justify-end gap-2">
      <button className="px-4 py-2 rounded border border-gray-300 font-medium text-gray-700 hover:bg-gray-100">
        Reset
      </button>
      <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
        Save
      </button>
    </div>
  );
}