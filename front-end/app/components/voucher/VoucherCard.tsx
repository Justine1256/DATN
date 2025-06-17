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
    isSaved: boolean;
}

export default function VoucherShipCard({
    voucher,
    onSave,
}: {
    voucher: VoucherShip;
    onSave?: (voucherId: number) => void;
}) {
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
        isSaved,
    } = voucher;

    const formattedDiscount =
        discountText ||
        (discount_value > 0
            ? `Giảm ${discount_value.toLocaleString()}${discount_type === 'percent' ? '%' : 'đ'}`
            : 'Miễn phí vận chuyển');

    return (
        <div className="group relative flex w-full max-w-[720px] h-[140px] rounded-2xl overflow-hidden bg-gradient-to-r from-white via-white to-gray-50 shadow-lg border border-gray-200/50 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 hover:-translate-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-orange-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-100/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-[130px] w-24 h-24 bg-gradient-to-tr from-orange-100/20 to-transparent rounded-full translate-y-12 -translate-x-12" />

            {/* Perforated Edge */}
            <div className="absolute left-[130px] top-0 w-[16px] h-[10px] rounded-b-full bg-gray-50 -translate-x-1/2 z-20" />
            <div className="absolute left-[130px] bottom-0 w-[16px] h-[10px] rounded-t-full bg-gray-50 -translate-x-1/2 z-20" />

            {/* Dashed Line */}
            <div className="absolute top-3 bottom-3 left-[130px] w-px z-20">
                <div className="w-full h-full border-l-2 border-dashed border-gray-300/60" />
            </div>

            {/* Logo Section */}
            <div className="relative flex items-center justify-center w-[130px] h-full bg-gradient-to-br from-white to-gray-50/50">
                <div className="w-[100px] h-[100px] rounded-xl overflow-hidden border-2 border-gray-200/50 flex items-center justify-center bg-white shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <Image
                        src={imageUrl || `${STATIC_BASE_URL}/path/to/your/image.jpg`}
                        alt="Voucher Logo"
                        width={100}
                        height={100}
                        className="w-full h-full object-contain p-2"
                    />
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content Section */}
            <div className="relative flex-1 px-5 py-4 flex flex-col justify-between z-10">
                <div className="space-y-2">
                    {/* Discount Amount */}
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors duration-200">
                            {formattedDiscount}
                        </h3>
                        {discount_type === 'percent' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                %
                            </span>
                        )}
                    </div>

                    {/* Condition */}
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {condition}
                    </p>

                    {/* Code */}
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

                    {/* Save Button */}
                    {isSaved ? (
                        <div className="flex items-center space-x-1 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Đã lưu</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => onSave?.(id)}
                            className="group/btn relative inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 active:scale-95"
                        >
                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Lưu voucher</span>

                            {/* Button Glow */}
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-200" />
                        </button>
                    )}
                </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
        </div>
    );
}