'use client';

import Image from "next/image";
import React from "react";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
export interface VoucherShip {
    id: number;
    discountText?: string;
    discount_value: number;
    discount_type: 'percent' | 'fixed';
    condition: string;
    expiry: string;
    imageUrl?: string;
    code?: string;
    onSave?: (voucherId: number) => void;
}

export default function VoucherShipCard({
    voucher,
    onSave,
}: {
    voucher: VoucherShip;
    onSave?: (voucherId: number) => void;
}) {
    // ✅ Console log dữ liệu
    console.log("📦 Voucher data:", voucher);

    const {
        id,
        discount_value,
        discount_type,
        condition,
        expiry,
        code,
        imageUrl,
        discountText,
    } = voucher;

    const formattedDiscount =
        discountText ||
        (discount_value > 0
            ? `Giảm ${discount_value.toLocaleString()}${discount_type === 'percent' ? '%' : 'đ'}`
            : 'Miễn phí vận chuyển');

    return (
        <div className="relative flex w-full max-w-[700px] h-[130px] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200 hover:shadow-md transition duration-200">

            {/* Cắt tròn trái/phải */}
            <div className="absolute left-[130px] top-0 w-[14px] h-[8px] rounded-b-full bg-[#f0f6fd] -translate-x-1/2 z-10" />
            <div className="absolute left-[130px] bottom-0 w-[14px] h-[8px] rounded-t-full bg-[#f0f6fd] -translate-x-1/2 z-10" />
            <div className="absolute top-2 bottom-2 left-[130px] w-px border-l border-dashed border-gray-300 z-10" />

            {/* Logo */}
            <div className="flex items-center justify-center w-[130px] h-full bg-white">
                <div className="w-[114px] h-[114px] rounded-md overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                    <Image
                        src={`${STATIC_BASE_URL}/path/to/your/image.jpg`}
                        alt="logo"
                        width={114} // Đặt chiều rộng
                        height={114} // Đặt chiều cao
                        className="w-full h-full object-contain"
                    />

                </div>
            </div>

            {/* Nội dung */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
                <div>
                    <div className="text-base font-bold text-gray-800">{formattedDiscount}</div>
                    <div className="text-sm text-gray-600 mt-1">{condition}</div>
                    {code && (
                        <div className="text-sm text-gray-500 mt-1">
                            Mã: <span className="font-semibold">{code}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">HSD: {expiry}</span>
                    <button
                        onClick={() => onSave?.(id)}
                        className="bg-[#db4444] hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-md transition duration-150"
                    >
                        Lưu
                    </button>
                    
                </div>
            </div>
        </div>
    );
}
