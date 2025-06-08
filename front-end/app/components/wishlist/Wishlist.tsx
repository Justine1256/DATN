'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import ProductCard from '../product/ProductCard';

// ✅ Định nghĩa kiểu dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  sale_price: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  reviewCount?: number;
  shop_slug: string;
}

interface WishlistItem {
  id: number;
  product_id: number;
  user_id: number;
  product: Product;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra token hợp lệ
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios
        .get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log('✅ User data:', res.data);
        })
        .catch((err) => {
          if (err.response) {
            console.error('❌ Token không hợp lệ hoặc hết hạn:', err.response.data);
          } else if (err.request) {
            console.error('❌ Không có phản hồi từ server:', err.request);
          } else {
            console.error('❌ Lỗi khác:', err.message);
          }
        });
    } else {
      console.warn('⚠️ authToken không tồn tại trong Cookies');
    }
  }, []);

  // ✅ Lấy danh sách wishlist
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      console.log('Người dùng chưa đăng nhập');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/wishlist', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể lấy wishlist!');
        return res.json();
      })
      .then((data: WishlistItem[]) => {
        console.log('✅ Wishlist trả về:', data);
        setWishlistItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('LỖI:', error);
        setLoading(false);
      });
  }, []);

  // ✅ Hàm xóa item khỏi wishlist nếu user bỏ tim
  const removeItem = (productId: number) => {
    setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
  };

  return (
    <div className="container mx-auto px-4">
      <div className="py-6" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-black">
          Wishlist ({wishlistItems.length})
        </h2>
        <button className="px-6 py-2 border border-gray-300 text-black text-sm font-medium rounded hover:bg-gray-50 transition-colors">
          Move all to Cart
        </button>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : wishlistItems.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          Hiện tại bạn chưa có sản phẩm yêu thích nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {wishlistItems.map((item) => (
            <ProductCard key={item.id} product={item.product} onUnlike={removeItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
