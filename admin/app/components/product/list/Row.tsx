import Image from "next/image";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { Product } from "../../../../types/product";
import Link from "next/link"; // **Đã thêm: Import Link từ 'next/link'**

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
};

const ProductRow = ({ product, onDelete }: ProductRowProps) => {
  return (
    <tr
      key={product.id}
      className="border-b border-gray-100 hover:bg-gray-50 text-gray-700"
    >
      <td className="py-2 px-3 flex items-center gap-3">
        <Image
          src={product.image?.[0] || "/default-image.jpg"}
          alt={product.name}
          width={40}
          height={40}
          className="rounded object-cover"
        />
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          {/* Kiểm tra nếu có thuộc tính để hiển thị */}
          {product.option1 || product.option2 ? (
            <>
              {/* Hiển thị option1 và value1 nếu có */}
              {product.option1 && product.value1 && (
                <p className="text-xs text-gray-500">
                  {product.option1}: {product.value1}
                </p>
              )}
              {/* Hiển thị option2 và value2 nếu có */}
              {product.option2 && product.value2 && (
                <p className="text-xs text-gray-500">
                  {product.option2}: {product.value2}
                </p>
              )}
            </>
          ) : (
            // Thông báo nếu không có thuộc tính
            <p className="text-xs text-gray-400 italic">Thuộc tính: Không có</p>
          )}
        </div>
      </td>
      {/* Hiển thị giá sản phẩm */}
      <td className="py-2 px-3 font-medium text-gray-800">${product.price}</td>
      <td className="py-2 px-3">
        {/* Hiển thị số lượng tồn kho */}
        <span className="font-semibold text-gray-800">
          {product.stock} Item
        </span>
        <br />
        {/* Hiển thị số lượng đã bán */}
        <span className="text-gray-500">{product.sold} Sold</span>
      </td>
      {/* Hiển thị danh mục sản phẩm */}
      <td className="py-2 px-3 text-gray-700">{product.category}</td>
      <td className="py-2 px-3 text-gray-700">
        <div className="flex items-center gap-1">
          <FaStar className="text-yellow-400" /> {/* Biểu tượng ngôi sao */}
          <span>{product.rating} Review</span> {/* Xếp hạng và số lượt đánh giá */}
        </div>
      </td>
      <td className="py-2 px-3">
        <div className="flex justify-center gap-2">
          {/* Nút xem chi tiết sản phẩm (chưa có Link) */}
          <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
            <FiEye />
          </button>
          {/* Nút chỉnh sửa sản phẩm sử dụng Link của Next.js để điều hướng */}
          <Link
            href={`/admin/product/${product.id}/edit`} // Đường dẫn đến trang chỉnh sửa sản phẩm
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
          >
            <FiEdit /> {/* Biểu tượng chỉnh sửa */}
          </Link>
          {/* Nút xóa sản phẩm, gọi hàm onDelete khi click */}
          <button
            onClick={() => onDelete(product.id)}
            className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
          >
            <FiTrash2 /> {/* Biểu tượng thùng rác */}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductRow;