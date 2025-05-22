'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'; // Import icons

const categories = [
  {
    name: "Woman's Fashion",
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/8b/d4/a8/5924758b5c36f3b1c43b6843f52d6dd2.png.webp',
    href: '/womens-fashion',
  },
  {
    name: "Men's Fashion",
    image: 'https://salt.tikicdn.com/cache/100x100/ts/category/75/34/29/78e428fdd90408587181005f5cc3de32.png.webp',
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

const banners = [
  {
    imageUrl: 'https://img4.thuthuatphanmem.vn/uploads/2020/06/26/mau-banner-quang-cao-dien-may_033707028.jpg',
    link: '/banner-1-link',
    alt: 'Banner quảng cáo điện máy 1',
  },
  {
    imageUrl: 'https://thietbidiengiadung.io.vn/wp-content/uploads/2025/01/banner-gia-dung-4.jpg',
    link: '/banner-2-link',
    alt: 'Banner đồ gia dụng 2',
  },
  {
    imageUrl: 'https://shop.nagakawa.com.vn/media/news/109_banner_bai_viet.jpg',
    link: '/banner-3-link',
    alt: 'Banner sản phẩm nagakawa 3',
  },
  {
    imageUrl: 'https://shop.nagakawa.com.vn/media/news/193_banner_chung_b__i_web.png',
    link: '/banner-4-link',
    alt: 'Banner khuyến mãi nagakawa 4',
  },
];

const CategoryMenuWithBanner = ({ headerHeight }: { headerHeight: number }) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerInterval = useRef<NodeJS.Timeout | null>(null);

  const [isHovering, setIsHovering] = useState(false);

  const bannerRef = useRef<HTMLDivElement>(null); // Ref cho container banner

  // State để kiểm soát việc hiển thị component sau khi có headerHeight
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (headerHeight > 0) {
      setIsMounted(true);
      startBannerInterval();
    }
    return () => {
      clearBannerInterval();
    };
  }, [headerHeight, banners.length]);

  const startBannerInterval = () => {
    bannerInterval.current = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
  };

  const clearBannerInterval = () => {
    if (bannerInterval.current) {
      clearInterval(bannerInterval.current);
    }
  };

  const handlePrev = () => {
    setCurrentBannerIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
    clearBannerInterval();
    startBannerInterval();
  };

  const handleNext = () => {
    setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    clearBannerInterval();
    startBannerInterval();
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    clearBannerInterval();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    startBannerInterval();
  };

  const handleDotClick = (index: number) => {
    setCurrentBannerIndex(index);
    clearBannerInterval();
    startBannerInterval();
  };

  const currentBanner = banners[currentBannerIndex];

  // Nếu headerHeight chưa được truyền hoặc component chưa mount, trả về null hoặc placeholder
  if (!isMounted) {
    return <div className="bg-white animate-pulse h-[315px] mt-0" />; // Match banner height
  }

  return (
    <div className={`bg-white mt-[${headerHeight}px] pt-6`}>
      {/* <div className="bg-gray-200 h-0.5 w-full mb-4" /> */}

      <div className="container mx-auto flex items-start">
        {/* DANH MỤC BÊN TRÁI */}
        <div
          className="w-80 pr-10 sticky top-5 max-h-[340px] overflow-y-auto pt-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <div className="bg-gray-100 p-2 rounded-md shadow-sm">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {categories.map((category, index) => (
                <li
                  key={index}
                  className="mb-3 group hover:bg-gray-200 rounded-md transition-all"
                >
                  <Link
                    href={category.href}
                    className="flex items-center gap-1 p-2 cursor-pointer relative !no-underline"
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={30}
                      height={30}
                      className="rounded-full"
                      loading="lazy"
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
        <div className="w-0.5 bg-gray-200 h-full mx-4 mt-0"></div>

        {/* BANNER BÊN PHẢI */}
        <div className="w-full pr-8 mt-0 pt-4" ref={bannerRef}>
          <div className="relative overflow-hidden rounded-md shadow" style={{ height: '315px', maxHeight: '40%' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* BANNER */}
            <div className="relative cursor-pointer w-full h-full" onClick={() => handleDotClick(currentBannerIndex)}>
              <Link
                href={currentBanner.link}
                aria-label={currentBanner.alt}
                className="absolute top-0 left-0 w-full h-full block"
              >
                <Image
                  priority
                  loading="eager"
                  src={currentBanner.imageUrl}
                  alt={currentBanner.alt}
                  fill
                  className="object-cover rounded-md"
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 1200px"
                />
              </Link>
            </div>

            {/* DOTS */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {Array.from({ length: banners.length }).map((_, index: number) => (
                <button
                  key={index}
                  className={`w-6 h-1 rounded-full ${
                    index === currentBannerIndex ? 'bg-red-500' : 'bg-gray-300'
                  } cursor-pointer transition-colors duration-300 focus:outline-none`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* NÚT PREV / NEXT */}
            <div
              className={`absolute top-1/2 left-0 -translate-y-1/2 flex justify-between w-full px-4 z-20 transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                style={{
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)', // Tăng độ đậm màu nền
                  color: '#374151',
                }}
                className="hover:bg-white transition duration-300 focus:outline-none" // Thay đổi hover background
                aria-label="Previous slide"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                style={{
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)', // Tăng độ đậm màu nền
                  color: '#374151',
                }}
                className="hover:bg-white transition duration-300 focus:outline-none" // Thay đổi hover background
                aria-label="Next slide"
              >
                <HiChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 h-0.5 w-full mt-6" />
    </div>
  );
};

export default CategoryMenuWithBanner;