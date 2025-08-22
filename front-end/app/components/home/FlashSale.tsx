'use client';

import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';
import { Product } from '../product/ProductCard';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import React from 'react';

export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [endTime, setEndTime] = useState<number | null>(null); // ⏲️ từ backend
  const router = useRouter();

  // ⏲️ Cập nhật timer mỗi giây
  useEffect(() => {
    if (!endTime) return;
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
  }, [endTime]);

  // 🔁 Fetch dữ liệu flash sale và end time từ server
  useEffect(() => {
    fetch(`${API_BASE_URL}/topdiscountedproducts`)
      .then((res) => res.json())
      .then((data) => {
        const productList = Array.isArray(data.products) ? data.products : [];
        setProducts(productList);

        if (data.end_time) {
          setEndTime(new Date(data.end_time).getTime());
        } else {
          // fallback nếu backend không trả về
          const fallback = new Date().getTime() + 3 * 24 * 60 * 60 * 1000;
          setEndTime(fallback);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm flash sale:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white pt-10 sm:py-10">
      <div className="max-w-[1170px] mx-auto sm:px-4">
        <div className="border-t border-gray-200 mb-6" />

        <div className="flex items-start justify-between gap-10 pb-8">
          <div className="flex flex-col justify-center w-full">
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
              <p className="text-brand font-semibold text-sm">Hôm Nay</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6 mt-1 sm:mt-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">Sale chớp nhoáng</h2>
              <div className="flex items-end gap-6 text-black w-full sm:w-1/4 justify-between">
                {[
                  { label: 'Ngày', value: timeLeft.days },
                  { label: 'Giờ', value: timeLeft.hours },
                  { label: 'Phút', value: timeLeft.minutes },
                  { label: 'Giây', value: timeLeft.seconds },
                ].map((item, i, arr) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center w-14 relative">
                      <span className="text-xs font-semibold text-gray-600 mb-1">{item.label}</span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
                        {String(item.value).padStart(2, '0')}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-brand font-semibold text-xl">:</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array(8)
              .fill(0)
              .map((_, i) => <ProductCard key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => router.push('/category')}
            className="bg-brand hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300"
          >
            Xem tất cả sản phẩm
          </button>



        </div>
        <div className="pt-10">
          <div className="border-t border-gray-200 mb-6" />
        </div>
      </div>
    </section>
  );
}
