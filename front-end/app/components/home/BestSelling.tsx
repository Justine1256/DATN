"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";
import { Product } from "../product/ProductCard"; 
import { API_BASE_URL } from '@/utils/api';
// Nếu không có sẵn, có thể khai báo lại ở đây như bạn đã làm

export default function BestSelling() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ Tránh lỗi hydration mismatch trên client
  const router = useRouter();
  // 🔁 Fetch dữ liệu khi component mount
  useEffect(() => {
    setMounted(true);

    fetch(`${API_BASE_URL}/bestsellingproducts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error("Dữ liệu trả về không hợp lệ:", data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi fetch sản phẩm bán chạy:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 🛑 Không render khi chưa mounted (tránh lỗi hydration mismatch)
  if (!mounted) return null;

  return (
    <section className="bg-white pt-10 sm:py-10">
      <div className="max-w-[1170px] mx-auto sm:px-4">
        {/* 🔻 Header */}
        <div className="mb-6">
          {/* Gạch ngang trên cùng */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Tiêu đề và nút */}
          <div className="flex items-end justify-between sm:gap-10 mb-6">
            {/* Bên trái: tiêu đề + label */}
            <div className="flex flex-col justify-center sm:!mr-6 w-100">
              <div className="flex items-center gap-2">
                <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
                <p className="text-brand font-semibold text-sm">Trong Tháng </p>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-1 sm:mt-2">
                Sản phẩm bán chạy nhất
              </h2>
            </div>

            {/* Bên phải: nút xem tất cả */}
            <button
              onClick={() => router.push('/category')}
              className="text-brand border border-brand hover:bg-brand hover:text-white font-medium text-sm py-1 px-2 sm:py-2.5 sm:px-4 rounded-md transition duration-300 w-fit mt-4"
            >
              Xem tất cả
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
