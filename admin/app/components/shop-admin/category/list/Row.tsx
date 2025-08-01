"use client";

import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff, FiEdit } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

// ✅ Kiểu dữ liệu Category
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
  productCount: number;
};

const CategoryRow = ({ category, productCount }: CategoryRowProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const [status, setStatus] = useState(category.status); // local state cho trạng thái

  const handleToggleStatus = async () => {
    try {
      const token = Cookies.get("authToken");
      const newStatus = status === "activated" ? "deleted" : "activated";
      await axios.patch(
        `${API_BASE_URL}/shop/categories/${category.id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Cập nhật trạng thái UI ngay lập tức
      setStatus(newStatus);
      setShowDetail(false);
    } catch (error) {
      alert("Không thể cập nhật trạng thái danh mục.");
    }
  };

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
        {category.description
          ? category.description.replace(/<\/?[^>]+(>|$)/g, "")
          : "-"}
      </td>


      {/* Số lượng sp */}
      <td className="py-3 px-4 min-w-[120px] text-center">{productCount}</td>

      {/* Trạng thái */}
      <td className="py-2 px-3 text-center">
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold ${
            status === "activated"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status === "activated" ? "Hoạt động" : "Đã ẩn"}
        </span>
      </td>

      {/* Hành động */}
      <td className="py-1 px-4 min-w-[120px]">
        <div className="flex justify-start gap-2">
          <button
            onClick={handleToggleStatus}
            className={`p-2 rounded transition-colors ${
              status === "activated"
                ? "bg-red-100 hover:bg-red-200 text-red-600"
                : "bg-green-100 hover:bg-green-200 text-green-600"
            }`}
            title={status === "activated" ? "Ẩn danh mục" : "Hiện danh mục"}
          >
            {status === "activated" ? <FiEyeOff /> : <FiEye />}
          </button>

          <Link
            href={`/shop-admin/category/${category.id}/edit`}
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
            title="Chỉnh sửa"
          >
            <FiEdit />
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default CategoryRow;
