'use client';

import React, { JSX } from 'react';
import {
  FiSmartphone,
  FiMonitor,
  FiCamera,
  FiHeadphones,
  FiWatch,
} from 'react-icons/fi';
import { MdSportsEsports } from 'react-icons/md';

interface Category {
  name: string;
  icon: JSX.Element;
}

const categories: Category[] = [
  { name: 'Phones', icon: <FiSmartphone size={28} /> },
  { name: 'Computers', icon: <FiMonitor size={28} /> },
  { name: 'SmartWatch', icon: <FiWatch size={28} /> },
  { name: 'Camera', icon: <FiCamera size={28} /> },
  { name: 'HeadPhones', icon: <FiHeadphones size={28} /> },
  { name: 'Gaming', icon: <MdSportsEsports size={28} /> },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
            <p className="text-red-500 font-semibold text-sm !translate-y-[1px]">Categories</p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4">Browse By Category</h2>
        </div>

        {/* Grid Category */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex flex-col items-center justify-center border border-gray-300 rounded-md py-5 transition-all duration-300 hover:bg-[#dc4b47] hover:text-white cursor-pointer text-center text-gray-800"
            >
              <div className="text-[28px] mb-2">{cat.icon}</div>
              <p className="text-[14px] font-semibold">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
