"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

interface Review {
    id: number;
    user: { name: string; avatar?: string };
    rating: number;
    comment: string;
    created_at: string;
    images: string[];
}

const PER_PAGE = 6; // mỗi trang 6 đánh giá

export default function ProductReviews({ productId }: { productId: number }) {
    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<{ stars?: number; hasImage?: boolean; hasComment?: boolean }>({});
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

    // ---- Fetch toàn bộ review (loop qua các trang nếu API có phân trang) ----
    useEffect(() => {
        const fetchAll = async () => {
            const acc: Review[] = [];
            let cur = 1;
            let last = 1;

            // Lặp tới khi hết trang (hỗ trợ kiểu Laravel: current_page/last_page)
            do {
                const res = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`, { params: { page: cur } });
                const payload = res.data;
                last = payload?.last_page ?? payload?.meta?.last_page ?? 1;

                let raw = payload?.data ?? payload?.reviews ?? payload ?? [];
                if (!Array.isArray(raw)) raw = Array.isArray(raw?.data) ? raw.data : [];

                const mapped: Review[] = raw.map((item: any) => ({
                    id: item.id,
                    user: { name: item.user?.name ?? "Unknown", avatar: item.user?.avatar ?? "" },
                    rating: item.rating,
                    comment: item.comment,
                    created_at: item.created_at,
                    images: item.images ?? [],
                }));

                acc.push(...mapped);
                cur += 1;

                // nếu API trả thẳng mảng không có phân trang -> thoát sau lượt đầu
                if (!payload?.last_page && !payload?.meta?.last_page) break;
            } while (cur <= last);

            setAllReviews(acc);
            setPage(1); // về trang đầu
        };

        fetchAll();
    }, [productId]);

    const getImageUrl = (path?: string | null) => {
        if (!path || path.trim() === "" || path.endsWith("/storage")) return "/default-avatar.png";
        if (path.startsWith("http")) return path;
        return `${STATIC_BASE_URL}/${path}`;
    };

    // ---- Lọc trên toàn bộ dữ liệu ----
    const filteredAll = useMemo(() => {
        return allReviews
            .filter((r) => !filter.stars || r.rating === filter.stars)
            .filter((r) => !filter.hasImage || r.images.length > 0)
            .filter((r) => !filter.hasComment || (r.comment && r.comment.trim().length > 0));
    }, [allReviews, filter]);

    // Khi đổi bộ lọc -> quay lại trang 1
    useEffect(() => {
        setPage(1);
    }, [filter]);

    // ---- Tính các thống kê sao dựa trên toàn bộ dữ liệu đã fetch ----
    const stats = useMemo(() => {
        const total = allReviews.length;
        if (total === 0) return { average: 0, distribution: [0, 0, 0, 0, 0], total: 0, withImages: 0 };

        const dist = [0, 0, 0, 0, 0];
        let sum = 0;
        let withImages = 0;

        allReviews.forEach((r) => {
            sum += r.rating;
            dist[r.rating - 1]++;
            if (r.images.length > 0) withImages++;
        });

        return { average: sum / total, distribution: dist.reverse(), total, withImages };
    }, [allReviews]);

    // ---- Phân trang ở FE ----
    const totalPages = Math.max(1, Math.ceil(filteredAll.length / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const currentPageReviews = filteredAll.slice(start, start + PER_PAGE);

    return (
        <div className="mt-10 mb-12">
            {/* Title */}
            <div className="mb-6 pb-2 flex items-center">
                <div className="w-[10px] h-[22px] bg-[#db4444] rounded-tl-sm rounded-bl-sm mr-2" />
                <p className="font-medium text-[#db4444] text-base">ĐÁNH GIÁ SẢN PHẨM</p>
            </div>

            {/* Rating Overview + Filter */}
            {stats.total > 0 && (
                <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 flex-wrap">
                        {/* Trung bình sao */}
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold text-[#db4444]">{stats.average.toFixed(1)}</span>
                            <span className="text-gray-600">trên 5</span>
                            <div className="flex items-center">
                                {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <span key={i} className={`text-xl ${i < Math.floor(stats.average) ? "text-yellow-400" : "text-gray-200"}`}>
                                            ★
                                        </span>
                                    ))}
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setFilter({})}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!filter.stars && !filter.hasImage && !filter.hasComment
                                        ? "bg-[#db4444] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-[#db4444] hover:text-white"
                                    }`}
                            >
                                Tất Cả
                            </button>
                            {[5, 4, 3, 2, 1].map((star, index) => (
                                <button
                                    key={star}
                                    onClick={() => setFilter({ stars: star })}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter.stars === star ? "bg-[#db4444] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#db4444] hover:text-white"
                                        }`}
                                >
                                    {star} Sao ({stats.distribution[index] || 0})
                                </button>
                            ))}
                            <button
                                onClick={() => setFilter({ hasImage: true })}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter.hasImage ? "bg-[#db4444] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#db4444] hover:text-white"
                                    }`}
                            >
                                Có Hình Ảnh ({allReviews.filter((r) => r.images.length > 0).length})
                            </button>
                            <button
                                onClick={() => setFilter({ hasComment: true })}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter.hasComment ? "bg-[#db4444] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#db4444] hover:text-white"
                                    }`}
                            >
                                Có Bình Luận ({allReviews.filter((r) => r.comment?.trim().length > 0).length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="bg-white rounded-lg p-6">
                <div className="space-y-6">
                    {currentPageReviews.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                            <p className="text-lg">Chưa có đánh giá nào.</p>
                        </div>
                    )}

                    {currentPageReviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-6 transition-all hover:bg-gray-100">
                            {/* User */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                    <Image
                                        src={getImageUrl(review.user.avatar)}
                                        alt={review.user.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-base truncate">{review.user.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center">
                                            {Array(5)
                                                .fill(0)
                                                .map((_, i) => (
                                                    <span key={i} className={`text-lg ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                                                        ★
                                                    </span>
                                                ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString("vi-VN", { year: "numeric", month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

                            {/* Images */}
                            {review.images.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {review.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setLightbox({ images: review.images, index: idx })}
                                        >
                                            <img src={getImageUrl(img)} alt={`review-${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination (FE) */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-[#db4444] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center px-4 py-2 mx-3 bg-gray-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                Trang {page} / {totalPages}
                            </span>
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-[#db4444] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
                    <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 text-white text-4xl hover:scale-110 transition-transform z-10">
                        ×
                    </button>

                    <button
                        onClick={() =>
                            setLightbox((prev) => (prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null))
                        }
                        className="absolute left-6 text-white text-5xl hover:scale-110 transition-transform z-10"
                    >
                        ‹
                    </button>

                    <img src={getImageUrl(lightbox.images[lightbox.index])} className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain" alt="Lightbox" />

                    <button
                        onClick={() => setLightbox((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null))}
                        className="absolute right-6 text-white text-5xl hover:scale-110 transition-transform z-10"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
