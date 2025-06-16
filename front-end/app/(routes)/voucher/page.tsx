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
                <div className="w-full max-w-[1170px] h-[400px] md:h-[500px] lg:h-[700px] overflow-hidden rounded-2xl shadow-lg mb-16">
                    <Image
                        src="/shipfree.png"
                        alt="Banner Hot Coupon"
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Danh sách mã giảm giá chính */}
                <div className="w-full max-w-[1170px]">
                    <VoucherList />
                </div>

                {/* Tiêu đề */}
                <div className="relative flex justify-center items-center mt-24 mb-12 w-full max-w-[1170px] px-4">
                    <div className="relative z-10 bg-gradient-to-r from-[#db4444] to-[#b03030] 
      text-white font-extrabold text-[32px] md:text-[36px] px-10 py-5 
      rounded-full shadow-xl tracking-wide border-[6px] border-white 
      transition duration-500 hover:brightness-110 text-center">

                        Voucher Danh Mục

                        {/* Ánh sáng quét ngang dịu */}
                        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                            <div className="absolute top-0 left-[-75%] w-[150%] h-full 
          bg-gradient-to-r from-transparent via-white/10 to-transparent 
          transform rotate-12 animate-glow-slide" />
                        </div>
                    </div>
                </div>


                {/* Voucher theo danh mục */}
                <div className="w-full max-w-[1170px] px-4">
                    <VoucherByCategory />
                </div>
            </div>
        </>
    );
}
