import { STATIC_BASE_URL } from "@/utils/api";
import { OrderStatus, ShippingStatus } from "./oder";

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

export const translateOrderStatus = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.Pending:
            return "Đang chờ";
        case OrderStatus.OrderConfirmation:
            return "Đang xác nhận";
        case OrderStatus.Shipped:
            return "Đang giao";
        case OrderStatus.Delivered:
            return "Đã giao";
        case OrderStatus.Canceled:
            return "Đã hủy";
        default:
            return status;
    }
};

export const translateShippingStatus = (status: ShippingStatus): string => {
    switch (status) {
        case ShippingStatus.Pending:
            return "Chờ giao";
        case ShippingStatus.Shipping:
            return "Đang giao";
        case ShippingStatus.Delivered:
            return "Đã giao";
        case ShippingStatus.Failed:
            return "Thất bại";
        default:
            return status;
    }
};

export const groupByShop = (orderDetails: any[]): Record<number, any[]> => {
    const grouped: Record<number, any[]> = {};
    orderDetails.forEach((detail) => {
        if (!detail.product || detail.product.shop_id === undefined) return;
        const shopId = detail.product.shop_id;
        if (!grouped[shopId]) {
            grouped[shopId] = [];
        }
        grouped[shopId].push(detail);
    });
    return grouped;
};
