'use client';

import React from 'react';
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
};

const Wishlist = () => {
  const wishlistItems: Product[] = [
    {
      id: 201,
      name: 'StylePro Hair Dryer',
      image: 'images/hair-dryer.png',
      slug: 'stylepro-hair-dryer',
      price: 625000,
      oldPrice: 345000,
      sale_price: 0,
      rating: 4.5,
      discount: 0,
      option1: 'Color',
      value1: 'đỏ,đen',
      reviewCount: 88,
    },
    {
      id: 202,
      name: 'AromaTherapy Essential Oil Diffuser',
      image: 'images/essential-oil-diffuser.png',
      slug: 'aromatherapy-essential-oil-diffuser',
      price: 750000,
      oldPrice: 700000,
      sale_price: 0,
      rating: 4.5,
      discount: 9,
      option1: 'Color',
      value1: 'đỏ,đen',
      reviewCount: 88,
    },
    {
      id: 203,
      name: 'NatureWalk Hiking Gear',
      image: 'images/hiking-shoe.png',
      slug: 'naturewalk-hiking-gear',
      price: 100000,
      oldPrice: 475000,
      sale_price: 0,
      rating: 4.5,
      discount: 0,
      option1: 'Color',
      value1: 'đỏ,đen',
      reviewCount: 88,
    },
    {
      id: 204,
      name: 'SonicWave Speaker',
      image: 'images/speaker.png',
      slug: 'sonicwave-speaker',
      price: 678000,
      oldPrice: 250000,
      sale_price: 0,
      rating: 4.5,
      discount: 5,
      option1: 'Color',
      value1: 'đỏ,đen',
      reviewCount: 88,
    },
  ];

  return (
    <div className="container mx-auto px-4">
      {/* Khoảng trống trên */} 
      <div className="py-6"></div>
      
      {/* Tiêu đề và nút */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-m font-medium text-black">
          Wishlist ({wishlistItems.length})
        </h2>
        <button className="px-6 py-2 border border-gray-300 text-black text-sm font-medium rounded hover:bg-gray-50 transition-colors">
          Move all to Cart
        </button>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {wishlistItems.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Khoảng trống dưới */}
      <div className="py-1"></div>
    </div>
  );
};

export default Wishlist;