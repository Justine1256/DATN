'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';

// Interface mô tả kiểu dữ liệu của sản phẩm
export interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
}

export default function NewProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API để lấy danh sách sản phẩm mới khi component được mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/newproducts/')
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm mới:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* Short horizontal line at the very top */}
        <div className="w-full h-[1px] bg-gray-300 mb-6" />

        {/* Header (Red bar, "This Week", "New Products") */}
        <div className="flex flex-col items-start gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
            <p className="text-red-500 font-semibold text-sm translate-y-[1px]">
              This Week
            </p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4">New Products</h2>
          {/* The short horizontal line below "New Products" has been removed */}
        </div>

        {/* Product List */}
        {loading ? (
          <p className="text-center text-gray-500 mt-6">
            Skeleton...
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* View All Button (moved below product list) */}
        <div className="mt-10 text-center">
          <button className="bg-[#DB4444] hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300">
            View All Product
          </button>
        </div>
      </div>
    </section>
  );
}