"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Order } from "../../../types/oder";
import { formatImageUrl } from "../../../types/utils";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

interface ReviewModalProps {
    order: Order;
    isVisible: boolean;
    onClose: () => void;
}

interface ReviewState {
    rating: number;
    comment: string;
    images?: File[];
    submitting: boolean;
}

export default function ReviewModal({ order, isVisible, onClose }: ReviewModalProps) {
    const [reviews, setReviews] = useState<Record<number, ReviewState>>({});
    const [popup, setPopup] = useState<{ type: "success" | "error", message: string } | null>(null);
    const [lightbox, setLightbox] = useState<{ images: File[], index: number } | null>(null);

    if (!isVisible) return null;

    const handleChange = (orderDetailId: number, field: keyof ReviewState, value: any) => {
        setReviews(prev => ({
            ...prev,
            [orderDetailId]: {
                ...prev[orderDetailId],
                [field]: value
            }
        }));
    };

    const handleRemoveImage = (orderDetailId: number, idx: number) => {
        const images = reviews[orderDetailId]?.images ?? [];
        const newImages = images.filter((_, i) => i !== idx);
        handleChange(orderDetailId, "images", newImages);
    };

    const handleSubmit = async (orderDetailId: number) => {
        const review = reviews[orderDetailId];
        if (!review) return;

        if (!review.rating || review.rating < 1) {
            showPopup("error", "Vui lòng chọn ít nhất 1 sao.");
            return;
        }

        if (!review.comment || review.comment.length < 10) {
            showPopup("error", "Vui lòng nhập ít nhất 10 ký tự.");
            return;
        }

        handleChange(orderDetailId, "submitting", true);

        try {
            const token = Cookies.get("authToken");
            let uploadedImages: string[] = [];

            if (review.images && review.images.length > 0) {
                const uploadPromises = review.images.map(file => {
                    const formData = new FormData();
                    formData.append("image", file);

                    return axios.post(`${API_BASE_URL}/upload-review-image`, formData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        transformRequest: [(data, headers) => {
                            delete headers['Content-Type'];
                            return data;
                        }],
                    });
                });

                const uploadResults = await Promise.all(uploadPromises);
                uploadedImages = uploadResults.map(res => res.data.url);
            }

            await axios.post(`${API_BASE_URL}/reviews`, {
                order_detail_id: orderDetailId,
                comment: review.comment,
                rating: review.rating,
                image: uploadedImages[0] || null, // nếu backend chỉ nhận 1 ảnh, lấy ảnh đầu tiên
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            showPopup("success", "Gửi đánh giá thành công!");

            setReviews(prev => ({
                ...prev,
                [orderDetailId]: { rating: 0, comment: "", images: [], submitting: false }
            }));

        } catch (err: any) {
            console.error("❌ Error:", err);
            const msg = err?.response?.data?.message || "Lỗi gửi đánh giá. Vui lòng thử lại!";
            showPopup("error", msg);
        } finally {
            handleChange(orderDetailId, "submitting", false);
        }
    };

    const showPopup = (type: "success" | "error", message: string) => {
        setPopup({ type, message });
        setTimeout(() => setPopup(null), 3000);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4 overflow-y-auto">
                <div className="bg-white mt-20 p-8 rounded-2xl shadow-xl max-w-xl w-full">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Đánh Giá Sản Phẩm</h2>

                    {order.order_details.map(detail => {
                        const review = reviews[detail.id] || { rating: 0, comment: "", images: [], submitting: false };

                        return (
                            <div key={detail.id} className="border rounded-lg p-5 mb-8 shadow-sm hover:shadow transition">
                                <div className="flex items-center gap-4 mb-4">
                                    <Image
                                        src={formatImageUrl(detail.product.image)}
                                        alt={detail.product.name}
                                        width={70}
                                        height={70}
                                        className="rounded-lg border"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-lg">{detail.product.name}</h4>
                                        <p className="text-sm text-gray-500">{detail.product.value1} {detail.product.value2}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="font-medium text-gray-700 mb-1">Đánh giá chất lượng:</p>
                                    <div>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => handleChange(detail.id, "rating", star)}
                                                className={`text-3xl mx-0.5 ${star <= review.rating ? "text-yellow-400" : "text-gray-300"} transition-colors`}
                                            >★</button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    rows={3}
                                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-gray-800 transition"
                                    placeholder="Nhận xét của bạn..."
                                    value={review.comment}
                                    onChange={(e) => handleChange(detail.id, "comment", e.target.value)}
                                />

                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-50 transition">
                                        + Ảnh
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    handleChange(detail.id, "images", Array.from(e.target.files));
                                                }
                                            }}
                                        />
                                    </label>

                                    {(review.images ?? []).length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {(review.images ?? []).map((img, idx) => (
                                                <div key={idx} className="relative w-16 h-16 group">
                                                    <img
                                                        src={URL.createObjectURL(img)}
                                                        alt={`selected-${idx}`}
                                                        className="object-cover w-full h-full rounded border cursor-pointer"
                                                        onClick={() => setLightbox({ images: review.images ?? [], index: idx })}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveImage(detail.id, idx)}
                                                        className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                                    >×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition w-auto"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        onClick={() => handleSubmit(detail.id)}
                                        disabled={review.submitting}
                                        className={`px-6 py-3 rounded-lg text-white transition w-auto
                                            ${review.submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#db4444] hover:bg-[#c53737]"}`}
                                    >
                                        {review.submitting ? "Đang gửi..." : "Gửi đánh giá"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {popup && (
                <div
                    className={`fixed top-20 right-5 z-[9999] px-4 py-3 rounded-lg shadow-lg border-l-4 text-sm animate-fadeIn
                        ${popup.type === 'success'
                            ? 'bg-white text-black border-green-500'
                            : 'bg-white text-red-600 border-red-500'}`}
                >
                    {popup.message}
                </div>
            )}

            {lightbox && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full">
                        <img
                            src={URL.createObjectURL(lightbox.images[lightbox.index])}
                            alt="preview"
                            className="w-full h-auto rounded shadow"
                        />
                        <button
                            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full px-2 py-1 hover:bg-opacity-80"
                            onClick={() => setLightbox(null)}
                        >
                            ×
                        </button>
                        {lightbox.index > 0 && (
                            <button
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                                onClick={() => setLightbox({ ...lightbox, index: lightbox.index - 1 })}
                            >‹</button>
                        )}
                        {lightbox.index < lightbox.images.length - 1 && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                                onClick={() => setLightbox({ ...lightbox, index: lightbox.index + 1 })}
                            >›</button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
