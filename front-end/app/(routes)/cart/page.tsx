'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from "@/app/components/cart/CartBreadcrumb";
import CartItemsSection from "@/app/components/cart/CartItemsSection";
import CartSummarySection from "@/app/components/cart/CartSummarySection";
import Cookies from 'js-cookie';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);

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
      localStorage.setItem('cartItems', JSON.stringify(data));
    } catch (error) {
      console.error('Lỗi lấy giỏ hàng:', error);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  return (
    <div className="bg-white container mx-auto px-4 pt-[80px] pb-[80px]">
      <Breadcrumb
        items={[
          { label: "Tài khoản", href: "/account" },
          { label: "Tài khoản của tôi", href: "/account/profile" },
          { label: "Sản Phẩm", href: "/products" },
          { label: "Giỏ hàng" },
        ]}
      />

      <div className="md:col-span-2 mb-4 pt-[40px]">
        <CartItemsSection cartItems={cartItems} setCartItems={setCartItems} />
      </div>
      <div>
        <CartSummarySection cartItems={cartItems} />
      </div>
    </div>
  );
}
