"use client";
import React from "react";

export interface VoucherShip {
    id: number;
    discountText: string;
    condition: string;
    expiry: string;
    maxDiscount?: string;
    usageLimit?: string;
    imageUrl: string;
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
    return (
        <div className="relative flex w-full max-w-[540px] h-[130px] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200 hover:shadow-md transition duration-200">
            {/* Hình tròn cắt 2 bên */}
            <div className="absolute left-[130px] top-0 w-[14px] h-[8px] rounded-b-full bg-[#f0f6fd] -translate-x-1/2 z-10" />
            <div className="absolute left-[130px] bottom-0 w-[14px] h-[8px] rounded-t-full bg-[#f0f6fd] -translate-x-1/2 z-10" />
            <div className="absolute top-2 bottom-2 left-[130px] w-px border-l border-dashed border-gray-300 z-10" />

            {/* Bên trái - logo */}
            <div className="flex items-center justify-center w-[130px] h-full bg-white">
                <div className="w-[114px] h-[114px] rounded-md overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                    <img
                        src={voucher.imageUrl}
                        alt="logo"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Bên phải - nội dung */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
                <div>
                    <div className="text-base font-bold text-gray-800">
                        {voucher.discountText}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{voucher.condition}</div>
                    {voucher.code && (
                        <div className="text-[13px] text-gray-500 mt-1">
                            Mã: <span className="font-semibold">{voucher.code}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">HSD: {voucher.expiry}</span>
                    <button
                        onClick={() => onSave?.(voucher.id)}
                        className="bg-[#db4444] hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-md transition duration-150"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
