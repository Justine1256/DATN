"use client";

import React from "react";
import Image from "next/image";
import { AiFillHeart, AiFillStar } from "react-icons/ai";
import { FiHeart } from "react-icons/fi";

interface Props {
  image: string;
  name: string;
  category: string;
  price: number;
  sale_price: number;
  rating: number;
  sold: number;
  sizes: string[];
  colors: string[];
  isFashion: boolean;
  handleLike: () => void;
  liked: boolean;
  handleViewDetail: () => void;
}

export default function ProductPreviewCard({
  image,
  name,
  category,
  price,
  sale_price,
  rating,
  sold,
  sizes,
  colors,
  isFashion,
  handleLike,
  liked,
  handleViewDetail,
}: Props) {
  const finalPrice = sale_price || price;
  const discount = sale_price ? ((price - sale_price) / price) * 100 : 0;

  return (
    <div
      onClick={handleViewDetail}
      className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 w-full max-w-[240px] flex flex-col justify-start mx-auto overflow-hidden transition cursor-pointer"
      style={{ minHeight: '250px' }}
    >
      {/* Sale label */}
      {sale_price && (
        <div className="absolute top-2 left-2 bg-brand text-white text-[10px] px-2 py-0.5 rounded">
          -{Math.round(discount)}%
        </div>
      )}

      {/* Like button */}
      <button
        onClick={handleLike}
        className="absolute top-2 right-2 text-xl z-20 pointer-events-auto"
      >
        {liked ? (
          <AiFillHeart className="text-brand transition" />
        ) : (
          <FiHeart className="text-gray-500 transition" />
        )}
      </button>

      {/* Image */}
      <div className="w-full h-[150px] mt-8 flex items-center justify-center overflow-hidden">
        <Image
          src={image}
          alt={name}
          width={150}
          height={150}
          className="object-contain max-h-[150px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Product info */}
      <div className="flex flex-col mt-8 w-full px-1 pb-4">
        <h4 className="text-base font-semibold text-black leading-tight capitalize pointer-events-none overflow-hidden whitespace-nowrap text-ellipsis">
          {name}
        </h4>

        {/* Price */}
        <div className="flex gap-2 mt-1 items-center">
          <span className="text-brand font-bold text-base">
            {new Intl.NumberFormat("vi-VN").format(finalPrice)}₫
          </span>
          {sale_price && (
            <span className="text-gray-400 line-through text-xs">
              {new Intl.NumberFormat("vi-VN").format(price)}đ
            </span>
          )}
        </div>

        {/* Rating and sold count */}
        <div className="flex items-center justify-between text-yellow-500 text-sm mt-2">
          <div className="flex items-center">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <AiFillStar
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-500" : "text-gray-300"}`}
                />
              ))}
            <span className="text-gray-600">({rating})</span>
          </div>
          <span className="text-gray-600 text-sm">{sold ? `Đã bán: ${sold}` : "Chưa bán"}</span>
        </div>
      </div>

      {/* Sizes and colors (if applicable) */}
      <div className="flex flex-col gap-2 mt-2">
        {sizes.length > 0 && (
          <div>
            <p className="text-sm text-gray-700 mb-1">{isFashion ? "Size" : "Storage"}:</p>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded border text-xs font-medium text-gray-700 bg-gray-50"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {colors.length > 0 && (
          <div>
            <p className="text-sm text-gray-700 mb-1">Colors:</p>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <div
                  key={color}
                  className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
