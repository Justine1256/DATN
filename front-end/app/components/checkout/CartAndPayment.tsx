'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';

interface CartItem {
  id: string | number;
  quantity: number;
  product: {
    name: string;
    image: string[];
    price: number;
    sale_price?: number | null;
  };
  variant?: {
    price?: number | null;
    sale_price?: number | null;
  };
}

interface Props {
  onPaymentInfoChange: (info: {
    paymentMethod: string;
    subtotal: number;
    promotionDiscount: number;
    shipping: number;
    total: number;
  }) => void;
  onCartChange: (items: CartItem[]) => void;
}

export default function CartAndPayment({ onPaymentInfoChange, onCartChange }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getPriceToUse = (item: CartItem) => {
    return (
      item.variant?.sale_price ??
      item.variant?.price ??
      item.product.sale_price ??
      item.product.price ??
      0
    );
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity), 0
  );

  const discountedSubtotal = cartItems.reduce(
    (sum, item) => sum + (getPriceToUse(item) * item.quantity), 0
  );

  const promotionDiscount = subtotal - discountedSubtotal;

  const shipping = cartItems.length > 0 ? 20000 : 0;

  const total = discountedSubtotal + shipping;

  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) {
      return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith('http')) return img;
    return img.startsWith('/')
      ? `${STATIC_BASE_URL}${img}`
      : `${STATIC_BASE_URL}/${img}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    const fetchCart = async () => {
      try {
        if (!token) {
          const guestCart = localStorage.getItem('cart');
          const parsed = guestCart ? JSON.parse(guestCart) : [];
          const formatted = parsed.map((item: any, index: number) => ({
            id: `guest-${index}`,
            quantity: item.quantity,
            product: {
              name: item.name,
              image: [item.image],
              price: item.price,
              sale_price: item.sale_price ?? null,
            },
            variant: item.variant ?? null
          }));
          setCartItems(formatted);
          onCartChange(formatted);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const serverCart = (res.data || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.product?.name || 'Sản phẩm',
            image: Array.isArray(item.product?.image)
              ? item.product.image
              : [item.product?.image],
            price: item.product?.price || 0,
            sale_price: item.product?.sale_price ?? null,
          },
          variant: item.variant ?? null
        }));

        setCartItems(serverCart);
        onCartChange(serverCart);
        localStorage.removeItem('cart');
      } catch (err) {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        setCartItems([]);
        onCartChange([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  useEffect(() => {
    onPaymentInfoChange({
      paymentMethod,
      subtotal,
      promotionDiscount,
      shipping,
      total
    });
  }, [paymentMethod, subtotal, promotionDiscount, shipping, total]);

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
          const { product, quantity, variant } = item;
          const price = getPriceToUse(item);
          const originalTotal = product.price * quantity;
          const finalTotal = price * quantity;
          const hasDiscount = price < product.price;

          return (
            <div
              key={`cart-item-${item.id}`}
              className="grid grid-cols-4 items-center px-4 py-3 bg-white shadow"
            >
              <div className="col-span-2 flex items-center gap-4">
                <Image
                  src={formatImageUrl(product.image)}
                  alt={product.name || 'Product Image'}
                  width={50}
                  height={50}
                />
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
              </div>

              <div className="text-center text-sm">{quantity}</div>

              <div className="text-right text-sm">
                {hasDiscount ? (
                  <div>
                    <p className="line-through text-gray-400 text-xs">
                      {originalTotal.toLocaleString()}đ
                    </p>
                    <p className="font-semibold text-red-600">
                      {finalTotal.toLocaleString()}đ
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold">
                    {finalTotal.toLocaleString()}đ
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
