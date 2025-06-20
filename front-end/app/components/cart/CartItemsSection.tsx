'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { CartItem } from './hooks/CartItem';

interface Props {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export default function CartItemsSection({
  cartItems: propsCartItems,
  setCartItems: propsSetCartItems,
}: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Không thể tải giỏ hàng');

      const data = await res.json();
      setCartItems(data);
      propsSetCartItems(data);
      localStorage.setItem('cartItems', JSON.stringify(data));
    } catch (error) {
      console.warn('API thất bại, fallback localStorage');
      const stored = localStorage.getItem('cartItems');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCartItems(data);
          propsSetCartItems(data);
        } catch (err) {
          console.error('Lỗi đọc localStorage:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemove = async (id: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      // Cập nhật state sau khi xóa
      const updated = cartItems.filter((item) => item.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cartItems', JSON.stringify(updated));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error('Lỗi xoá sản phẩm khỏi giỏ:', error);
    }
  };

  const handleQuantityChange = async (id: number, value: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    const quantity = Math.max(1, value);

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) throw new Error('Không thể cập nhật số lượng');

      const updated = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cartItems', JSON.stringify(updated));
    } catch (error) {
      console.error('Lỗi cập nhật số lượng:', error);
    }
  };

  const renderVariant = (item: CartItem) => {
    const variants: string[] = [];

    if (item.product.option1 && item.product.value1) variants.push(item.product.value1);
    if (item.product.option2 && item.product.value2) variants.push(item.product.value2);

    return variants.length > 0 ? (
      <p className="text-xs text-gray-400">{variants.join(', ')}</p>
    ) : (
      <p className="text-xs text-gray-400 italic">Không có</p>
    );
  };

  const formatPrice = (value?: number | null) =>
    (value ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
  <div className="space-y-4">
    {/* Header */}
    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] text-black font-semibold text-sm bg-white p-4 shadow">
      <div className="text-left">Sản phẩm</div>
      <div className="text-left">Biến thể</div>
      <div className="text-center">Giá</div>
      <div className="text-center">Số lượng</div>
      <div className="text-right">Tổng cộng</div>
    </div>

    {/* Items */}
    {loading ? (
      <p className="text-center py-10">Đang tải giỏ hàng...</p>
    ) : cartItems.length === 0 ? (
      <div className="p-10 text-center border rounded-md bg-white text-gray-500 text-lg shadow">
        🛒 Giỏ hàng của bạn đang trống
      </div>
    ) : (
      cartItems.map((item) => {
    const priceToUse = item.product.sale_price ?? item.product.price;
    const firstImage = item.product.image?.[0] || 'placeholder.jpg';

    return (
      <div
        key={item.id}
        className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center bg-white p-4 shadow relative"
      >
        {/* Product */}
        <div className="flex items-center gap-4 relative text-left">
          <button
            onClick={() => handleRemove(item.id)}
            className="absolute -top-2 -left-2 bg-white border border-brand text-brand rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
            title="Xoá sản phẩm"
          >
            ✕
          </button>

          <div className="w-16 h-16 relative shrink-0">
            <Image
              src={`${STATIC_BASE_URL}/${firstImage}`}
              alt={item.product.name}
              fill
              className="object-contain"
            />
          </div>

          <span className="text-sm font-medium text-black">
            {item.product.name}
          </span>
        </div>

        {/* Variant */}
        <div>{renderVariant(item)}</div>

        {/* Price */}
        <div className="text-center text-sm text-black">
          {item.product.sale_price ? (
            <div>
              <span className="text-red-500 font-semibold">
                {formatPrice(item.product.sale_price)} đ
              </span>
              <br />
              <span className="line-through text-gray-400 text-xs">
                {formatPrice(item.product.price)} đ
              </span>
            </div>
          ) : (
            <span className="font-semibold">
              {formatPrice(item.product.price)} đ
            </span>
          )}
        </div>

        {/* Quantity */}
        <div className="text-center">
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) =>
              handleQuantityChange(item.id, parseInt(e.target.value || '1'))
            }
            className="w-20 px-3 py-2 border rounded-md text-center text-black"
          />
        </div>

        {/* Subtotal */}
        <div className="text-right text-sm font-semibold text-red-500">
          {formatPrice(priceToUse * item.quantity)} đ
        </div>
      </div>
    );
  })
)}

    </div>
  );
}
