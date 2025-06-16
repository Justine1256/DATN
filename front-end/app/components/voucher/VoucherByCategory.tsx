'use client';

import React, { useState } from 'react';
import VoucherShipCard from './VoucherCard';

import { IconType } from 'react-icons';
import { FaTshirt, FaHeartbeat, FaTv } from "react-icons/fa";
import {
    FiSmartphone, FiMonitor, FiCamera, FiHeadphones, FiWatch,
} from "react-icons/fi";
import {
    MdSportsEsports, MdChair, MdOutlineLaptopMac, MdKitchen,
    MdSportsSoccer, MdChildCare,
} from "react-icons/md";
import { GiSpeaker, GiVacuumCleaner } from "react-icons/gi";
import { TbAirConditioning, TbFridge } from "react-icons/tb";

const iconMap: Record<string, IconType> = {
    'Điện thoại': FiSmartphone,
    'Tủ lạnh': TbFridge,
    'Thời Trang': FaTshirt,
    'Laptop': MdOutlineLaptopMac,
    'Điều hòa': TbAirConditioning,
    'Sức Khỏe & Làm Đẹp': FaHeartbeat,
    'Game': MdSportsEsports,
    'Tivi': FaTv,
};

const categories = Object.keys(iconMap);

const allVouchers = [
    {
        id: 1,
        category: 'Điện thoại',
        imageUrl: '/ship.jpg',
        discountText: 'Giảm 10%',
        condition: 'Đơn từ 2.000.000đ',
        expiry: '30/07/2025',
        code: 'PHONE10',
    },
    {
        id: 2,
        category: 'Tủ lạnh',
        imageUrl: '/ship.jpg',
        discountText: 'Giảm 500K',
        condition: 'Đơn từ 5.000.000đ',
        expiry: '15/08/2025',
        code: 'COOLFRIDGE',
    },
    {
        id: 3,
        category: 'Thời Trang',
        imageUrl: '/ship.jpg',
        discountText: 'Giảm 20%',
        condition: 'Không giới hạn đơn hàng',
        expiry: '12/07/2025',
        code: 'STYLE2025',
    },
];

export default function VoucherByCategory() {
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

    const filtered = allVouchers.filter((v) => v.category === selectedCategory);

    return (
        <section className="w-full bg-white py-10">
            <div className="max-w-[1120px] mx-auto px-4">
                {/* ✅ Danh mục theo icon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
                    {categories.map((cat) => {
                        const Icon = iconMap[cat];
                        const isActive = selectedCategory === cat;

                        return (
                            <div
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex flex-col items-center justify-center w-full h-[100px] rounded-lg border text-sm cursor-pointer transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#db4444] text-white border-[#db4444]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-[#db4444] hover:text-white hover:border-[#db4444]'}
                                `}
                            >
                                <div className="text-2xl mb-2">
                                    <Icon />
                                </div>
                                <span className="font-medium">{cat}</span>
                            </div>
                        );
                    })}
                </div>

                {/* ✅ Danh sách voucher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[180px]">
                    {filtered.length > 0 ? (
                        filtered.map((voucher) => (
                            <VoucherShipCard key={voucher.id} voucher={voucher} />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 text-base py-8">
                            Hiện tại không có mã giảm giá cho danh mục này.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

