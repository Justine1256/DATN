'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CartItem } from './hooks/CartItem';

interface Props {
  cartItems: CartItem[];
}

export default function CartSummarySection({ cartItems }: Props) {
  const getPriceToUse = (item: CartItem) => {
    return (
      item.variant?.sale_price ??
      item.variant?.price ??
      item.product.sale_price ??
      item.product.price ??
      0
    );
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) =>
        acc + item.quantity * (item.variant?.price || item.product?.price || 0),
      0
    );
  }, [cartItems]);

  const discountedSubtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + item.quantity * getPriceToUse(item),
      0
    );
  }, [cartItems]);

  const promotionDiscount = subtotal - discountedSubtotal;

  const itemsGroupedByShop = useMemo(() => {
    const groups: { [shopId: number]: CartItem[] } = {};
    cartItems.forEach((item) => {
      const shopId = item.product.shop?.id;
      if (!shopId) return;
      if (!groups[shopId]) groups[shopId] = [];
      groups[shopId].push(item);
    });
    return groups;
  }, [cartItems]);

  const shipping = useMemo(() => {
    const numberOfShops = Object.keys(itemsGroupedByShop).length;
    return numberOfShops * 20000; // 20k mỗi shop
  }, [itemsGroupedByShop]);

  const voucherDiscount = 0; // bỏ phần mã giảm giá
  const total = discountedSubtotal + shipping - voucherDiscount;

  return (
    <div className="w-full text-black min-h-[250px]">
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
              <span className="text-green-700">
                -{promotionDiscount.toLocaleString()}đ
              </span>
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

        <div className="mt-6">
          <Link href="/checkout" className="block">
            <button className="w-full md:w-[170px] h-[48px] md:h-[56px] bg-brand hover:bg-red-600 text-white font-semibold rounded transition">
              Đặt hàng
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
