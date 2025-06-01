"use client";

import Link from "next/link";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

// ✅ Định nghĩa type Category
type Category = {
  name: string;
  image: string | null; // Handle image as string or null
  priceRange?: string;
  slug?: string;
  description?: string;
  status?: string;
  parent_id?: number | null;
  parent?: { name: string } | null;
  productCount?: number; // Add productCount field
};

type CategoryRowProps = {
  category: Category;
  onDelete: (name: string) => void; // Changed from `id` to `name` for deletion
};

const CategoryRow = ({ category, onDelete }: CategoryRowProps) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 text-gray-700">
      {/* Ảnh + tên */}
      <td className="py-3 px-4 min-w-[200px]">
        <div className="flex items-center gap-3">
          {/* Chỉ hiển thị icon thay vì ảnh */}
          <FiEye className="text-gray-500" size={24} /> {/* Đây là icon thư mục */}
          <div>
            <p className="font-medium text-gray-900">{category.name}</p>
          </div>
        </div>
      </td>

      {/* Mô tả */}
      <td className="py-3 px-4 min-w-[200px] text-xs text-gray-600 max-w-xs truncate">
        {category.description || "-"}
      </td>

      {/* Product Count - New Column */}
      <td className="py-3 px-4 min-w-[120px] text-center">
        {category.productCount ?? 0} {/* Display product count */}
      </td>

        
      {/* Trạng thái */}
      <td className="py-2 px-3 text-center">
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold ${
            category.status === "activated"
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
          <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
            <FiEye />
          </button>
          <Link
            href={`/Category/${category.id}/edit`} 
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
          >
            <FiEdit />
          </Link>
          <button
            onClick={() => onDelete(category.name)} // Changed from `id` to `name` for deletion
            className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
          >
            <FiTrash2 />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryRow;
