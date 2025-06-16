import VoucherShipCard from "@/app/components/voucher/VoucherCard";
import VoucherByCategory from "@/app/components/voucher/VoucherByCategory"; // 👈 Thêm dòng này

const vouchers = [
    {
        id: 1,
        imageUrl: "/ship.jpg",
        discountText: "Giảm 20%",
        condition: "Đơn từ 100.000đ",
        expiry: "12/07/2025",
        maxDiscount: "Tối đa 50.000đ",
        usageLimit: "Giới hạn: 100 lượt",
        code: "FREESHIPALL",
    },
    {
        id: 2,
        imageUrl: "/ship.jpg",
        discountText: "Giảm 30.000đ",
        condition: "Đơn từ 150.000đ",
        expiry: "15/07/2025",
        usageLimit: "Giới hạn: 50 lượt",
        code: "USER30K",
    },
    {
        id: 3,
        imageUrl: "/ship.jpg",
        discountText: "Giảm 15%",
        condition: "Đơn từ 200.000đ",
        expiry: "18/07/2025",
        maxDiscount: "Tối đa 40.000đ",
        usageLimit: "Giới hạn: 80 lượt",
        code: "SALE15",
    },
    {
        id: 4,
        imageUrl: "/ship.jpg",
        discountText: "Giảm 10%",
        condition: "Không giới hạn đơn hàng",
        expiry: "20/07/2025",
        maxDiscount: "Tối đa 20.000đ",
        usageLimit: "Giới hạn: 200 lượt",
        code: "ALLUSER",
    },
];

export default function Page() {
    return (
        <>
            {/* Nền toàn trang */}
            <div className="fixed inset-0 bg-[#fde8e8] -z-10" />

            <div className="relative flex flex-col items-center min-h-screen w-full px-0 py-6">
                {/* Banner */}
                <div className="w-[1100px] h-[700px] overflow-hidden rounded-2xl shadow-lg">
                    <img
                        src="/shipfree.png"
                        alt="Banner Hot Coupon"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Danh sách voucher dạng thẻ */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vouchers.map((voucher) => (
                        <VoucherShipCard key={voucher.id} voucher={voucher} />
                    ))}
                </div>
                {/* Banner */}
               
                <div className="relative flex justify-center items-center mb-12 max-w-[1170px] mx-auto px-4 overflow-visible mt-20">
                    {/* Nút trung tâm có hiệu ứng glow + rung */}
                    <div
                        className="relative z-10 bg-gradient-to-r from-[#db4444] to-[#b03030] text-white font-extrabold text-[36px] px-20 py-6 rounded-full shadow-2xl tracking-wide border-[6px] border-white
    animate-pulse ring-2 ring-offset-2 ring-[#db4444] hover:animate-glow-slide transition duration-700"
                    >
                        Voucher Danh Mục

                        {/* ✅ Ánh sáng quét ngang dịu nhẹ */}
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                            <div className="absolute top-0 left-[-75%] w-[150%] h-full 
    bg-gradient-to-r from-transparent via-white/5 to-transparent 
    transform rotate-12 animate-glow-slide" />
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
