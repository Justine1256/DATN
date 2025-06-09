'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
    price: number;
  };
}

export default function CartItemsSection() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error('Không thể tải giỏ hàng');

      const data = await res.json();
      setCartItems(data);
    } catch (error) {
      console.error('Lỗi lấy giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleQuantityChange = (id: number, value: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, value) } : item
      )
    );
    // ✅ Có thể gọi thêm API PUT để cập nhật backend (nếu cần)
  };

  const handleRemove = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    // ✅ Gọi thêm API DELETE nếu muốn xóa backend
  };

  if (loading) return <p className="text-center py-10">Đang tải giỏ hàng...</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-4 text-black font-semibold text-sm bg-white p-4 shadow-sm">
        <div className="text-left">Product</div>
        <div className="text-center">Price</div>
        <div className="text-center">Quantity</div>
        <div className="text-right">Subtotal</div>
      </div>

      {/* Items */}
      {cartItems.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-4 items-center bg-white p-4 shadow-sm relative"
        >
          {/* Product */}
          <div className="flex items-center gap-4 relative text-left">
            <button
              onClick={() => handleRemove(item.id)}
              className="absolute -top-2 -left-2 bg-white border border-brand text-brand rounded-full w-5 h-5 text-xs flex items-center justify-center shadow-sm"
              title="Remove item"
            >
              ✕
            </button>

            <div className="w-16 h-16 relative shrink-0">
              <Image
                src={`http://localhost:8000/storage/${item.product.image}`}
                alt={item.product.name}
                fill
                className="object-contain"
              />
            </div>

            <span className="text-sm font-medium text-black">{item.product.name}</span>
          </div>

          {/* Price */}
          <div className="text-center text-sm font-semibold text-black">
            {Number(item.product?.price || 0).toLocaleString()}đ
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
          <div className="text-right text-sm font-semibold text-black">
            {(Number(item.product?.price || 0) * item.quantity).toLocaleString()}đ
          </div>
        </div>
      ))}
    </div>
  );
}
