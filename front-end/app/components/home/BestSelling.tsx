'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';
import { Product } from '../product/ProductCard'; // ✅ Dùng lại interface nếu có
// Nếu không có sẵn, có thể khai báo lại ở đây như bạn đã làm

export default function BestSelling() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ Tránh lỗi hydration mismatch trên client

  // 🔁 Fetch dữ liệu khi component mount
  useEffect(() => {
    setMounted(true);

    fetch('http://127.0.0.1:8000/api/bestsellingproducts/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error('Dữ liệu trả về không hợp lệ:', data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm bán chạy:', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 🛑 Không render khi chưa mounted (tránh lỗi hydration mismatch)
  if (!mounted) return null;

  return (
    <section className="bg-white pt-10 pb-6">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* 🔻 Header */}
        <div className="mb-6">
          {/* Gạch ngang trên cùng */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Tiêu đề và nút */}
          <div className="flex items-start justify-between gap-10">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
                <p className="text-red-500 font-semibold text-sm translate-y-[1px]">This month</p>
              </div>
              <h2 className="text-3xl font-bold text-black mt-4">Best Selling Products</h2>
            </div>

            {/* Nút xem tất cả */}
            <button className="bg-[#DB4444] hover:bg-[#e57373] text-white font-medium py-2 px-10 rounded transition-colors duration-300 translate-y-[40px]">
              View All
            </button>
          </div>
        </div>

        {/* 🔄 Hiển thị sản phẩm hoặc loading */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array(8)
                .fill(0)
                .map((_, i) => <ProductCard key={i} />) // ✅ Không truyền prop => hiển thị khung loading
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
