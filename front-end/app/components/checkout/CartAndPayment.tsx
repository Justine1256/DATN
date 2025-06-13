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
    price: number;
    original_price?: number;
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

  // Tính tổng tiền khi cartItems thay đổi
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Lấy cart từ API
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCartItems(res.data);
        onCartChange(res.data); // ✅ Gửi cart về parent
      })
      .finally(() => setLoading(false));
  }, []);

  // Đồng bộ payment method + totalPrice lên parent mỗi khi thay đổi
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
        cartItems.map((item) => (
          <div key={item.id} className="grid grid-cols-4 items-center px-4 py-3 bg-white shadow">
            <div className="col-span-2 flex items-center gap-4">
              <Image
                src={`${STATIC_BASE_URL}/${item.product.image}`}
                alt={item.product.name}
                width={50}
                height={50}
                className="object-contain"
              />
              <div>
                <p className="text-sm font-medium">{item.product.name}</p>
                {item.product.original_price && (
                  <p className="text-xs text-gray-400 line-through">
                    {item.product.original_price.toLocaleString()}đ
                  </p>
                )}
              </div>
            </div>
            <div className="text-center text-sm">{item.quantity}</div>
            <div className="text-right font-semibold text-sm">
              {(item.product.price * item.quantity).toLocaleString()}đ
            </div>
          </div>
        ))
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
