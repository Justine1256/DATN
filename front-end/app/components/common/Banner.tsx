'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  {
    name: "Woman's Fashion",
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/8b/d4/a8/5924758b5c36f3b1c43b6843f52d6dd2.png.webp',
    href: '/womens-fashion',
  },
  {
    name: "Men's Fashion",
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/ed/20/60/afa9b3b474bf7ad70f10dd6443211d5f.png.webp',
    href: '/mens-fashion',
  },
  {
    name: 'Electronics',
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/54/c0/ff/fe98a4afa2d3e5142dc8096addc4e40b.png.webp',
    href: '/electronics',
  },
  {
    name: 'Home & Lifestyle',
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/0b/5e/3d/00941c9eb338ea62a47d5b1e042843d8.png.webp',
    href: '/home-lifestyle',
  },
  {
    name: 'Medicine',
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/00/5d/97/384ca1a678c4ee93a0886a204f47645d.png.webp',
    href: '/medicine',
  },
  {
    name: 'Sports & Outdoor',
    image: 'https://via.placeholder.com/40x40/20B2AA/FFFFFF?Text=SO',
    href: '/sports-outdoor',
  },
  {
    name: "Baby's & Toys",
    image: 'https://via.placeholder.com/40x40/FFD700/000000?Text=BT',
    href: '/babys-toys',
  },
  {
    name: 'Groceries & Pets',
    image: 'https://via.placeholder.com/40x40/32CD32/FFFFFF?Text=GP',
    href: '/groceries-pets',
  },
  {
    name: 'Health & Beauty',
    image: 'https://via.placeholder.com/40x40/DA70D6/FFFFFF?Text=HB',
    href: '/health-beauty',
  },
];

const bannerImages = [
  'https://img4.thuthuatphanmem.vn/uploads/2020/06/26/mau-banner-quang-cao-dien-may_033707028.jpg',
  'https://thietbidiengiadung.io.vn/wp-content/uploads/2025/01/banner-gia-dung-4.jpg',
  'https://shop.nagakawa.com.vn/media/news/109_banner_bai_viet.jpg',
  'https://shop.nagakawa.com.vn/media/news/193_banner_chung_b__i_web.png',
];

const CategoryMenuWithBanner = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerInterval = useRef<NodeJS.Timeout | null>(null);
  

  const startBannerInterval = () => {
    bannerInterval.current = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 3000);
  };

  const clearBannerInterval = () => {
    if (bannerInterval.current) {
      clearInterval(bannerInterval.current);
    }
  };

  useEffect(() => {
    startBannerInterval();
    return clearBannerInterval;
  }, [bannerImages.length]);

  const handlePrev = () => {
    setCurrentBannerIndex((prevIndex) =>
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
    );
    clearBannerInterval();
    startBannerInterval();
  };

  const handleNext = () => {
    setCurrentBannerIndex((prevIndex) =>
      (prevIndex + 1) % bannerImages.length
    );
    clearBannerInterval();
    startBannerInterval();
  };

  const handleDotClick = (index: number) => {
    setCurrentBannerIndex(index);
    clearBannerInterval();
    startBannerInterval();
  };

  return (
    <div className="bg-white mt-[${headerHeight}px]">
      <div className="bg-gray-200 h-0.5 w-full mb-4" />

      <div className="container mx-auto flex items-start">
        {/* DANH MỤC BÊN TRÁI */}
        <div className="w-64 pr-8 sticky top-0 max-h-[340px] overflow-y-auto" style={{
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <div className="bg-gray-100 p-4 rounded-md shadow-sm">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {categories.map((category, index) => (
                <li
                  key={index}
                  className="mb-3 group hover:bg-gray-200 rounded-md transition-all"
                >
                  <Link href={category.href} className="flex items-center gap-1 p-2 cursor-pointer relative !no-underline">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={30}
                      height={30}
                      className="rounded-full"
                      loading="lazy" // Explicitly set lazy loading for category images
                    />
                    <span className="text-black font-medium relative whitespace-nowrap">
                      {category.name}
                      <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-red-500 transition-all group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* THANH DỌC NGĂN */}
        <div className="w-0.5 bg-gray-200 h-full mx-4" />

        {/* BANNER BÊN PHẢI */}
        <div className="pr-8" style={{ width: '50%', maxWidth: '500px' }}>
          <div
            className="relative overflow-hidden rounded-md shadow"
            style={{ aspectRatio: '1400 / 500', height: '340px', maxHeight: '50%' }}
          >
            {bannerImages.map((src, index) => (
              <div
                key={index}
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${
                  index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  priority={index === 0} // Prioritize the first banner image
                  loading={index !== 0 ? 'lazy' : undefined} // Lazy load subsequent banners
                  src={src}
                  alt={`Banner ${index + 1}`}
                  fill
                  className="object-cover rounded-md"
                  style={{ objectFit: 'cover' }}
                  // Example sizes prop (adjust based on your layout)
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
                />
              </div>
            ))}

            {/* NÚT PREV / NEXT */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex justify-between w-full px-4 z-20">
              <button
                onClick={handlePrev}
                className="w-10 h-10 bg-white/50 text-gray-800 rounded-full flex items-center justify-center hover:bg-white/80 transition duration-300 focus:outline-none"
              >
                {'<'}
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 bg-white/50 text-gray-800 rounded-full flex items-center justify-center hover:bg-white/80 transition duration-300 focus:outline-none"
              >
                {'>'}
              </button>
            </div>

            {/* DOTS */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {bannerImages.map((_, index: number) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentBannerIndex ? 'bg-red-500' : 'bg-gray-300'
                  } cursor-pointer transition-colors duration-300 focus:outline-none`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 h-0.5 w-full mt-4" />
    </div>
  );
};

export default CategoryMenuWithBanner;