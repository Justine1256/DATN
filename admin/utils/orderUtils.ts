export type OrderStatus = "Pending" | "Shipped" | "Delivered" | "Canceled";
export type ShippingStatus = "Pending" | "Shipping" | "Delivered" | "Failed";

export const statusConfig = {
    Pending: {
        label: "Đang chờ xử lý",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
    },
    Shipped: {
        label: "Đang giao hàng",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
    },
    Delivered: {
        label: "Đã giao hàng",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
    },
    Canceled: {
        label: "Đã hủy",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
    },
} as const;

export const shippingConfig = {
    Pending: {
        label: "Chờ giao",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
    },
    Shipping: {
        label: "Đang giao",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
    },
    Delivered: {
        label: "Đã giao",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
    },
    Failed: {
        label: "Giao thất bại",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
    },
} as const;

export function formatDateTime(datetime: string) {
    if (!datetime) return "";
    return new Date(datetime).toLocaleString("vi-VN", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}