'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdKitchen, MdSportsSoccer, MdChildCare } from 'react-icons/md';
import {
  FiSmartphone,
  FiMonitor,
  FiCamera,
  FiHeadphones,
  FiWatch,
} from 'react-icons/fi';
import {
  MdSportsEsports,
  MdChair,
  MdOutlineLaptopMac,
} from 'react-icons/md';
import { GiSpeaker, GiVacuumCleaner } from 'react-icons/gi';
import { TbAirConditioning, TbFridge } from 'react-icons/tb';
import {
  // FaTabletAlt,
  FaTv,
  FaTshirt,
  FaHeartbeat,
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import { API_BASE_URL } from '@/utils/api';

interface Category {
  id: number;
  name: string;
  slug: string; // 👈 Thêm trường slug để chuyển hướng
}

// ✅ Gán icon theo tên danh mục tiếng Việt
const iconMap: Record<string, IconType> = {
  'Đồ công nghệ': FiMonitor,
  'Thời Trang': FaTshirt,
  'Sức Khỏe & Làm Đẹp': FaHeartbeat,
  'Điện thoại': FiSmartphone,
  'Máy tính': FiMonitor,
  'Đồng hồ': FiWatch,
  'Máy ảnh': FiCamera,
  'Tai nghe': FiHeadphones,
  'Game': MdSportsEsports,
  'Tủ lạnh': TbFridge,
  'Điều hòa': TbAirConditioning,
  'Tivi': FaTv,
  'Loa': GiSpeaker,
  'Máy hút bụi': GiVacuumCleaner,
  'Nội thất': MdChair,
  'Áo quần': FaTshirt,
  'Laptop': MdOutlineLaptopMac,

  // ✅ Icon mới thêm
  'Điện Gia Dụng': MdKitchen,
  'Mẹ & Bé': MdChildCare,
  'Thể Thao & Dã Ngoại': MdSportsSoccer,
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then((data) => {
        // console.log('📦 Category:', data);
        setCategories(data);
      })
      .catch((err) => console.error('❌ Lỗi khi lấy category:', err));
  }, []);

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        {/* ✅ Tiêu đề */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
            <p className="text-red-500 font-semibold text-sm !translate-y-[1px]">
              Danh Mục
            </p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4">
            Khám phá theo danh mục
          </h2>
        </div>

        {/* ✅ Lưới 2 hàng x 6 cột */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.slice(0, 12).map((cat) => {
            const Icon = iconMap[cat.name] || FiMonitor;
            return (
              <div
                key={cat.id}
                onClick={() => router.push(`/category/${cat.slug}`)} // 👈 Chuyển hướng khi click
                className="flex flex-col items-center justify-center border border-gray-300 rounded-md py-5 transition-all duration-300 hover:bg-[#dc4b47] hover:text-white cursor-pointer text-center text-gray-800 group"
              >
                <div className="text-[28px] mb-2 transition-all duration-300 group-hover:scale-110">
                  <Icon />
                </div>
                <p className="text-[14px] font-semibold">{cat.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
