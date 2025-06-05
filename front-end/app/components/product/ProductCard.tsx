'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { AiFillHeart, AiFillStar } from 'react-icons/ai';
import { LoadingSkeleton } from '../loading/loading'; // ✅ import đúng

export interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: number;
  shop_slug: string;
}

export default function ProductCard({ product }: { product?: Product }) {
  const [liked, setLiked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  // ✅ Khi chưa có dữ liệu thì hiện loading
  if (!product) {
    return <LoadingSkeleton />;
  }

  const hasDiscount = !!(product.sale_price && product.sale_price > 0);
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleViewDetail = () => {
    router.push(`/shop/${product.shop_slug}/product/${product.slug}`);
  };

  return (
    <div
      onClick={handleViewDetail}
      className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 w-full max-w-[250px] flex flex-col justify-start mx-auto overflow-hidden transition cursor-pointer"
    >
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {liked ? 'Đã thêm vào yêu thích' : 'Đã hủy yêu thích'}
        </div>
      )}

      {hasDiscount && discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded">
          -{discountPercentage}%
        </div>
      )}

      <button onClick={handleLike} className="absolute top-2 right-2 text-xl z-10">
        {liked ? <AiFillHeart className="text-red-500" /> : <FiHeart className="text-gray-500" />}
      </button>

      <div className="w-full h-[140px] mt-8 flex items-center justify-center bg-transparent">
        <Image
          src={`http://localhost:8000/storage/${product.image}`}
          alt={product.name}
          width={2220}
          height={120}
          className="object-contain max-h-[2220px] transition-transform duration-300 group-hover:scale-105 bg-transparent"
        />
      </div>

      <div className="flex flex-col mt-4 w-full px-1 pb-14">
        <h4 className="text-[16px] font-semibold text-black truncate capitalize">
          {product.name}
        </h4>

        <div className="flex gap-2 mt-1 items-center">
          <span className="text-red-500 font-bold text-lg">
            {new Intl.NumberFormat('vi-VN').format(
              hasDiscount ? product.sale_price! : product.price
            )}đ
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">
              {new Intl.NumberFormat('vi-VN').format(product.price)}đ
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <AiFillStar key={i} className="w-4 h-4" />
            ))}
          <span className="text-gray-600 text-xs">(88)</span>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className="absolute bottom-0 left-0 right-0 bg-brand text-white text-sm py-2.5 rounded-b-lg items-center justify-center gap-2 transition-all duration-300 hidden group-hover:flex"
      >
        <FiShoppingCart className="text-base" />
        Add to cart
      </button>
    </div>
  );
}
