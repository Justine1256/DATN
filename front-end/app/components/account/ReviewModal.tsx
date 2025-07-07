'use client';

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
    image?: File | null;
    submitting: boolean;
}

export default function ReviewModal({ order, isVisible, onClose }: ReviewModalProps) {
    const [reviews, setReviews] = useState<Record<number, ReviewState>>({});
    const [popup, setPopup] = useState<{ type: "success" | "error", message: string } | null>(null);

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

const handleSubmit = async (orderDetailId: number) => {
    const review = reviews[orderDetailId];

    if (!review?.rating || review.rating < 1) {
        showPopup("error", "Vui lòng chọn ít nhất 1 sao.");
        return;
    }

    if (!review?.comment || review.comment.length < 10) {
        showPopup("error", "Vui lòng nhập ít nhất 10 ký tự.");
        return;
    }

    handleChange(orderDetailId, "submitting", true);

    try {
        const token = Cookies.get("authToken");
        let imageUrl: string | null = null;

        // Nếu có file ảnh thì upload trước
        if (review.image) {
            const imageFormData = new FormData();
            imageFormData.append("image", review.image);

            const uploadRes = await axios.post(`${API_BASE_URL}/upload-review-image`, imageFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            imageUrl = uploadRes.data.url;
        }

        // Gửi đánh giá
        const payload = {
            order_detail_id: orderDetailId,
            comment: review.comment,
            rating: review.rating,
            image: imageUrl, // có thể null
        };

        const res = await axios.post(`${API_BASE_URL}/reviews`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        showPopup("success", "Gửi đánh giá thành công!");
        setReviews(prev => ({
            ...prev,
            [orderDetailId]: { rating: 0, comment: "", image: null, submitting: false }
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
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4 overflow-y-auto">
                <div className="bg-white p-6 rounded-lg max-w-xl w-full">
                    <h2 className="text-xl font-bold mb-4">Đánh Giá Sản Phẩm</h2>

                    {order.order_details.map(detail => {
                        const review = reviews[detail.id] || { rating: 0, comment: "", image: null, submitting: false };

                        return (
                            <div key={detail.id} className="border p-4 rounded mb-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <Image
                                        src={formatImageUrl(detail.product.image)}
                                        alt={detail.product.name}
                                        width={60}
                                        height={60}
                                        className="rounded border"
                                    />
                                    <div>
                                        <h4 className="font-medium">{detail.product.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            {detail.product.value1} {detail.product.value2}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <p className="font-medium">Chất lượng sản phẩm</p>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => handleChange(detail.id, "rating", star)}
                                            className={`text-2xl transition ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                        >★</button>
                                    ))}
                                </div>

                                <textarea
                                    rows={3}
                                    className="w-full border p-2 rounded mb-2"
                                    placeholder="Nhận xét của bạn"
                                    value={review.comment}
                                    onChange={(e) => handleChange(detail.id, "comment", e.target.value)}
                                />

                                <div className="mb-2">
                                    <label className="cursor-pointer inline-block px-4 py-2 border rounded hover:bg-gray-50">
                                        + Thêm hình ảnh
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleChange(detail.id, "image", e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                    {review.image && (
                                        <div className="mt-1 text-sm text-gray-600">
                                            Đã chọn: {review.image.name}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSubmit(detail.id)}
                                    disabled={review.submitting}
                                    className={`px-4 py-2 bg-red-500 text-white rounded ${review.submitting ? "opacity-50" : ""}`}
                                >
                                    {review.submitting ? "Đang gửi..." : "Gửi đánh giá"}
                                </button>
                            </div>
                        );
                    })}

                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Đóng
                    </button>
                </div>
            </div>

            {popup && (
                <div
                    className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn
                        ${popup.type === 'success'
                            ? 'bg-white text-black border-green-500'
                            : 'bg-white text-red-600 border-red-500'
                        }`}
                >
                    {popup.message}
                </div>
            )}
        </>
    );
}
