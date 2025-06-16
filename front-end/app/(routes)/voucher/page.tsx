"use client";
import React from "react";
import VoucherList from "@/app/components/voucher/VoucherList";
import VoucherByCategory from "@/app/components/voucher/VoucherByCategory";

export default function Page() {
    return (
        <>
            <div className="fixed inset-0 bg-[#fde8e8] -z-10" />

            <div className="relative flex flex-col items-center min-h-screen w-full px-0 py-6">
                <div className="w-[1100px] h-[700px] overflow-hidden rounded-2xl shadow-lg">
                    <img
                        src="/shipfree.png"
                        alt="Banner Hot Coupon"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* ✅ Thay thế bằng VoucherList component */}
                <VoucherList />

                {/* Tiêu đề Voucher Danh Mục */}
                <div className="relative flex justify-center items-center mb-12 max-w-[1170px] mx-auto px-4 overflow-visible mt-20">
                    <div className="relative z-10 bg-gradient-to-r from-[#db4444] to-[#b03030] text-white font-extrabold text-[36px] px-20 py-6 rounded-full shadow-2xl tracking-wide border-[6px] border-white animate-pulse ring-2 ring-offset-2 ring-[#db4444] hover:animate-glow-slide transition duration-700">
                        Voucher Danh Mục
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                            <div className="absolute top-0 left-[-75%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 animate-glow-slide" />
                        </div>
                    </div>
                </div>

                <div className="max-w-[1170px] mx-auto px-4">
                    <VoucherByCategory />
                </div>
            </div>
        </>
    );
}
