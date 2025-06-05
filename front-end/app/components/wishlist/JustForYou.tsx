'use client';

import React from 'react';
import ProductCard from '../product/ProductCard';
// ✅ Thêm định nghĩa Product nếu chưa có
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
};

const JustForYou = () => {
  const suggestedProducts: Product[] = [
    {
      id: 101,
      name: 'Tai nghe Sony WH-1000XM4',
      image: 'images/headphone.png',
      slug: 'tai-nghe-sony-wh-1000xm4',
      price: 7000000,
      oldPrice: 8000000,
      sale_price: 6500000,
      rating: 4.8,
      discount: 20,
      option1: 'Color',
      value1: 'đen,trắng',
    },
    {
      id: 102,
      name: 'Apple Watch Series 9',
      image: 'images/apple-watch.png',
      slug: 'apple-watch-series-9',
      price: 11000000,
      oldPrice: 0,
      sale_price: 0,
      rating: 4.6,
      discount: 0,
      option1: 'Color',
      value1: 'đen,xanh lá',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Just For You</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {suggestedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default JustForYou;
