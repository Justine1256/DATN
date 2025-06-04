"use client";

import { useEffect, useState } from "react";

import ProductCard from "../product/ProductCard";

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

const endTime = new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000 + 19 * 60 * 1000 + 56 * 1000;

export default function FlashSale() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/topdiscountedproducts/")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => {
        console.error("Lỗi khi fetch sản phẩm flash sale:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* Short horizontal line at the very top */}
        <div className="w-full h-[1px] bg-gray-300 mb-6" />

        {/* Header Flash Sale and Timer */}
        <div className="flex items-start justify-between !gap-10 pb-8">
          <div className="flex items-start gap-10">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
                <p className="text-red-500 font-semibold text-sm translate-y-[1px]">Today’s</p>
              </div>
              <div className="flex items-end gap-10 mt-2">
                <h2 className="text-3xl font-bold text-black">Flash Sales</h2>
                {/* Timer Display */}
                <div className="relative flex items-end gap-6 text-black">
                  {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hours", value: timeLeft.hours },
                    { label: "Minutes", value: timeLeft.minutes },
                    { label: "Seconds", value: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center w-14 relative">
                      <span className="text-xs font-semibold text-gray-600 mb-1">{item.label}</span>
                      <span className="text-2xl font-bold text-center">{String(item.value).padStart(2, "0")}</span>
                      {idx < 3 && (
                        <div className="absolute top-[40%] -right-[14px] text-red-400 font-semibold text-xl">
                          :
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* View All Button is now removed from here */}
        </div>

        {/* Products List */}
        {loading ? (
          <p className="text-center text-gray-500">Skeleton...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* View All Button (moved to the bottom) */}
        <div className="mt-10 text-center">
          <button className="bg-[#DB4444] hover:bg-[#e57373] text-white font-medium py-3 px-10 rounded transition-colors duration-300">
            View All Product
          </button>
        </div>

        {/* Short horizontal line at the very bottom */}
        <div className="w-full h-[1px] bg-gray-300 mt-10" />
      </div>
    </section>
  );
}