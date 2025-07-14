"use client";

import Image from "next/image";
import { useState } from "react";
import { FiEdit, FiEye, FiEyeOff } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // ← Thêm dòng này
import axios from "axios";

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
  onStatusChange: (newStatus: string) => void;
  categoriesMap: Map<number, Category>;
};


const ProductRow = ({ product, onDelete, onStatusChange, categoriesMap }: ProductRowProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const router = useRouter();

  const imageSrc = product.image?.[0]
    ? `${STATIC_BASE_URL}/${product.image[0]}`
    : `${STATIC_BASE_URL}/default-image.jpg`;

  const subcategoryName =
    typeof product.category === "object" && product.category?.name
      ? product.category.name
      : "Không rõ";

const handleStatusChange = async () => {
  try {
    const token = Cookies.get("authToken");
    const newStatus = product.status === "activated" ? "deleted" : "activated";
    await axios.patch(
      `${API_BASE_URL}/shop/products/${product.id}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    onStatusChange(newStatus); // Cập nhật UI ngay
  } catch (err) {
    console.error(err);
    alert("Lỗi khi cập nhật trạng thái sản phẩm.");
  }
};


  return (
    <tr className="h-[100px] border-b border-gray-100 hover:bg-gray-50 text-gray-700 animate-fade-fast">
      <td className="py-2 px-3 flex items-center gap-3">
        <Image
          src={imageSrc}
          alt={product.name}
          width={40}
          height={40}
          className="rounded object-cover shrink-0"
        />
        <div className="truncate">
          <p className="font-medium text-gray-900">{product.name}</p>
          <div className="text-xs text-gray-500 mt-1">
            {product.option1 && product.value1 && (
              <div>
                <span className="font-semibold">{product.option1}:</span> {product.value1}
              </div>
            )}
            {product.option2 && product.value2 && (
              <div>
                <span className="font-semibold">{product.option2}:</span> {product.value2}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="py-2 px-3">{product.price.toLocaleString()}</td>
      <td className="py-2 px-3">{product.stock}</td>
      <td className="py-2 px-3">{subcategoryName}</td>

      <td className="py-2 px-3">
        <div className="flex items-center gap-1">
          {product.rating > 0 ? (
            <>
              <span className="text-sm font-medium w-6 text-center">
                {(product.rating / 2).toFixed(1)}
              </span>
              {[...Array(5)].map((_, i) => (
                <AiFillStar
                  key={i}
                  className={`text-base ${i < Math.round(product.rating / 2)
                    ? "text-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </>
          ) : (
            <span className="text-sm text-[#db4444]">Chưa có đánh giá</span>
          )}
        </div>
      </td>

      <td className="py-2 px-3">
        <div className="flex justify-center gap-2">
          <button
            onClick={handleStatusChange}
            className={`p-2 rounded transition-colors ${product.status === "activated"
              ? "bg-red-100 hover:bg-red-200 text-red-600"
              : "bg-green-100 hover:bg-green-200 text-green-600"
              }`}
            title={
              product.status === "activated" ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"
            }
          >
            {product.status === "activated" ? <FiEyeOff /> : <FiEye />}
          </button>
          <button
            onClick={() => router.push(`/product/${product.id}/edit`)}
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
            title="Edit"
          >
            <FiEdit />
          </button>
        </div>
      </td>
      <td>{product.status === "deleted" ? "Đã ẩn" : "Đang bán"}</td>
    </tr>
  );
};

export default ProductRow;
