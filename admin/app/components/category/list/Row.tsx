"use client";

import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff, FiEdit, FiTrash2 } from "react-icons/fi";

// ✅ Kiểu dữ liệu Category đầy đủ
type Category = {
  id: string;
  name: string;
  image: string | null;
  priceRange?: string;
  slug?: string;
  description?: string;
  status?: string;
  parent_id?: string | null;
  parent?: { name: string } | null;
  productCount?: string;
};

type CategoryRowProps = {
  category: Category;
  onDelete: (id: string) => void;
};

const CategoryRow = ({ category, onDelete }: CategoryRowProps) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 text-gray-700">
      {/* Tên & icon */}
      <td className="py-3 px-4 min-w-[200px]">
        <div className="flex items-center gap-3">
          <FiEye className="text-gray-500" size={24} />
          <div>
            <p className="font-medium text-gray-900">{category.name}</p>
          </div>
        </div>
      </td>

      {/* Mô tả */}
      <td className="py-3 px-4 min-w-[200px] text-xs text-gray-600 max-w-xs truncate">
        {category.description || "-"}
      </td>

      {/* Số lượng sp */}
      <td className="py-3 px-4 min-w-[120px] text-center">
        {category.productCount ?? 0}
      </td>

      {/* Trạng thái */}
      <td className="py-2 px-3 text-center">
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold ${category.status === "activated"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {category.status === "activated" ? "Hoạt động" : "Tắt"}
        </span>
      </td>

      {/* Hành động */}
      <td className="py-1 px-4 min-w-[120px]">
        <div className="flex justify-start gap-2">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className={`p-2 rounded transition-colors ${showDetail
                ? "bg-green-50 hover:bg-green-100"
                : "bg-gray-100 hover:bg-gray-200"
              }`}
            title={showDetail ? "Đang mở chi tiết" : "Ẩn chi tiết"}
          >
            {showDetail ? (
              <FiEye className="w-5 h-5 text-green-600" />
            ) : (
              <FiEyeOff className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <Link
            href={`/category/${category.id}/edit`}
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
            title="Chỉnh sửa"
          >
            <FiEdit />
          </Link>

          <button
            onClick={() => onDelete(String(category.id))}
            className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
            title="Xoá"
          >
            <FiTrash2 />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryRow;
