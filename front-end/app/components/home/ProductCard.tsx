import Image from "next/image";
import { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount =
    product.sale_price !== undefined &&
    product.sale_price !== null &&
    Number(product.sale_price) < Number(product.price);

  const discount = hasDiscount
    ? Math.round(
        ((Number(product.price) - Number(product.sale_price!)) / Number(product.price)) * 100
      )
    : 0;

  const rating = 4 + Math.random();

  // Xử lý ảnh tránh lỗi 'length' on 'never'
const firstImage = (() => {
  if (Array.isArray(product.image)) {
    return product.image.length > 0 ? `/uploads/${product.image[0]}` : "/placeholder.png";
  }
  if (typeof product.image === "string") {
    return product.image.startsWith("http") ? product.image : `/uploads/${product.image}`;
  }
  return "/placeholder.png";
})();



  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="w-52 border rounded-lg p-3 relative hover:shadow-md transition">
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          -{discount}%
        </div>
      )}

      <div className="h-32 w-full bg-white flex items-center justify-center relative">
        <Image
          src={firstImage}
          alt={product.name ?? "Product image"}
          className="object-contain"
          fill
          sizes="208px"
          priority={true}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold truncate" title={product.name}>
        {product.name}
      </h3>

      <div className="flex items-center gap-2 mt-1">
        {hasDiscount ? (
          <>
            <span className="text-red-600 font-bold">${Number(product.sale_price).toFixed(2)}</span>
            <span className="text-gray-500 line-through text-sm">${Number(product.price).toFixed(2)}</span>
          </>
        ) : (
          <span className="text-gray-800 font-bold">${Number(product.price).toFixed(2)}</span>
        )}
      </div>

      <div className="text-yellow-500 text-sm flex items-center gap-0.5">
        {"★".repeat(fullStars)}
        {halfStar && <span className="relative -top-[1px]">☆</span>}
        {"☆".repeat(emptyStars)}
        <span className="text-gray-400 text-xs ml-1">(99)</span>
      </div>
    </div>
  );
}
