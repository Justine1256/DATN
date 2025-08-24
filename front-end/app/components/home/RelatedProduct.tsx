"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard, { Product } from "../product/ProductCard";
import { API_BASE_URL } from "@/utils/api";

export default function BestSellingSlider() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        fetch(`${API_BASE_URL}/bestsellingproducts`)
            .then((res) => res.json())
            .then((data) => {
                console.log("📦 API bestsellingproducts trả về:", data); // Log toàn bộ dữ liệu
                const list = Array.isArray(data) ? data : data.products || [];
                console.log("📋 Danh sách sản phẩm sau khi xử lý:", list); // Log mảng sau khi lọc
                setProducts(list);
            })
            .catch((err) => {
                console.error("❌ Lỗi khi fetch sản phẩm:", err);
                setProducts([]);
            })
            .finally(() => setLoading(false));
    }, []);


    // 👇 Nút điều hướng trượt mượt
    const handlePrev = () => {
        sliderRef.current?.scrollBy({ left: -sliderRef.current.clientWidth, behavior: "smooth" });
    };
    const handleNext = () => {
        sliderRef.current?.scrollBy({ left: sliderRef.current.clientWidth, behavior: "smooth" });
    };

    // 👇 Kéo chuột
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        isDragging.current = true;
        sliderRef.current?.classList.add("cursor-grabbing");
        startX.current = e.pageX - sliderRef.current!.offsetLeft;
        scrollLeft.current = sliderRef.current!.scrollLeft;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        sliderRef.current?.classList.remove("cursor-grabbing");
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        sliderRef.current?.classList.remove("cursor-grabbing");
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current!.offsetLeft;
        const walk = (x - startX.current) * 1.2;
        sliderRef.current!.scrollLeft = scrollLeft.current - walk;
    };

    if (!mounted) return null;

    return (
        <section className="bg-white pt-10 pb-6">
            <div className="max-w-[1170px] mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="border-t border-gray-200 mb-6" />
                    <div className="flex items-center justify-between gap-2 md:gap-10 mb-6">
                        <div className="flex flex-col justify-center !mr-6">
                            <div className="flex items-center gap-2">
                                <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm" />
                                <p className="text-brand font-semibold text-sm">Gợi ý cho bạn</p>
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-1 sm:mt-2">Sản phẩm liên quan</h2>
                        </div>
                        <button
                            onClick={() => router.push("/category")}
                            className="text-brand border border-brand hover:bg-brand hover:text-white font-medium text-sm py-1 px-2 sm:py-2.5 sm:px-4 rounded-md transition duration-300 w-fit mt-4"
                        >
                            Xem tất cả
                        </button>
                    </div>
                </div>

                {/* Slider */}
                <div className="relative">
                    {/* Nút trái */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white text-black border border-gray-300 p-2 rounded-full shadow transition-colors hover:bg-brand hover:text-white"
                    >
                        &lt;
                    </button>

                    {/* Slider chính */}
                    <div
                        ref={sliderRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar cursor-grab select-none"
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onMouseMove={handleMouseMove}
                    >
                        {(loading ? Array(8).fill(0) : products).map((product, index) => (
                            <div
                                key={index}
                                className="
                      px-2 box-border flex-shrink-0 
                      min-w-[calc(100%-8px)] 
                      sm:min-w-[calc(50%-12px)] 
                      md:min-w-[calc(33.3333%-12px)] 
                      lg:min-w-[calc(25%-12px)]
                    "
                            >
                                <ProductCard product={!loading ? product : undefined} />
                            </div>
                        ))}
                    </div>

                    {/* Nút phải */}
                    <button
                        onClick={handleNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white text-black border border-gray-300 p-2 rounded-full shadow transition-colors hover:bg-brand hover:text-white"
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </section>
    );
}
