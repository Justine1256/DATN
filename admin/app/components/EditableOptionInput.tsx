"use client";
import { useState } from "react";

export default function EditableOptionInput({
  selectedSizes,
  setSelectedSizes,
  toggleSize,
}: {
  selectedSizes: string[];
  setSelectedSizes: (vals: string[]) => void;
  toggleSize: (val: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [label, setLabel] = useState("Input / Label");

  return (
    <div>
      {/* Ô nhãn có thể click để sửa */}
      {showInput ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => setShowInput(false)}
          autoFocus
          className="block text-sm font-medium text-gray-700 mb-1 border border-gray-300 px-2 py-1 rounded"
        />
      ) : (
        <div
          className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer hover:text-blue-500"
          onClick={() => setShowInput(true)}
        >
          {label}
        </div>
      )}

      {/* Danh sách các giá trị đã thêm */}
      <div className="flex gap-2 flex-wrap">
        {selectedSizes.map((val) => (
          <div
            key={val}
            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-1 border border-gray-300 hover:bg-red-100 cursor-pointer"
            onClick={() => toggleSize(val)}
          >
            {val}
            <span className="text-red-500 font-bold">✕</span>
          </div>
        ))}

        {/* Ô nhập thêm giá trị mới */}
        <input
          type="text"
          placeholder={`Add ...`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val && !selectedSizes.includes(val)) {
                setSelectedSizes([...selectedSizes, val]);
                (e.target as HTMLInputElement).value = "";
              }
            }
          }}
          className="border border-gray-300 px-2 py-1 rounded w-40 font-semibold text-gray-800"
        />
      </div>
    </div>
  );
}
