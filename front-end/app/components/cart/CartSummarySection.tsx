"use client";

import { useState, useEffect, useRef } from "react";

const discounts = [
  { id: 1, label: "Up to 30% off – Min order 420K", time: "Jun 28 – Aug 02", left: 0 },
  { id: 2, label: "Up to 30% off – Min order 420K", time: "Jun 28 – Aug 02", left: 0 },
  { id: 3, label: "Up to 20% off – Min order 159 K", time: "Mar 22 – Apr 26", left: 56 },
  { id: 4, label: "Up to 50% off – Min order 500K", time: "Oct 14 – Nov 18", left: 435 },
  { id: 5, label: "Up to 50% off – Min order 500K", time: "Oct 14 – Nov 18", left: 435 },
  { id: 6, label: "Up to 50% off – Min order 500K", time: "Dec 06 – Jan 10", left: 34 },
  { id: 7, label: "Up to 10% off – Min order 100K", time: "Jul 01 – Jul 31", left: 12 }, // thêm dòng này để test scroll
];

export default function CartSummarySection() {
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [showShadow, setShowShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
      setShowShadow(!atBottom);
    };

    el.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black min-h-[520px]">
      {/* Left column */}
      <div className="flex flex-col h-full">
        <div className="flex-1 border rounded-md p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
  <h2 className="font-semibold text-md whitespace-nowrap">Discount</h2>
  <input
    type="text"
    placeholder="Discount code"
    className="flex-1 border rounded-md px-4 py-2 text-sm"
  />
</div>

          <div
            ref={scrollRef}
            className="space-y-2 overflow-y-auto pr-2 max-h-[390px]" // chiều cao đủ chứa khoảng 6 voucher
          >
            {discounts.map((d) => {
              const borderColor =
                d.left === 0
                  ? "border-blue-300"
                  : selectedDiscount === d.id
                  ? "border-brand"
                  : "border-gray-200";

              const textColor =
                d.left === 0
                  ? "text-blue-400"
                  : d.left > 100
                  ? "text-brand"
                  : "text-gray-400";

              return (
                <label
                  key={d.id}
                  className={`flex items-start justify-between border ${borderColor} rounded-md px-4 py-2 shadow-sm bg-white`}
                >
                  <div className="space-y-1">
                    <p className={`text-xs ${textColor}`}>Shipping</p>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-gray-400">
                      {d.time} &nbsp; Left: {d.left}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="discount"
                    checked={selectedDiscount === d.id}
                    onChange={() => setSelectedDiscount(d.id)}
                    className="accent-brand mt-1"
                  />
                </label>
              );
            })}
          </div>

          {/* Shadow effect if scrollable */}
          {showShadow && (
            <div className="absolute bottom-4 left-0 w-full h-6 pointer-events-none bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
      </div>

      {/* Right column: Cart Total */}
      <div className="border rounded-md p-5 h-full flex flex-col justify-between">
        <div>
          <h2 className="font-semibold text-md mb-4">Cart Total</h2>
          <div className="text-sm space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>$1750</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>$20</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">Discount:</span>
                <span className="text-brand">- $50</span>
              </div>
              <div className="pl-2 text-xs text-brand space-y-0.5">
                <p>Shipping &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -$20</p>
                <p>Marketo &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -$30</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <hr className="mb-4" />
          <div className="flex justify-between font-semibold text-brand text-lg mb-4">
            <span>Total:</span>
            <span>$1700</span>
          </div>
          <button className="w-full bg-brand hover:opacity-80 text-white font-semibold py-2 rounded">
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
