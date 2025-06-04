'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';

export interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number;
}

export default function BestSelling() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ✅ Đã thêm để tránh lỗi hydration mismatch

    fetch('http://127.0.0.1:8000/api/bestsellingproducts/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error('Dữ liệu trả về không phải mảng:', data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm bán chạy:', err);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!mounted) return null;

  return (
<section className="bg-white pt-10 pb-6">
  <div className="max-w-[1170px] mx-auto px-4">
    {/* Header row có border dưới */}
    <div className="mb-6">
  {/* Đường kẻ trên tiêu đề */}
  <div className="border-t border-gray-200 mb-6" />

  <div className="flex items-start justify-between gap-10">
    {/* Bên trái: gạch đỏ + text */}
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
        <p className="text-red-500 font-semibold text-sm translate-y-[1px]">This month</p>
      </div>
      <h2 className="text-3xl font-bold text-black mt-4">Best Selling Products</h2>
    </div>

    {/* Bên phải: nút View All */}
    <button className="bg-[#DB4444] hover:bg-[#e57373] text-white font-medium py-2 px-10 rounded transition-colors duration-300 translate-y-[40px]">
      View All
    </button>
  </div>
</div>


    {/* Nội dung sản phẩm */}
    {loading ? (
      <p className="text-center text-gray-500 mt-6">Skeleton...</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    )}
  </div>
</section>




  );
}
