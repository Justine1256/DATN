'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MdKitchen, MdSportsSoccer, MdChildCare, MdSportsEsports, MdChair, MdOutlineLaptopMac,
} from 'react-icons/md';
import {
  FiSmartphone, FiMonitor, FiCamera, FiHeadphones, FiWatch,
} from 'react-icons/fi';
import { GiSpeaker, GiVacuumCleaner } from 'react-icons/gi';
import { TbAirConditioning, TbFridge } from 'react-icons/tb';
import { FaTv, FaTshirt, FaHeartbeat } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { API_BASE_URL } from '@/utils/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

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
  'Điện Gia Dụng': MdKitchen,
  'Mẹ & Bé': MdChildCare,
  'Thể Thao & Dã Ngoại': MdSportsSoccer,
};

interface CategoryGridProps {
  activeSlug?: string;    // ✅ slug để highlight
  noScroll?: boolean;     // ✅ điều khiển scroll hay không
}

export default function CategoryGrid({ activeSlug, noScroll = false }: CategoryGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error('❌ Lỗi khi lấy category:', err));
  }, []);

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1170px] mx-auto px-4">
        <div className="border-t border-gray-200 mb-6" />

        <div className="mb-6 mt-10">
          <div className="flex items-center gap-2">
            <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
            <p className="text-brand font-semibold text-sm !translate-y-[1px]">Danh Mục</p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4">Khám phá theo danh mục</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-center">

          {categories.slice(0, 12).map((cat) => {
            const Icon = iconMap[cat.name] || FiMonitor;
            const isActive = cat.slug === activeSlug;

            return (
              <div
                key={cat.id}
                onClick={() =>
                  router.push(`/category/${cat.slug}`, { scroll: !noScroll })
                }
                className={`flex flex-col items-center justify-center border rounded-md py-5 cursor-pointer text-center group transition-all duration-300
                  ${isActive ? 'bg-brand text-white border-brand' : 'border-gray-300 text-gray-800 hover:bg-brand hover:text-white'}`}
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
