import Image from "next/image";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { Product } from "@/types/product";

type ProductRowProps = {
  product: Product;
  onDelete: (id: number) => void;
};

const ProductRow = ({ product, onDelete }: ProductRowProps) => {
  const imageSrc = product.image?.[0]
    ? `http://127.0.0.1:8000/storage/images/${product.image[0]}`
    : "/default-image.jpg";

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
        <p className="font-medium text-gray-900">{product.name}</p>
      </td>

      <td className="py-2 px-3 text-gray-700">{product.price.toLocaleString()}</td>
      <td className="py-2 px-3 text-gray-700">{product.stock}</td>
      <td className="py-2 px-3 text-gray-700">
        {typeof product.category === "string"
          ? product.category
          : product.category?.name || "Unknown"}
      </td>
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
