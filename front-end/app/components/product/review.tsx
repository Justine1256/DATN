"use client";

import { useState, useEffect } from "react";
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

export default function ProductReviews({ productId }: { productId: number }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filter, setFilter] = useState<{ stars?: number; hasImage?: boolean }>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/reviews?product_id=${productId}`);
                let data = res.data.data ?? res.data;
                if (!Array.isArray(data)) data = [data];

                const mapped = data.map((item: any) => ({
                    id: item.id,
                    user: {
                        name: item.user?.name ?? "Unknown",
                        avatar: item.user?.avatar ?? "",
                    },
                    rating: item.rating,
                    comment: item.comment,
                    created_at: item.created_at,
                    images: convertImageToArray(item.image),
                }));

                setReviews(mapped);
                setTotalPages(res.data.last_page ?? 1);
            } catch (err: any) {
                console.error("Failed to fetch reviews:", err?.response ?? err);
            }
        };

        fetchReviews();
    }, [productId]);

    function convertImageToArray(image?: string | null): string[] {
        if (!image || image.trim() === "" || image.endsWith("/storage")) return [];
        return [image];
    }

    function getImageUrl(path?: string | null) {
        if (!path || path.trim() === "" || path.endsWith("/storage")) return "/default-avatar.png";
        if (path.startsWith("http")) return path;
        return `${STATIC_BASE_URL}/${path}`;
    }

    const filteredReviews = reviews
        .filter(r => !filter.stars || r.rating === filter.stars)
        .filter(r => !filter.hasImage || r.images.length > 0);

    console.log("===> Rendering reviews after filter:", filteredReviews);

    return (
        <div className="mt-10 mb-12">
            <div className="mb-6 pb-2 flex items-center">
                <div className="w-[10px] h-[22px] bg-[#db4444] rounded-tl-sm rounded-bl-sm mr-2" />
                <p className="font-medium text-brand text-base">Đánh giá sản phẩm</p>
            </div>
            <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-white">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => { setFilter({}); setPage(1); }}
                        className={`px-5 py-2.5 rounded-lg border transition-all duration-200 font-medium text-sm ${!filter.stars && !filter.hasImage
                            ? "bg-[#db4444] text-white border-[#db4444]"
                            : "bg-white text-gray-700 hover:bg-[#db4444] hover:text-white hover:border-[#db4444]"
                            }`}
                    >
                        Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map(star => (
                        <button
                            key={star}
                            onClick={() => { setFilter({ stars: star }); setPage(1); }}
                            className={`px-5 py-2.5 rounded-lg border transition-all duration-200 font-medium text-sm ${filter.stars === star
                                ? "bg-[#db4444] text-white border-[#db4444]"
                                : "bg-white text-gray-700 hover:bg-[#db4444] hover:text-white hover:border-[#db4444]"
                                }`}
                        >
                            {star} Sao
                        </button>
                    ))}
                    <button
                        onClick={() => { setFilter({ hasImage: true }); setPage(1); }}
                        className={`px-5 py-2.5 rounded-lg border transition-all duration-200 font-medium text-sm ${filter.hasImage
                            ? "bg-[#db4444] text-white border-[#db4444]"
                            : "bg-white text-gray-700 hover:bg-[#db4444] hover:text-white hover:border-[#db4444]"
                            }`}
                    >
                        Có hình ảnh
                    </button>
                </div>

                {/* Review list */}
                <div className="space-y-4">
                    {filteredReviews.length === 0 && (
                        <div className="text-center text-gray-500 py-8">Chưa có đánh giá nào.</div>
                    )}
                    {filteredReviews.map(review => (
                        <div key={review.id} className="bg-white border rounded-xl p-6 hover:border-gray-200 transition-all">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0 bg-gray-100">
                                    <Image
                                        src={getImageUrl(review.user.avatar)}
                                        alt={review.user.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-base">{review.user.name}</h4>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {new Date(review.created_at).toLocaleDateString('vi-VN', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                {Array(5).fill(0).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`text-xl mr-1 ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}
                                    >★</span>
                                ))}
                                <span className="ml-2 text-sm text-gray-600 font-medium">
                                    {review.rating}/5
                                </span>
                            </div>
                            <p className="text-gray-700 mb-4 leading-relaxed">
                                {review.comment}
                            </p>
                            {review.images.length > 0 && (
                                <div className="flex gap-3 flex-wrap mt-4">
                                    {review.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="w-24 h-24 rounded-lg overflow-hidden border cursor-pointer"
                                            onClick={() => setLightbox({ images: review.images, index: idx })}
                                        >
                                            <img
                                                src={getImageUrl(img)}
                                                alt={`review-${idx}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center mt-8 gap-1">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 flex items-center justify-center border rounded-lg hover:bg-[#db4444] hover:text-white hover:border-[#db4444] disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex items-center px-4 py-2 mx-2 bg-gray-50 rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">
                            Trang {page} / {totalPages}
                        </span>
                    </div>
                    <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="w-10 h-10 flex items-center justify-center border rounded-lg hover:bg-[#db4444] hover:text-white hover:border-[#db4444] disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Lightbox overlay */}
            {lightbox && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-5 right-5 text-white text-3xl"
                    >✖</button>
                    <button
                        onClick={() =>
                            setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null)
                        }
                        className="absolute left-5 text-white text-4xl"
                    >&#8249;</button>
                    <img
                        src={getImageUrl(lightbox.images[lightbox.index])}
                        className="max-h-[80vh] max-w-[90vw] rounded-lg"
                        alt="Lightbox"
                    />
                    <button
                        onClick={() =>
                            setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null)
                        }
                        className="absolute right-5 text-white text-4xl"
                    >&#8250;</button>
                </div>
            )}
        </div>
    );
}
