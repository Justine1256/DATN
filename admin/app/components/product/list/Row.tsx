"use client";

import Image from "next/image";
import { useState } from "react";
import { FiEye, FiEdit, FiEyeOff } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { STATIC_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import axios from "axios";

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
  categoriesMap: Map<number, Category>;
};

const ProductRow = ({ product, onDelete }: ProductRowProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const router = useRouter();

  const imageSrc = product.image?.[0]
    ? `${STATIC_BASE_URL}/${product.image[0]}`
    : `${STATIC_BASE_URL}/default-image.jpg`;

  // Chỉ lấy tên danh mục con
  const subcategoryName =
    typeof product.category === "object" && product.category?.name
      ? product.category.name
      : "Không rõ";

  return (
    <tr className="h-[100px] border-b border-gray-100 hover:bg-gray-50 text-gray-700 animate-fade-fast">
      <td className="py-2 px-3 flex items-center gap-3 max-h-[80px] overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          width={40}
          height={40}
          className="rounded object-cover shrink-0"
          loading="eager"
          priority
        />
        <div className="truncate">
          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5 line-clamp-2">
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

      <td className="py-2 px-3 text-gray-700 max-w-[100px] truncate">
        {product.price.toLocaleString()}
      </td>
      <td className="py-2 px-3 text-gray-700 max-w-[80px] truncate">{product.stock}</td>
      <td className="py-2 px-3 text-gray-700 max-w-[120px] truncate">{subcategoryName}</td>

      <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
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
  onClick={async () => {
    try {
      const newStatus = product.status === "activated" ? "deleted" : "activated";
      await axios.patch(`/api/shop/products/${product.id}/status`, {
        status: newStatus,
      });
      alert("Cập nhật trạng thái thành công!");

      // Optional: reload trang hoặc gọi hàm refetch từ parent
      router.refresh(); // nếu dùng Next.js 13+ App Router
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật trạng thái sản phẩm.");
    }
  }}
  className={`p-2 rounded transition-colors ${
    product.status === "activated"
      ? "bg-red-100 hover:bg-red-200 text-red-600"
      : "bg-green-100 hover:bg-green-200 text-green-600"
  }`}
  title={
    product.status === "activated" ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"
  }
>
  {product.status === "activated" ? <FiEyeOff /> : <FiEye />}
</button>

        </div>
      </td>
      <td>{product.status === 'deleted' ? 'Đã ẩn' : 'Đang bán'}</td>

    </tr>
  );
};

export default ProductRow;
