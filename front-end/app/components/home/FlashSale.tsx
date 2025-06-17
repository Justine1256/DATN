'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';
import { Product } from '../product/ProductCard'; // Interface nếu đã định nghĩa trong ProductCard
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const router = useRouter();
  // ⏱️ Set thời gian đếm ngược 3 ngày 23 giờ 19 phút 56 giây
  const endTime =
    new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000 + 19 * 60 * 1000 + 56 * 1000;

  // ⏲️ Cập nhật timer mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 🔁 Fetch dữ liệu sản phẩm Flash Sale
  useEffect(() => {
    fetch(`${API_BASE_URL}/topdiscountedproducts`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm flash sale:', err);
      })
      .finally(() => setLoading(false));
  }, []);
console.log('Flash Sale Products:', products); // Log sản phẩm để kiểm tra
  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* 🔻 Gạch xám mờ đầu section */}
        <div className="w-full h-[1px] bg-gray-300 mb-6" />

        {/* 🔥 Header Flash Sale + Timer */}
        <div className="flex items-start justify-between gap-10 pb-8">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
              <p className="text-brand font-semibold text-sm">Hôm Nay</p>
            </div>

            {/* 🕒 Title + đồng hồ */}
            <div className="flex items-end gap-6 mt-2">
              <h2 className="text-3xl font-bold text-black">Sale chớp nhoáng</h2>
              <div className="relative flex items-end gap-6 text-black">
                {[{ label: 'Ngày', value: timeLeft.days },
                  { label: 'Giờ', value: timeLeft.hours },
                  { label: 'Phút', value: timeLeft.minutes },
                  { label: 'Giây', value: timeLeft.seconds }].map((item, i) => (
                  <div key={i} className="flex flex-col items-center w-14 relative">
                    <span className="text-xs font-semibold text-gray-600 mb-1">{item.label}</span>
                    <span className="text-2xl font-bold text-center">
                      {String(item.value).padStart(2, '0')}
                    </span>
                    {i < 3 && (
                      <div className="absolute top-[40%] -right-[14px] text-brand font-semibold text-xl">:</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 🛒 Danh sách sản phẩm hoặc skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array(8).fill(0).map((_, i) => <ProductCard key={i} />) // 👈 Loading card
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {/* 🔻 Nút xem tất cả sản phẩm */}
        <div className="mt-10 text-center">
          <button 
            onClick={() => router.push('/category')} 
            className="bg-brand hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300">
            Xem tất cả sản phẩm
          </button>
        </div>

        {/* 🔻 Gạch kết thúc section */}
        <div className="w-full h-[1px] bg-gray-300 mt-10" />
      </div>
    </section>
  );
}
