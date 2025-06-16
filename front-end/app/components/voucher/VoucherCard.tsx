"use client";
import React from "react";

export interface VoucherShip {
    id: number;
    discountText: string; // Giảm 20%
    condition: string; // Đơn từ 100K
    expiry: string; // HSD
    maxDiscount?: string;
    usageLimit?: string;
    imageUrl: string; // bổ sung nếu chưa có
}

export default function VoucherShipCard({ voucher }: { voucher: VoucherShip }) {
    return (
        <div className="relative flex w-[540px] h-[130px] rounded-2xl overflow-hidden bg-white shadow-md">
            {/* CẮT nửa hình tròn TRÊN và DƯỚI */}
            <div className="absolute left-[130px] top-0 w-[14px] h-[8px] rounded-b-full bg-[#f0f6fd] -translate-x-1/2 z-10" />
            <div className="absolute left-[130px] bottom-0 w-[14px] h-[8px] rounded-t-full bg-[#f0f6fd] -translate-x-1/2 z-10" />

            {/* ĐƯỜNG KẺ đứt dọc */}
            <div className="absolute top-2 bottom-2 left-[130px] w-px border-l border-dashed border-gray-300 z-10" />

            {/* VÙNG TRÁI - logo */}
            <div className="flex items-center justify-center w-[130px] h-full bg-white">
                <div className="w-[114px] h-[114px] rounded-md overflow-hidden shadow-sm bg-white border border-gray-200 flex items-center justify-center">
                    <img
                        src={voucher.imageUrl}
                        alt="logo"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* VÙNG PHẢI - thông tin & nút */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
                <div>
                    <div className="text-base font-semibold text-gray-900">{voucher.discountText}</div>
                    <div className="text-sm text-gray-600 mt-1">{voucher.condition}</div>
                </div>

                {/* ✅ HSD + Nút Lưu cùng hàng */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">HSD: {voucher.expiry}</span>
                    <button className="bg-[#db4444] hover:bg-red-600 text-white text-sm px-4 py-1 rounded">
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
