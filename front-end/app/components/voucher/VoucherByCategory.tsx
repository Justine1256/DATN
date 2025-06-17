'use client';

import React, { useState, useEffect } from 'react';
import VoucherShipCard from './VoucherCard';
import { API_BASE_URL } from "@/utils/api";
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

const categoryColors: Record<string, string> = {
    'Điện thoại': 'from-blue-500 to-blue-600',
    'Tủ lạnh': 'from-cyan-500 to-cyan-600',
    'Thời Trang': 'from-pink-500 to-pink-600',
    'Laptop': 'from-gray-500 to-gray-600',
    'Điều hòa': 'from-sky-500 to-sky-600',
    'Sức Khỏe & Làm Đẹp': 'from-rose-500 to-rose-600',
    'Game': 'from-purple-500 to-purple-600',
    'Tivi': 'from-indigo-500 to-indigo-600',
};

const categories = Object.keys(iconMap);

export default function VoucherByCategory() {
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    useEffect(() => {
        fetchVouchers();
    }, [selectedCategory]);

    const fetchVouchers = async () => {
        try {
            setIsTransitioning(true);
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/vouchers/by-category/${selectedCategory}`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải mã giảm giá');
            }

            const data = await response.json();
            console.log('Dữ liệu trả về:', data);

            if (Array.isArray(data)) {
                // Add a small delay for smooth transition
                setTimeout(() => {
                    setVouchers(data);
                    setLoading(false);
                    setIsTransitioning(false);
                }, 300);
            } else {
                setError('Dữ liệu không đúng định dạng');
                setLoading(false);
                setIsTransitioning(false);
            }
        } catch (err) {
            console.error('Lỗi khi gọi API:', err);
            setError('Lỗi khi tải mã giảm giá');
            setLoading(false);
            setIsTransitioning(false);
        }
    };

    const handleCategoryChange = (category: string) => {
        if (category !== selectedCategory) {
            setSelectedCategory(category);
        }
    };

    const filtered = Array.isArray(vouchers)
        ? vouchers.filter((v) => v.category === selectedCategory)
        : [];

    return (
        <section className="w-full bg-gradient-to-br via-white to-red-50/20 py-16">
            <div className="max-w-[1120px] mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                        Mã Giảm Giá Theo Danh Mục
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Khám phá ưu đãi độc quyền cho từng danh mục sản phẩm yêu thích của bạn
                    </p>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-12">
                    {categories.map((cat, index) => {
                        const Icon = iconMap[cat];
                        const isActive = selectedCategory === cat;
                        const gradientColor = categoryColors[cat] || 'from-gray-500 to-gray-600';

                        return (
                            <div
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`group relative flex flex-col items-center justify-center w-full h-[110px] rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
                                    ${isActive
                                        ? 'shadow-lg scale-105'
                                        : 'hover:scale-105'
                                    }`}
                                style={{
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                {/* Background */}
                                <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isActive
                                        ? `bg-gradient-to-br ${gradientColor} shadow-lg`
                                        : 'bg-white border-2 border-gray-200 group-hover:border-gray-300'
                                    }`} />

                                {/* Glow effect for active category */}
                                {isActive && (
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientColor} opacity-20 blur-xl scale-110`} />
                                )}

                                {/* Content */}
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={`text-3xl mb-2 transition-all duration-300 ${isActive
                                            ? 'text-white transform scale-110'
                                            : 'text-gray-600 group-hover:text-gray-800'
                                        }`}>
                                        <Icon />
                                    </div>
                                    <span className={`font-semibold text-xs text-center leading-tight transition-all duration-300 ${isActive
                                            ? 'text-white'
                                            : 'text-gray-700 group-hover:text-gray-900'
                                        }`}>
                                        {cat}
                                    </span>
                                </div>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientColor}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Selected Category Header */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center space-x-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
                        <div className={`text-2xl text-transparent bg-gradient-to-r ${categoryColors[selectedCategory]} bg-clip-text`}>
                            {React.createElement(iconMap[selectedCategory])}
                        </div>
                        <span className="font-semibold text-gray-800">{selectedCategory}</span>
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                            {filtered.length}
                        </div>
                    </div>
                </div>

                {/* Voucher List */}
                <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-50 transform translate-y-4' : 'opacity-100'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[300px]">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="relative mb-6">
                                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-red-300 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">Đang tải mã giảm giá...</h3>
                                    <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">Có lỗi xảy ra</h3>
                                    <p className="text-sm text-gray-600">{error}</p>
                                    <button
                                        onClick={fetchVouchers}
                                        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        ) : filtered.length > 0 ? (
                            filtered.map((voucher, index) => (
                                <div
                                    key={voucher.id}
                                    className="animate-in fade-in slide-in-from-bottom duration-500"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <VoucherShipCard voucher={voucher} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <div className={`text-3xl text-transparent bg-gradient-to-r ${categoryColors[selectedCategory]} bg-clip-text`}>
                                        {React.createElement(iconMap[selectedCategory])}
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">Chưa có mã giảm giá</h3>
                                    <p className="text-sm text-gray-600 max-w-md">
                                        Hiện tại không có mã giảm giá cho danh mục <span className="font-semibold text-gray-800">{selectedCategory}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom CTA */}
                {filtered.length > 0 && (
                    <div className="text-center mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-600 mb-4">
                            Tìm thấy <span className="font-bold text-red-500">{filtered.length}</span> mã giảm giá cho danh mục {selectedCategory}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {categories.filter(cat => cat !== selectedCategory).slice(0, 3).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors duration-200 text-sm"
                                >
                                    <div className="text-lg">
                                        {React.createElement(iconMap[cat])}
                                    </div>
                                    <span>Xem {cat}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}