"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import type { UploadFile } from "antd";
import { Modal, Rate, Input, Upload, Button, message, Divider } from "antd";
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
    const [preview, setPreview] = useState<{ open: boolean; src?: string; title?: string }>(
        { open: false }
    );

    const handleChange = (orderDetailId: number, field: keyof ReviewState, value: any) => {
        setReviews((prev) => {
            const existing: ReviewState = prev[orderDetailId] ?? {
                rating: 0,
                comment: "",
                images: [],
                submitting: false,
            };

            return {
                ...prev,
                [orderDetailId]: {
                    ...existing,
                    [field]: value,
                },
            };
        });
    };

    const uploadImages = async (files: File[], token: string) => {
        const urls: string[] = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append("image", file);

            const res = await axios.post(`${API_BASE_URL}/upload-review-image`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            urls.push(...res.data.images);
        }
        return urls;
    };

    const handleSubmit = async (orderDetailId: number) => {
        const review = reviews[orderDetailId];
        if (!review?.rating || review.rating < 1) {
            message.error("Vui lòng chọn ít nhất 1 sao.");
            return;
        }
        if (!review?.comment || review.comment.trim().length < 10) {
            message.error("Vui lòng nhập ít nhất 10 ký tự.");
            return;
        }

        handleChange(orderDetailId, "submitting", true);

        try {
            const token = Cookies.get("authToken");
            if (!token) {
                message.error("Bạn chưa đăng nhập.");
                return;
            }

            let imageUrls: string[] = [];
            if (review.images && review.images.length > 0) {
                imageUrls = await uploadImages(review.images, token);
            }

            await axios.post(
                `${API_BASE_URL}/reviews`,
                {
                    order_detail_id: orderDetailId,
                    rating: review.rating,
                    comment: review.comment,
                    images: imageUrls,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            message.success("Đánh giá thành công!");

            // Reset form state for this item
            setReviews((prev) => ({
                ...prev,
                [orderDetailId]: { rating: 0, comment: "", images: [], submitting: false },
            }));

            // Tự đóng modal sau khi đánh giá thành công
            onClose();
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("❌", err);
            message.error(err?.response?.data?.message || "Lỗi gửi đánh giá.");
        } finally {
            handleChange(orderDetailId, "submitting", false);
        }
    };

    // Helpers for Ant Design Upload (controlled fileList)
    const toUploadList = (files: File[] = []): UploadFile[] => {
        return files.map((f, idx) => ({
            uid: `${idx}-${f.name}-${f.size}`,
            name: f.name,
            status: "done",
            url: URL.createObjectURL(f),
            originFileObj: f as any,
        }));
    };

    const fromUploadList = (fileList: UploadFile[]): File[] => {
        return fileList
            .map((f) => (f.originFileObj as File) || undefined)
            .filter(Boolean) as File[];
    };

    return (
        <Modal
            title={<span className="font-semibold">Đánh Giá Sản Phẩm</span>}
            open={isVisible}
            onCancel={onClose}
            footer={null}
            width={760}
            bodyStyle={{ padding: 0 }}
            destroyOnClose
        >
            {/* Scroll container to ensure 2-3 sản phẩm (hoặc nhiều hơn) đều xem được */}
            <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
                {order.order_details.map((detail, i) => {
                    const review = reviews[detail.id] || {
                        rating: 0,
                        comment: "",
                        images: [],
                        submitting: false,
                    };

                    return (
                        <div key={detail.id} className="border rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-4 mb-3">
                                <Image
                                    src={formatImageUrl(detail.product.image)}
                                    alt={detail.product.name}
                                    width={70}
                                    height={70}
                                    className="rounded-md border"
                                />
                                <div>
                                    <div className="font-medium text-base">{detail.product.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {detail.product.value1} {detail.product.value2}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="text-sm mb-1">Đánh giá chất lượng</div>
                                <Rate
                                    value={review.rating}
                                    onChange={(v) => handleChange(detail.id, "rating", v)}
                                />
                            </div>

                            <Input.TextArea
                                rows={3}
                                placeholder="Nhận xét của bạn..."
                                value={review.comment}
                                onChange={(e) => handleChange(detail.id, "comment", e.target.value)}
                            />

                            <div className="mt-3">
                                <Upload
                                    multiple
                                    listType="picture-card"
                                    fileList={toUploadList(review.images)}
                                    beforeUpload={() => false} // không upload tự động, giữ nguyên luồng gọi API hiện tại
                                    onChange={({ fileList }) => {
                                        const files = fromUploadList(fileList);
                                        handleChange(detail.id, "images", files);
                                    }}
                                    onPreview={(file) => {
                                        const src = (file.url as string) || (file.thumbUrl as string);
                                        setPreview({ open: true, src, title: file.name });
                                    }}
                                >
                                    <div className="text-sm">+ Ảnh</div>
                                </Upload>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button onClick={onClose}>Đóng</Button>
                                <Button
                                    type="primary"
                                    loading={review.submitting}
                                    onClick={() => handleSubmit(detail.id)}
                                    style={{ backgroundColor: "#db4444", borderColor: "#db4444" }}
                                >
                                    {review.submitting ? "Đang gửi..." : "Gửi đánh giá"}
                                </Button>
                            </div>

                            {i < order.order_details.length - 1 && <Divider className="!my-5" />}
                        </div>
                    );
                })}
            </div>

            {/* Preview ảnh */}
            <Modal
                open={preview.open}
                title={preview.title}
                footer={null}
                onCancel={() => setPreview({ open: false })}
            >
                {preview.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="preview" style={{ width: "100%" }} src={preview.src} />
                )}
            </Modal>
        </Modal>
    );
}
