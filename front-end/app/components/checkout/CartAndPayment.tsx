'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';

interface CartItem {
  id: number;
  quantity: number;
  product: {
    name: string;
    image: string;
    price: number;             // Giá gốc
    sale_price?: number | null; // Giá giảm (nếu có)
  };
}

interface Props {
  onPaymentInfoChange: (info: { paymentMethod: string; totalPrice: number }) => void;
  onCartChange: (items: CartItem[]) => void;
}

export default function CartAndPayment({ onPaymentInfoChange, onCartChange }: Props) {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tính tổng tiền theo sale_price nếu có
  const totalPrice = cartItems.reduce((sum, item) => {
    const finalPrice = item.product.sale_price ?? item.product.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  // Lấy giỏ hàng từ API
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCartItems(res.data);
        onCartChange(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Gửi payment info + totalPrice lên parent khi thay đổi
  useEffect(() => {
    onPaymentInfoChange({ paymentMethod, totalPrice });
  }, [paymentMethod, totalPrice]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 text-sm font-semibold px-4 py-3 bg-white shadow">
        <div className="col-span-2">Product</div>
        <div className="text-center">Quantity</div>
        <div className="text-right">Price</div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm">Loading...</p>
      ) : cartItems.length === 0 ? (
        <p className="text-center text-sm">Your cart is empty.</p>
      ) : (
        cartItems.map((item) => {
          const { product, quantity } = item;
          const hasSale = product.sale_price && product.sale_price < product.price;
          const displayPrice = hasSale ? product.sale_price! : product.price;

          return (
            <div key={item.id} className="grid grid-cols-4 items-center px-4 py-3 bg-white shadow">
              <div className="col-span-2 flex items-center gap-4">
                <Image
                  src={`${STATIC_BASE_URL}/${product.image}`}
                  alt={product.name}
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
              </div>
              <div className="text-center text-sm">{quantity}</div>
              <div className="text-right text-sm">
                {hasSale ? (
                  <div>
                    <p className="line-through text-gray-400 text-xs">
                      {(product.price * quantity).toLocaleString()}đ
                    </p>
                    <p className="font-semibold text-red-600">
                      {(product.sale_price! * quantity).toLocaleString()}đ
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold">
                    {(product.price * quantity).toLocaleString()}đ
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="pt-2 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
            className="w-4 h-4 accent-brand"
          />
          <span>Cash on delivery</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="vnpay"
            checked={paymentMethod === 'vnpay'}
            onChange={() => setPaymentMethod('vnpay')}
            className="w-4 h-4 accent-brand"
          />
          <Image src="/vnpay-logo.png" alt="VNPAY" width={70} height={30} />
        </label>
      </div>
    </div>
  );
}
