'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard'; // ✅ Card sản phẩm
import { Product } from '../product/ProductCard'; // ✅ Interface sản phẩm
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
export default function NewProducts() {
  const [products, setProducts] = useState<Product[]>([]);  // ✅ Danh sách sản phẩm
  const [loading, setLoading] = useState(true);              // ✅ Trạng thái loading
const router = useRouter();
  // 🔄 Gọi API lấy sản phẩm mới
  useEffect(() => {
    fetch(`${API_BASE_URL}/newproducts`)
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
        {/* 🔻 Đường kẻ xám đầu mỗi section */}
        <div className="w-full h-[1px] bg-gray-300 mb-6" />

        {/* 🔻 Tiêu đề & mô tả */}
        <div className="flex flex-col items-start gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
            <p className="text-brand font-semibold text-sm translate-y-[1px]">
              Trong Tuần
            </p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4">Sản phẩm mới</h2>
        </div>

        {/* 🛒 Hiển thị sản phẩm hoặc loading */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {loading
            ? Array(8)
                .fill(0)
                .map((_, i) => <ProductCard key={i} />) // ✅ Gọi card chưa có product => hiển thị khung loading
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {/* 🔻 Nút xem tất cả */}
        <div className="mt-10 text-center">
          <button 
            onClick={() => router.push('/category')}
          className="bg-brand hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300">
            Xem tất cả sản phẩm
          </button>
        </div>
      </div>
    </section>
  );
}
