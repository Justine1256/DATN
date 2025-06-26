'use client';

import React, { useState, useEffect } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import { API_BASE_URL } from "@/utils/api";
import Cookies from 'js-cookie';
import axios from 'axios';

import { IconType } from 'react-icons';
import { FaTshirt, FaHeartbeat, FaTv } from "react-icons/fa";
import { FiSmartphone } from "react-icons/fi";
import { MdSportsEsports, MdOutlineLaptopMac } from "react-icons/md";
import { TbAirConditioning, TbFridge } from "react-icons/tb";

// Icon & color mapping
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

// Map tên danh mục → category_id
const categoryMap: Record<string, number> = {
    'Điện thoại': 1,
    'Tủ lạnh': 2,
    'Thời Trang': 3,
    'Laptop': 4,
    'Điều hòa': 5,
    'Sức Khỏe & Làm Đẹp': 6,
    'Game': 7,
    'Tivi': 8,
};

const categories = Object.keys(iconMap);

export default function VoucherByCategory() {
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState<boolean>(false); // State to control popup visibility

    const token = Cookies.get('authToken');

    useEffect(() => {
        fetchVouchers();
    }, [selectedCategory]);

    const fetchVouchers = async () => {
        setLoading(true);
        setError(null);
        const categoryId = categoryMap[selectedCategory];

        try {
            const response = await fetch(`${API_BASE_URL}/vouchers/by-category/${categoryId}`);
            const data = await response.json();

            if (Array.isArray(data.data)) {
                const formatted = data.data.map((v: any) => ({
                    id: v.id,
                    code: v.code,
                    discount_value: v.discount_value,
                    discount_type: v.discount_type,
                    discountText:
                        v.discount_type === 'percent'
                            ? `Giảm ${v.discount_value}%`
                            : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`,
                    condition: `Đơn từ ${Number(v.min_order_value).toLocaleString('vi-VN')}đ`,
                    expiry: v.end_date?.split('T')[0],
                    imageUrl: '/ship.jpg',
                    isSaved: v.is_saved || false,
                }));

                setVouchers(formatted);
            } else {
                setError('Dữ liệu không đúng định dạng');
            }
        } catch (err) {
            setError('Có lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (voucherId: number) => {
        const existing = vouchers.find(v => v.id === voucherId);
        if (existing?.isSaved) {
            setPopupMessage("Voucher này đã có trong giỏ hàng!");
            setShowPopup(true);  // Show popup when voucher is already saved
            setTimeout(() => setShowPopup(false), 3000);  // Hide the popup after 3 seconds
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE_URL}/voucherseve`,
                { voucher_id: voucherId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            if (res.data.success) {
                setVouchers(prev =>
                    prev.map(v => v.id === voucherId ? { ...v, isSaved: true } : v)
                );
                setPopupMessage("Voucher đã được lưu vào giỏ hàng!");
                setShowPopup(true);  // Show popup when voucher is saved
                setTimeout(() => setShowPopup(false), 3000);
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                setVouchers(prev =>
                    prev.map(v => v.id === voucherId ? { ...v, isSaved: true } : v)
                );
                setPopupMessage("Voucher này đã được lưu trước đó!");
            } else {
                setPopupMessage("Lỗi khi lưu voucher!");
            }
            setShowPopup(true);  // Show popup on error
            setTimeout(() => setShowPopup(false), 3000);
        }
    };

    const handleCategoryChange = (category: string) => {
        if (category !== selectedCategory) {
            setSelectedCategory(category);
        }
    };

    return (
        <section className="w-full bg-gradient-to-br via-white to-red-50/20 py-16">
            {/* Popup */}
            {showPopup && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-brand text-sm px-4 py-3 rounded-lg shadow-lg border-l-4 border-[#DB4444] animate-slideInFade">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-brand" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {popupMessage}
                    </div>
                </div>
            )}

            <div className="max-w-[1120px] mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                        Mã Giảm Giá Theo Danh Mục
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Khám phá ưu đãi độc quyền cho từng danh mục sản phẩm yêu thích của bạn
                    </p>
                </div>

                {/* Category grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-12">
                    {categories.map((cat, index) => {
                        const Icon = iconMap[cat];
                        const isActive = selectedCategory === cat;
                        const gradientColor = categoryColors[cat];

                        return (
                            <div
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`group relative flex flex-col items-center justify-center w-full h-[110px] rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${isActive ? 'shadow-lg scale-105' : ''}`}
                            >
                                <div className={`absolute inset-0 rounded-2xl ${isActive ? `bg-gradient-to-br ${gradientColor}` : 'bg-white border-2 border-gray-200'}`} />
                                {isActive && <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-20 blur-xl scale-110 rounded-2xl`} />}
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={`text-3xl mb-2 ${isActive ? 'text-white scale-110' : 'text-gray-600'}`}>
                                        <Icon />
                                    </div>
                                    <span className={`font-semibold text-xs ${isActive ? 'text-white' : 'text-gray-700'}`}>{cat}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Voucher list */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-full text-center py-16">Đang tải dữ liệu...</div>
                    ) : error ? (
                        <div className="col-span-full text-center py-16 text-red-500">{error}</div>
                    ) : vouchers.length > 0 ? (
                        vouchers.map((voucher, index) => (
                            <div key={voucher.id} className="animate-in fade-in slide-in-from-bottom duration-500">
                                <VoucherShipCard voucher={voucher} onSave={() => handleSave(voucher.id)} />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <h3 className="text-lg font-semibold">Chưa có mã giảm giá cho danh mục này.</h3>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
    