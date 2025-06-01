import Image from "next/image";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
  categoriesMap: Map<number, Category>; // map id -> category object
};

const ProductRow = ({ product, onDelete, categoriesMap }: ProductRowProps) => {
  const imageSrc = product.image?.[0]
    ? `http://127.0.0.1:8000/storage/images/${product.image[0]}`
    : "/default-image.jpg";

  let parentCategoryName = "Unknown";
  let subcategoryName = "Unknown";

  if (product.category && typeof product.category === "object") {
    subcategoryName = product.category.name || "Unknown";

    if (product.category.parent_id) {
      const parent = categoriesMap.get(product.category.parent_id);
      parentCategoryName = parent ? parent.name : `Không tìm thấy parent id=${product.category.parent_id}`;
    } else {
      parentCategoryName = "No parent";
    }
  }

  return (
    <tr
      className="min-h-[60px] border-b border-gray-100 hover:bg-gray-50 text-gray-700 animate-fade-fast"
    >
      <td className="py-2 px-3 flex items-center gap-3">
        <Image
          src={imageSrc}
          alt={product.name}
          width={40}
          height={40}
          className="rounded object-cover"
          loading="eager"
          priority
        />
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
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
      <td className="py-2 px-3 text-gray-700">{product.price.toLocaleString()}</td>
      <td className="py-2 px-3 text-gray-700">{product.stock}</td>
      <td className="py-2 px-3 text-gray-700">{parentCategoryName}</td>
      <td className="py-2 px-3 text-gray-700">{subcategoryName}</td>
      <td className="py-2 px-3 text-gray-700">{product.rating}</td>
      <td className="py-2 px-3">
        <div className="flex justify-center gap-2">
          <button
            className="bg-gray-100 p-2 rounded hover:bg-gray-200"
            title="View"
          >
            <FiEye />
          </button>
          <button
            className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
            title="Edit"
          >
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
