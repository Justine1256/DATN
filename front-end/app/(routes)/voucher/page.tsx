"use client";
import React from "react";
import VoucherList from "@/app/components/voucher/VoucherList";
import VoucherByCategory from "@/app/components/voucher/VoucherByCategory";
import Image from "next/image";

export default function Page() {
    return (
        <>
            {/* Nền hồng nhạt toàn trang */}
            <div className="fixed inset-0 bg-[#fde8e8] -z-10" />

            <div className="relative flex flex-col items-center min-h-screen w-full px-4 py-10">
                {/* Banner */}
                <div className="w-full max-w-[1170px] h-[344px] md:h-[236px] lg:h-[344px] overflow-hidden rounded-2xl shadow-lg mb-16">
                    <Image
                        src="/voucher-banner.jpg"
                        alt="Banner Hot Coupon"
                        width={1170} // Set the width of the image
                        height={344} // Set the height of the image
                        className="w-full h-full object-cover"
                    />

                </div>
                {/* Danh sách mã giảm giá chính */}
                <div className="w-full max-w-[1170px]">
                    <VoucherList />
                </div>

              


                {/* Voucher theo danh mục */}
                <div className="w-full max-w-[1170px] px-4">
                    <VoucherByCategory />
                </div>
            </div>
        </>
    );
}
