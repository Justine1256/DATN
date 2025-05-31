"use client";

import Image from "next/image";
import Link from "next/link"; // ✅ Thêm import Link
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
      <td className="py-2 px-3">
        <input type="checkbox" />
      </td>
      <td className="py-2 px-3 flex items-center gap-3">
        <Image
          src={category.image || "/default-image.jpg"}
          alt={category.name}
          width={40}
          height={40}
          className="rounded object-cover"
        />
        <p className="font-medium text-gray-900">{category.name}</p>
      </td>
      <td className="py-2 px-3 text-gray-700">{category.priceRange}</td>
      <td className="py-2 px-3 text-gray-700">{category.createdBy}</td>
      <td className="py-2 px-3 text-gray-700">{category.id}</td>
      <td className="py-2 px-3 text-gray-700">{category.stock}</td>
      <td className="py-2 px-3">
        <div className="flex justify-center gap-2">
          <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
            <FiEye />
          </button>

          {/* ✅ Đã thay nút sửa bằng Link */}
          <Link
            href={`/Category/${category.id}/edit`}
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
          >
            <FiEdit />
          </Link>

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
