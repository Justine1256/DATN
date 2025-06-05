"use client";

import Image from "next/image";
import { useState } from "react";

const initialProducts = [
  { id: 1, name: "LCD Monitor", price: 650, quantity: 1, image: "/images/lcd.png" },
  { id: 2, name: "H1 Gamepad", price: 550, quantity: 2, image: "/images/gamepad.png" },
];

export default function CartItemsSection() {
  const [products, setProducts] = useState(initialProducts);

  const handleQuantityChange = (id: number, value: number) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, value) } : item
      )
    );
  };

  const handleRemove = (id: number) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-4 text-black font-semibold text-sm bg-white p-4 shadow-sm">
        <div className="text-left">Product</div>
        <div className="text-center">Price</div>
        <div className="text-center">Quantity</div>
        <div className="text-right">Subtotal</div>
      </div>

      {/* Items */}
      {products.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-4 items-center bg-white p-4 shadow-sm relative"
        >
          {/* Product */}
          <div className="flex items-center gap-4 relative text-left">
            {/* Remove button */}
            <button
              onClick={() => handleRemove(item.id)}
              className="absolute -top-2 -left-2 bg-white border border-brand text-brand rounded-full w-5 h-5 text-xs flex items-center justify-center shadow-sm"
              title="Remove item"
            >
              ✕
            </button>

            {/* Image */}
            <div className="w-16 h-16 relative shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-contain" />
            </div>

            {/* Name */}
            <span className="text-sm font-medium text-black">{item.name}</span>
          </div>

          {/* Price */}
          <div className="text-center text-sm font-semibold text-black">
            ${item.price.toLocaleString()}
          </div>

          {/* Quantity */}
          <div className="text-center">
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                handleQuantityChange(item.id, parseInt(e.target.value || "1"))
              }
              className="w-20 px-3 py-2 border rounded-md text-center text-black"
            />
          </div>

          {/* Subtotal */}
          <div className="text-right text-sm font-semibold text-black">
            ${(item.price * item.quantity).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
