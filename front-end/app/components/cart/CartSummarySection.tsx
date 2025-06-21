'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { CartItem } from './hooks/CartItem';

const discounts = [
  { id: 1, code: 'SALE30', label: 'Giảm đến 30% – Đơn hàng tối thiểu 420K', time: '28 Tháng 6 – 02 Tháng 8', left: 0 },
  { id: 2, code: 'SALE20', label: 'Giảm đến 20% – Đơn hàng tối thiểu 159K', time: '22 Tháng 3 – 26 Tháng 4', left: 56 },
  { id: 3, code: 'SALE50', label: 'Giảm đến 50% – Đơn hàng tối thiểu 500K', time: '14 Tháng 10 – 18 Tháng 11', left: 435 },
  { id: 4, code: 'SALE10', label: 'Giảm đến 10% – Đơn hàng tối thiểu 100K', time: '01 Tháng 7 – 31 Tháng 7', left: 12 },
];


interface Props {
  cartItems: CartItem[];
}

export default function CartSummarySection({ cartItems }: Props) {
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
  const [showShadow, setShowShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
      setShowShadow(!atBottom);
    };

    el.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 🚀 Dùng useMemo: tự tính khi cartItems thay đổi
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity * Number(item.product?.price || 0), 0);
  }, [cartItems]);

  const promotionDiscount = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const { price, sale_price } = item.product;
      if (sale_price && sale_price < price) {
        return acc + (price - sale_price) * item.quantity;
      }
      return acc;
    }, 0);
  }, [cartItems]);

  const discountedSubtotal = subtotal - promotionDiscount;
  const shipping = cartItems.length > 0 ? 20000 : 0;
  const voucherDiscount = 0; // có thể set theo selectedDiscountId sau
  const total = discountedSubtotal + shipping - voucherDiscount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black min-h-[250px]">
      {/* Voucher Section */}
      <div className="flex flex-col h-full">
        <div className="flex-1 border rounded-md p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-md whitespace-nowrap">Mã giảm giá</h2>
            <input type="text" placeholder="Mã giảm giá" className="flex-1 border rounded-md px-4 py-2 text-sm" disabled />
          </div>

          <div ref={scrollRef} className="space-y-2 overflow-y-auto pr-2 max-h-[300px]">
            {discounts.map((d) => {
              const borderColor = d.left === 0
                ? 'border-blue-300'
                : selectedDiscountId === d.id
                ? 'border-brand'
                : 'border-gray-200';
              const textColor = d.left === 0
                ? 'text-blue-400'
                : d.left > 100
                ? 'text-brand'
                : 'text-gray-400';

              return (
                <label
                  key={d.id}
                  className={`flex items-start justify-between border ${borderColor} rounded-md px-4 py-2 shadow-sm bg-white`}
                >
                  <div className="space-y-1">
                    <p className={`text-xs ${textColor}`}>Vận chuyển</p>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-gray-400">{d.time} &nbsp; Còn lại: {d.left}</p>
                  </div>
                  <input
                    type="radio"
                    name="discount"
                    checked={selectedDiscountId === d.id}
                    onChange={() => setSelectedDiscountId(d.id)}
                    className="accent-brand mt-1"
                  />
                </label>
              );
            })}
          </div>

          {showShadow && (
            <div className="absolute bottom-4 left-0 w-full h-6 pointer-events-none bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
      </div>

      {/* Cart Summary Section */}
      <div className="border rounded-md p-5 h-full flex flex-col justify-between text-sm">
        <div>
          <h2 className="text-lg font-semibold mb-2">Tóm tắt đơn hàng</h2>
          <div className="border-t border-gray-300 pt-4 space-y-1">
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <span>Tạm tính (giá gốc):</span>
              <span>{subtotal.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Khuyến mãi (giảm giá sản phẩm):</span>
              <span className="text-green-700">-{promotionDiscount.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Giảm giá từ voucher:</span>
              <span className="text-green-700">-{voucherDiscount.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Phí vận chuyển:</span>
              <span>{shipping.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between font-semibold text-lg text-brand pt-3">
              <span>Tổng thanh toán:</span>
              <span>{total.toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/checkout">
            <button className="w-[170px] h-[56px] bg-brand hover:bg-red-600 text-white font-semibold py-3 rounded">
              Đặt hàng
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}