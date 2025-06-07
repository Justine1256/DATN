// app/components/product/ProductList.tsx
"use client";

import ProductCard, { Product } from "./ProductCard";

const mockProducts: Product[] = [
  {
    id: 1,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 8,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 7,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 6,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 5,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 4,
    name: "HAVIT HV-G92 Gamepad",
    image: "/2.webp",
    slug: "havit-hv-g92-gamepad",
    price: 96000,
    oldPrice: 160000,
    rating: 4.5,
    discount: 40,
  },
  {
    id: 2,
    name: "Monitor MSI 27”",
    image: "/products/monitor.png",
    slug: "monitor-msi",
    price: 3200000,
    oldPrice: 5600000,
    rating: 4.8,
    discount: 43,
  },
  // Thêm nhiều sản phẩm khác...
];



export default function ProductList() {
    return (
        <div className="max-w-[1170px] mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
  
        {/* Nút View All */}
        <div className="flex justify-center mt-12">
        <button className="bg-[#DB4444] hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300">
  View All Products
</button>



        </div>
      </div>
    );
  }