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

export default function ReviewModal({ order, isVisible, onClose }: ReviewModalProps) {
    const [reviewContent, setReviewContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const [showPopup, setShowPopup] = useState(false);
    const [popupType, setPopupType] = useState<"success" | "error">("success");
    const [popupMessage, setPopupMessage] = useState("");

    if (!isVisible) return null;

    const handleSubmit = async () => {
        if (rating < 1) {
            setPopupType("error");
            setPopupMessage("Vui lòng chọn ít nhất 1 sao.");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
            return;
        }

        if (reviewContent.length < 10) {
            setPopupType("error");
            setPopupMessage("Vui lòng nhập ít nhất 10 ký tự.");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
            return;
        }

        setSubmitting(true);
        try {
            const token = Cookies.get("authToken");
            console.log("🚀 Token:", token);

            await Promise.all(order.order_details.map(async (detail) => {
                const formData = new FormData();
                formData.append("order_detail_id", detail.id.toString());
                formData.append("comment", reviewContent);
                formData.append("rating", rating.toString());
                if (imageFile) {
                    formData.append("image", imageFile);
                }

                console.log("🔗 Sending review for order_detail_id:", detail.id, {
                    comment: reviewContent,
                    rating,
                    image: imageFile?.name
                });

                const res = await axios.post(`${API_BASE_URL}/reviews`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                console.log("✅ Review response:", res.data);
            }));

            setPopupType("success");
            setPopupMessage("Gửi đánh giá thành công!");
            setShowPopup(true);

            setReviewContent("");
            setImageFile(null);
            setRating(0);

            setTimeout(() => {
                setShowPopup(false);
                onClose();
            }, 2000);

        } catch (error) {
    console.error("❌ Lỗi khi gửi đánh giá:", error);
    console.log("⚠ response data:", error.response?.data);
            setPopupType("error");
            setPopupMessage("Lỗi gửi đánh giá. Vui lòng thử lại!");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
                <div className="bg-white p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh]">
                    <h2 className="text-xl font-bold mb-4">Đánh Giá Sản Phẩm</h2>
                    {order.order_details.map(detail => (
                        <div key={detail.id} className="flex items-center gap-4 mb-4">
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
                    ))}

                    <div className="mb-4">
                        <p className="font-medium mb-1">Chất lượng sản phẩm</p>
                        <div>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        rows={4}
                        className="w-full border p-3 rounded mb-4"
                        placeholder="Lợi ích, bao bì, kinh nghiệm..."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                    ></textarea>

                    <div className="mb-4">
                        <label className="cursor-pointer inline-block px-4 py-2 border rounded hover:bg-gray-50">
                            + Thêm hình ảnh
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </label>
                        {imageFile && (
                            <div className="mt-2 text-sm text-gray-600">
                                Đã chọn: {imageFile.name}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            className="px-5 py-2 border rounded hover:bg-gray-50"
                            onClick={onClose}
                        >
                            Trở lại
                        </button>
                        <button
                            disabled={submitting}
                            className={`px-5 py-2 bg-[#db4444] text-white rounded hover:bg-[#c13838] ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={handleSubmit}
                        >
                            {submitting ? "Đang gửi..." : "Hoàn thành"}
                        </button>
                    </div>
                </div>
            </div>

            {showPopup && (
                <div
                    className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn
                    ${popupType === 'success'
                            ? 'bg-white text-black border-green-500'
                            : 'bg-white text-red-600 border-red-500'
                        }`}
                >
                    {popupMessage}
                </div>
            )}
        </>
    );
}
