// components/ProductCard.tsx
type Product = {
  name: string;
  image: string | null;
  price: number;
  sale_price: number;
  id: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
  const rating = 4 + Math.random(); // giả lập rating

  return (
    <div className="w-52 border rounded-lg p-3 relative hover:shadow-md transition">
      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
        -{discount}%
      </div>

      <div className="h-32 w-full bg-white flex items-center justify-center">
        <img
          src={product.image ?? "/placeholder.png"}
          alt={product.name}
          className="max-h-full object-contain"
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold">{product.name}</h3>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-red-600 font-bold">${product.sale_price}</span>
        <span className="text-gray-500 line-through text-sm">${product.price}</span>
      </div>

      <div className="text-yellow-500 text-sm">
        {"★".repeat(Math.floor(rating))}{" "}
        <span className="text-gray-400 text-xs">(99)</span>
      </div>
    </div>
  );
}

