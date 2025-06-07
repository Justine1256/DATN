'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';

type Product = {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  sale_price: number;
  rating: number;
  discount: number;
  option1: string;
  value1: string;
  reviewCount: number;
  shop_slug: string;
};

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Người dùng chưa đăng nhập');
      setLoading(false); // ✅ Sửa lỗi: cần dừng loading nếu không có token
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
      .then((data) => {
        console.log('Wishlist trả về:', data); // 👀 debug nếu cần
        setWishlistItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('LỖI:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="py-6"></div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-m font-medium text-black">
          Wishlist ({wishlistItems.length})
        </h2>
        <button className="px-6 py-2 border border-gray-300 text-black text-sm font-medium rounded hover:bg-gray-50 transition-colors">
          Move all to Cart
        </button>
      </div>

      {/* 👉 Xử lý loading, empty, và có dữ liệu */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : wishlistItems.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          Hiện tại bạn chưa có sản phẩm yêu thích nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="py-1"></div>
    </div>
  );
};

export default Wishlist;
