// VoucherShipCard.tsx
'use client';

import React from "react";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import Image from "next/image";

export interface VoucherShip {
    id: number;
    discountText?: string;
    discount_value: number;
    discount_type: 'percent' | 'fixed';
    condition: string;
    expiry: string;
    imageUrl?: string;
    code?: string;
    isSaved: boolean;
}

export default function VoucherShipCard({
    voucher,
    onSave,
}: {
    voucher: VoucherShip;
    onSave?: (voucherId: number) => void;
}) {
    const {
        id,
        discount_value,
        discount_type,
        condition,
        expiry,
        code,
        imageUrl,
        discountText,
        isSaved,
    } = voucher;

    const formattedDiscount =
        discountText ||
        (discount_value > 0
            ? `Giảm ${discount_value.toLocaleString()}${discount_type === 'percent' ? '' : 'đ'}`
            : 'Miễn phí vận chuyển');

    return (
        <div className="relative flex justify-center items-center w-full max-w-[720px] h-[150px] rounded-2xl overflow-hidden bg-white border border-gray-200/50 hover:-translate-y-1 transition-all duration-300">
            {/* Logo Section */}
            <div className="relative flex items-center justify-center w-[130px] h-full">
                <div className="w-[100px] h-[100px] rounded-2xl overflow-hidden border-2 border-gray-200/50 flex items-center justify-center bg-white transition duration-300">
                    <Image
                        src={imageUrl || `${STATIC_BASE_URL}/path/to/your/image.jpg`}
                        alt="Voucher Logo"
                        width={100}
                        height={100}
                        className="w-full h-full object-contain p-2 rounded-2xl"
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="relative flex-1 px-5 py-4 flex flex-col justify-between z-10">
                <div>
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-bold text-gray-800 transition-colors duration-200">
                            {formattedDiscount}
                        </h3>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {condition}
                    </p>

                    {code && (
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Mã:</span>
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 border border-dashed border-gray-300">
                                <span className="text-sm font-mono font-semibold text-gray-700">{code}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>HSD: {expiry}</span>
                    </div>

                    {isSaved ? (
                        <div className="flex items-center space-x-1 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Đã lưu vào giỏ hàng</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => onSave?.(id)}
                            className="group/btn relative inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
                        >
                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Lưu voucher</span>

                            {/* Button Glow (nhẹ, không bóng) */}
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-200" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
