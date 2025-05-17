"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Category {
  name: string;
  subcategories?: string[];
}

interface BannerImage {
  src: string;
  alt: string;
}

const categoriesData: Category[] = [
  { name: 'Woman\'s Fashion', subcategories: ['Dresses', 'Tops & Tees', 'Skirts'] },
  { name: 'Men\'s Fashion', subcategories: ['Shirts', 'Pants', 'Jackets'] },
  { name: 'Electronics' },
  { name: 'Home & Lifestyle' },
  { name: 'Medicine' },
  { name: 'Sports & Outdoor' },
  { name: 'Baby\'s & Toys' },
  { name: 'Groceries & Pets' },
  { name: 'Health & Beauty' },
];

const bannerImages: BannerImage[] = [
  { src: '', alt: 'Banner 1' },
  { src: 'https://salt.tikicdn.com/cache/w750/ts/tikimsp/4a/8c/17/6e26096860f1e7197b4a620e6a93b5e4.png.webp', alt: 'Banner 2' },
  { src: 'https://salt.tikicdn.com/cache/w750/ts/tikimsp/4a/8c/17/6e26096860f1e7197b4a620e6a93b5e4.png.webp', alt: 'Banner 3' },
];

const CategoryMenuWithBanner = () => {
  const [showSubMenu, setShowSubMenu] = useState([false, false]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const toggleSubMenu = (index: number) => {
    const newShowSubMenu = [...showSubMenu];
    newShowSubMenu[index] = !newShowSubMenu[index];
    setShowSubMenu(newShowSubMenu);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white"> {/* Nền trắng */}
      {/* Thanh ngang trên header */}
      <div className="bg-gray-200 h-0.5 w-full mb-4"></div>

      <div className="container mx-auto flex items-start"> {/* Container căn giữa và căn chỉnh các item từ đầu */}
        {/* Danh mục bên trái */}
        <div className="w-64 pr-8"> {/* Chiếm chiều rộng cố định và có padding bên phải */}
          <ul className="p-4"> {/* Loại bỏ background màu xám */}
            {categoriesData.map((category, index) => (
              <li key={index} className="mb-2 relative">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    if (index < 2 && category.subcategories) {
                      toggleSubMenu(index);
                    } else {
                      console.log(`Clicked on ${category.name}`);
                    }
                  }}
                >
                  <span className="text-black">{category.name}</span>
                  {index < 2 && category.subcategories && (
                    showSubMenu[index] ? <ChevronDownIcon className="w-4 h-4 text-black" /> : <ChevronRightIcon className="w-4 h-4 text-black" />
                  )}
                </div>
                {index < 2 && category.subcategories && (
                  <div
                    className={`absolute top-0 left-full ml-2 w-48 bg-white shadow-md rounded-md overflow-hidden transition-opacity duration-200 ${
                      showSubMenu[index] ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <ul>
                      {category.subcategories.map((subCategory, subIndex) => (
                        <li key={subIndex} className="px-4 py-2 text-gray-600 text-sm cursor-pointer hover:bg-gray-100">
                          {subCategory}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Thanh dọc màu xám */}
        <div className="w-0.5 bg-gray-200 h-full mx-4"></div>

        {/* Banner bên phải */}
        <div className="w-1/2 pl-8"> {/* Chiếm 1/2 chiều rộng và có padding bên trái */}
          {/* Div lớn bao ngoài cho banner */}
          <div className="relative aspect-w-16 aspect-h-9 overflow-hidden">
            {bannerImages.map((banner, index) => (
              <div
                key={index}
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                  index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  layout="fill"
                  objectFit="contain"
                  onError={(e) => console.error("Lỗi tải ảnh:", e.target.src)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thanh ngang giữa banner và footer (nếu có) */}
      <div className="bg-gray-200 h-0.5 w-full mt-4"></div>
    </div>
  );
};

export default CategoryMenuWithBanner;