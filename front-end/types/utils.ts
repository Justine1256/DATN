// utils.ts
import { STATIC_BASE_URL } from "@/utils/api";
import { OrderDetail } from "./oder";

// Hàm format URL hình ảnh
export const formatImageUrl = (img: unknown): string => {
    if (Array.isArray(img)) img = img[0];
    if (typeof img !== "string" || !img.trim()) {
        return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith("http")) return img;
    return img.startsWith("/")
        ? `${STATIC_BASE_URL}${img}`
        : `${STATIC_BASE_URL}/${img}`;
};

// Định nghĩa màu sắc trạng thái
export const statusColors: Record<string, string> = {
    processing: "bg-yellow-200 text-yellow-800", // Đang xử lý
    shipping: "bg-blue-200 text-blue-800", // Đang giao
    delivered: "bg-green-200 text-green-800", // Đã giao
    canceled: "bg-red-200 text-red-800", // Đã hủy
    pending: "bg-gray-200 text-gray-800", // Đang chờ xử lý (nếu có)
};

// Hàm dịch trạng thái sang tiếng Việt
export const translateOrderStatus = (status: string): string => {
    switch (status.toLowerCase()) {
        case "processing":
            return "Đang xử lý";
        case "shipping":
            return "Đang giao";
        case "delivered":
            return "Đã giao";
        case "canceled":
            return "Đã hủy";
        case "pending":
            return "Đang chờ";
        default:
            return status;
    }
};

// Group order details by shop id
export const groupByShop = (orderDetails: OrderDetail[]) => {
    const grouped: Record<number, OrderDetail[]> = {};
    orderDetails.forEach((detail) => {
        if (!grouped[detail.product.shop_id]) {
            grouped[detail.product.shop_id] = [];
        }
        grouped[detail.product.shop_id].push(detail);
    });
    return grouped;
};