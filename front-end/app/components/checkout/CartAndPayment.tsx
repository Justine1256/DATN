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
    image: string[]; // ✅ CHỈNH image thành mảng
    price: number;
    sale_price?: number | null;
  };
}

interface Props {
  onPaymentInfoChange: (info: { paymentMethod: string; totalPrice: number }) => void;
  onCartChange: (items: CartItem[]) => void;
}

export default function CartAndPayment({ onPaymentInfoChange, onCartChange }: Props) {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Cart items state
  const [loading, setLoading] = useState(true); // Loading state

  const totalPrice = cartItems.reduce((sum, item) => {
    const finalPrice = item.product.sale_price ?? item.product.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (typeof img !== 'string' || !img.trim()) {
      return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith('http')) return img;
    return img.startsWith('/')
      ? `${STATIC_BASE_URL}${img}`
      : `${STATIC_BASE_URL}/${img}`;
  };

  // Fetching cart items from localStorage or API
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      const guestCart = localStorage.getItem('cart');
      if (guestCart) {
        const parsed = JSON.parse(guestCart);
        const formatted = parsed.map((item: any, index: number) => ({
          id: index + 1,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.name,
            image: [item.image],
            price: item.price,
            sale_price: null,
          },
        }));
        setCartItems(formatted);
        onCartChange(formatted);
      } else {
        setCartItems([]);
      }
      setLoading(false);
      return;
    }

    // Fetching cart data from API if the user is logged in
    axios
      .get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const serverCartItems = res.data;
        const guestCart = localStorage.getItem('cart');

        // Nếu có giỏ hàng trong localStorage, kết hợp với giỏ hàng từ server
        if (guestCart) {
          const parsedGuestCart = JSON.parse(guestCart);
          // Kết hợp sản phẩm từ giỏ hàng server và localStorage
          const combinedCart = [...serverCartItems, ...parsedGuestCart];
          setCartItems(combinedCart);
          onCartChange(combinedCart);
        } else {
          setCartItems(serverCartItems);
          onCartChange(serverCartItems);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onPaymentInfoChange({ paymentMethod, totalPrice });
  }, [paymentMethod, totalPrice]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 text-sm font-semibold px-4 py-3 bg-white shadow">
        <div className="col-span-2">Sản phẩm</div>
        <div className="text-center">Số lượng</div>
        <div className="text-right">Thành tiền</div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm">Đang tải...</p>
      ) : cartItems.length === 0 ? (
        <p className="text-center text-sm">Giỏ hàng của bạn đang trống.</p>
      ) : (
        cartItems.map((item) => {
          const { product, quantity } = item;
          const hasSale = product.sale_price && product.sale_price < product.price;
          const displayPrice = hasSale ? product.sale_price! : product.price;
          const firstImage = product.image?.[0] || 'placeholder.jpg';

          return (
            <div key={item.id} className="grid grid-cols-4 items-center px-4 py-3 bg-white shadow">
              <div className="col-span-2 flex items-center gap-4">
                <Image
                  src={formatImageUrl(item.product?.image)}
                  alt={item.product?.name || 'Product Image'}
                  width={50}
                  height={50}
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
          <span>Thanh toán khi nhận hàng</span>
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
