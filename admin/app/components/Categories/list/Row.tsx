"use client";

import Image from "next/image";
import Link from "next/link";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

type Category = {
  id: string;
  name: string;
  image: string;
  priceRange: string;
  createdBy: string;
  stock: number;
};

type CategoryRowProps = {
  category: Category;
  onDelete: (id: string) => void;
};

const CategoryRow = ({ category, onDelete }: CategoryRowProps) => {
  return (
    <tr
      key={category.id}
      className="border-b border-gray-100 hover:bg-gray-50 text-gray-700"
    >
      {/* ✅ Cột hình ảnh + tên danh mục, dùng flex để căn chỉnh đẹp */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Image
            src={category.image || "/default-image.jpg"}
            alt={category.name}
            width={45}
            height={45}
            className="rounded object-cover"
          />
          <p className="font-medium text-gray-900">{category.name}</p>
        </div>
      </td>

      {/* Cột khoảng giá */}
      <td className="py-3 px-4">{category.priceRange}</td>

      {/* Cột người tạo */}
      <td className="py-3 px-4">{category.createdBy}</td>

      {/* Cột ID */}
      <td className="py-3 px-4">{category.id}</td>

      {/* Cột số lượng tồn kho */}
      <td className="py-3 px-4">{category.stock}</td>

      {/* Cột hành động */}
      <td className="py-3 px-4">
        <div className="flex justify-center gap-2">
          {/* Nút xem */}
          <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
            <FiEye />
          </button>

          {/* Nút sửa */}
          <Link
            href={`/Category/${category.id}/edit`}
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
          >
            <FiEdit />
          </Link>

          {/* Nút xoá */}
          <button
            onClick={() => onDelete(category.id)}
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
