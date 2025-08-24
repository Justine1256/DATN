'use client';

import { useEffect, useState } from 'react';
import ProductCard, { Product } from '../product/ProductCard';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import React from 'react';

type FlashSaleResp = {
  ends_at?: string | null; // e.g. "2025-08-25T00:00:00+07:00"
  items: Array<{
    id: number;
    name: string;
    slug: string;
    image: string[];               // như mẫu bạn gửi
    price: number;
    sale_price?: number | null;
    discount_percent?: number;
    sale_starts_at?: string | null;
    sale_ends_at?: string | null;
    sold?: number;
    rating?: number;               // BE trả 'rating'
    // có thể còn các field khác...
  }>;
};

export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [endTime, setEndTime] = useState<number | null>(null);
  const router = useRouter();

  // ⏲️ Cập nhật timer mỗi giây
  useEffect(() => {
    if (!endTime) return;
    const timer = setInterval(() => {
      const now = Date.now();
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

  // 🔁 Fetch dữ liệu flash sale (đọc đúng keys: items, ends_at)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/flash-sale`, { cache: 'no-store' });
        const data: FlashSaleResp = await res.json();

        // set end time (nếu không có -> fallback 3 ngày)
        if (data?.ends_at) {
          setEndTime(new Date(data.ends_at).getTime());
        } else {
          setEndTime(Date.now() + 3 * 24 * 60 * 60 * 1000);
        }

        // map items -> Product (ProductCard dùng rating_avg, image: string[])
        const list: Product[] = (Array.isArray(data?.items) ? data.items : []).map((it) => ({
          id: it.id,
          name: it.name,
          slug: it.slug,
          image: Array.isArray(it.image) ? it.image : [String(it.image ?? '')],
          price: it.price,
          sale_price: it.sale_price ?? undefined,
          // chuyển rating BE -> rating_avg cho ProductCard
          rating_avg: typeof it.rating === 'number' ? it.rating : undefined,
          // thêm các trường optional để ProductCard không lỗi
          rating: Number(it.rating ?? 0),
          discount: it.discount_percent,
          sold: it.sold,
          // nếu BE trả sale window theo item, truyền xuống luôn
          sale_starts_at: it.sale_starts_at ?? undefined,
          sale_ends_at: it.sale_ends_at ?? undefined,
          // các field shop_* để tránh undefined
          shop_slug: '', // nếu có slug shop ở BE thì gán vào đây
          variants: [],  // nếu có variant thì map thêm
        }));

        setProducts(list);
      } catch (e) {
        console.error('Lỗi khi fetch sản phẩm flash sale:', e);
        setEndTime(Date.now() + 24 * 60 * 60 * 1000); // fallback 24h
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    run();
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
                  <React.Fragment key={item.label}>
                    <div className="flex flex-col items-center w-14">
                      <span className="text-xs font-semibold text-gray-600 mb-1">{item.label}</span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums">
                        {String(item.value).padStart(2, '0')}
                      </span>
                    </div>
                    {i < arr.length - 1 && <div className="text-brand font-semibold text-xl">:</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCard key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
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
