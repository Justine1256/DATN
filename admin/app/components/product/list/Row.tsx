import Image from "next/image";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai"; // ✅ Thêm icon sao
import { Product } from "@/types/product";
import { Category } from "@/types/category";

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
  categoriesMap: Map<number, Category>;
};

const ProductRow = ({ product, onDelete, categoriesMap }: ProductRowProps) => {
  const imageSrc = product.image?.[0]
    ? `http://127.0.0.1:8000/storage/images/${product.image[0]}`
    : "/default-image.jpg";

  let parentCategoryName = "Không rõ";
  let subcategoryName = "Không rõ";

  if (product.category && typeof product.category === "object") {
    subcategoryName = product.category.name || "Không rõ";
    if (product.category.parent_id) {
      const parent = categoriesMap.get(product.category.parent_id);
      parentCategoryName = parent?.name || `Không tìm thấy (#${product.category.parent_id})`;
    } else {
      parentCategoryName = "Không có cha";
    }
  }

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
            <span className="font-semibold">{product.option1}:</span>{" "}
            {product.value1}
          </div>
        )}
        {product.option2 && product.value2 && (
          <div>
            <span className="font-semibold">{product.option2}:</span>{" "}
            {product.value2}
          </div>
        )}
      </div>
    </div>
  </td>

  <td className="py-2 px-3 text-gray-700 max-w-[100px] truncate">{product.price.toLocaleString()}</td>
  <td className="py-2 px-3 text-gray-700 max-w-[80px] truncate">{product.stock}</td>
  <td className="py-2 px-3 text-gray-700 max-w-[120px] truncate">{parentCategoryName}</td>
  <td className="py-2 px-3 text-gray-700 max-w-[120px] truncate">{subcategoryName}</td>

  <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium w-6 text-center">
        {(product.rating / 2).toFixed(1)}
      </span>
      {[...Array(5)].map((_, i) => (
        <AiFillStar
          key={i}
          className={`text-base ${
            i < Math.round(product.rating / 2)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  </td>

  <td className="py-2 px-3">
    <div className="flex justify-center gap-2">
      <button className="bg-gray-100 p-2 rounded hover:bg-gray-200" title="View">
        <FiEye />
      </button>
      <button className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200" title="Edit">
        <FiEdit />
      </button>
      <button
        onClick={() => onDelete(product.id)}
        className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
        title="Delete"
      >
        <FiTrash2 />
      </button>
    </div>
  </td>
</tr>

  );
};

export default ProductRow;
