import { STATIC_BASE_URL } from "@/utils/api";
import { OrderDetail } from "./oder";

export type OrderStatus = "processing" | "shipping" | "delivered" | "canceled";


export type ShippingStatus = "pending" | "preparing" | "shipping" | "delivered" | "failed" | "returned";

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
export const statusColors: Record<OrderStatus, string> = {
    processing: "bg-yellow-200 text-yellow-800",  // Đang xử lý
    shipping: "bg-blue-200 text-blue-800",      // Đang giao
    delivered: "bg-green-200 text-green-800",   // Đã giao
    canceled: "bg-red-200 text-red-800",        // Đã hủy
}


export const shippingStatusColors: Record<ShippingStatus, string> = {
    pending: "bg-gray-200 text-gray-800",
    preparing: "bg-yellow-200 text-yellow-800",
    shipping: "bg-blue-200 text-blue-800",
    delivered: "bg-green-200 text-green-800",
    failed: "bg-red-200 text-red-800",
    returned: "bg-purple-200 text-purple-800",
};

export const translateOrderStatus = (status: OrderStatus): string => {
    switch (status) {
        case "processing":
            return "Đang xử lý";
        case "shipping":
            return "Đang giao";
        case "delivered":
            return "Đã giao";
        case "canceled":
            return "Đã hủy";
        default:
            return status;
    }
};



export const translateShippingStatus = (status: ShippingStatus): string => {
    switch (status) {
        case "pending":
            return "Chờ xử lý";
        case "preparing":
            return "Đang chuẩn bị";
        case "shipping":
            return "Đang giao";
        case "delivered":
            return "Đã giao";
        case "failed":
            return "Giao thất bại";
        case "returned":
            return "Đã trả lại";
        default:
            return status;
    }
};

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
