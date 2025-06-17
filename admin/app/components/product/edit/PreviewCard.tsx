"use client";
import Image from "next/image";

interface Props {
  image: string;
  name: string;
  category: string;
  price: number;
  discount: number;
  sizes: string[];
  colors: string[];
  isFashion: boolean;
}

export default function ProductPreviewCard({
  image,
  name,
  category,
  price,
  discount,
  sizes,
  colors,
  isFashion,
}: Props) {
  const finalPrice = price * (1 - discount / 100);

  return (
    <div className="inline-block align-top">
      <div className="bg-white border border-gray-200 p-3 rounded shadow-sm w-full max-w-sm">
        <div className="bg-gray-100 rounded p-1">
          <Image
            src={image || "/placeholder.png"}
            width={300}
            height={300}
            alt="product"
            className="object-contain mx-auto"
            unoptimized
          />
        </div>

        <div className="mt-2 text-left">
          <h2 className="text-base font-semibold text-gray-800 leading-tight">
            {name}{" "}
            <span className="text-sm text-gray-500 font-normal capitalize">
              ({category})
            </span>
          </h2>

          <div className="text-sm text-gray-700 mt-1 mb-1">
            <span className="font-medium">Price:</span>{" "}
            <span className="line-through text-gray-400">${price}</span>{" "}
            <span className="text-blue-600 font-semibold">${finalPrice}</span>
            {discount > 0 && (
              <span className="text-green-500 text-xs ml-1">({discount}% Off)</span>
            )}
          </div>

          {sizes.length > 0 && (
            <div className="mb-1">
              <p className="text-sm text-gray-700 mb-1">
                {isFashion ? "Size:" : "Storage:"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded border text-xs font-medium text-gray-700 bg-gray-50"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div>
              <p className="text-sm text-gray-700 mb-1">Colors:</p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
