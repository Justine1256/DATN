'use client';

import React, { useState, useEffect } from 'react';
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

export default function VoucherByCategory() {
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
    const [vouchers, setVouchers] = useState<any[]>([]); // Lưu trữ dữ liệu voucher
    const [loading, setLoading] = useState<boolean>(true); // Trạng thái tải dữ liệu
    const [error, setError] = useState<string | null>(null); // Trạng thái lỗi

    useEffect(() => {
        // Lấy dữ liệu voucher từ API khi thay đổi danh mục
        const fetchVouchers = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/api/vouchers/by-category/3`);
                if (!response.ok) {
                    throw new Error('Lỗi khi tải mã giảm giá');
                }
                const data = await response.json();

                // Log dữ liệu để kiểm tra cấu trúc
                console.log('Dữ liệu trả về:', data);

                // Kiểm tra xem dữ liệu có phải là mảng không trước khi cập nhật state
                if (Array.isArray(data)) {
                    setVouchers(data); // Giả sử dữ liệu trả về là một mảng các voucher
                } else {
                    setError('Dữ liệu không đúng định dạng');
                }
                setLoading(false);
            } catch (err) {
                setError('Lỗi khi tải mã giảm giá');
                setLoading(false);
            }
        };

        fetchVouchers();
    }, [selectedCategory]); // Lấy lại dữ liệu voucher khi thay đổi danh mục

    // Kiểm tra xem vouchers có phải là mảng và sau đó lọc theo danh mục đã chọn
    const filtered = Array.isArray(vouchers)
        ? vouchers.filter((v) => v.category === selectedCategory)
        : [];

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
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-[#db4444] hover:text-white hover:border-[#db4444]'}`}
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
                    {loading ? (
                        <div className="col-span-full text-center text-gray-500 text-base py-8">
                            Đang tải mã giảm giá...
                        </div>
                    ) : error ? (
                        <div className="col-span-full text-center text-red-500 text-base py-8">
                            {error}
                        </div>
                    ) : filtered.length > 0 ? (
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
