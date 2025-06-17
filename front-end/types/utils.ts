import { STATIC_BASE_URL } from "@/utils/api"; // Đảm bảo STATIC_BASE_URL đã được định nghĩa
import { OrderStatus, ShippingStatus } from "./oder"; // Import các enum từ types.ts

// Hàm xử lý URL ảnh sản phẩm
export const formatImageUrl = (img: unknown): string => {
    // Nếu img là mảng, lấy phần tử đầu tiên
    if (Array.isArray(img)) img = img[0];

    // Kiểm tra xem img có phải là chuỗi hợp lệ không
    if (typeof img !== "string" || !img.trim()) {
        // Trả về ảnh mặc định nếu không có ảnh hợp lệ
        return `${STATIC_BASE_URL}/products/default-product.png`;
    }

    // Nếu img bắt đầu với http, có nghĩa là nó là URL hợp lệ
    if (img.startsWith("http")) return img;

    // Nếu img là đường dẫn tương đối (bắt đầu với /), thêm STATIC_BASE_URL
    return img.startsWith("/")
        ? `${STATIC_BASE_URL}${img}`
        : `${STATIC_BASE_URL}/${img}`;
};

// Màu sắc trạng thái đơn hàng
export const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.Processing]: "bg-yellow-200 text-yellow-800",  // Đang xử lý
    [OrderStatus.Shipping]: "bg-blue-200 text-blue-800",      // Đang giao
    [OrderStatus.Delivered]: "bg-green-200 text-green-800",   // Đã giao
    [OrderStatus.Canceled]: "bg-red-200 text-red-800",        // Đã hủy
    [OrderStatus.Pending]: "bg-gray-200 text-gray-800"         // Đang chờ
};

// Màu sắc trạng thái giao hàng
export const shippingStatusColors: Record<ShippingStatus, string> = {
    [ShippingStatus.Pending]: "bg-gray-200 text-gray-800",
    [ShippingStatus.Preparing]: "bg-yellow-200 text-yellow-800",
    [ShippingStatus.Shipping]: "bg-blue-200 text-blue-800",
    [ShippingStatus.Delivered]: "bg-green-200 text-green-800",
    [ShippingStatus.Failed]: "bg-red-200 text-red-800",
    [ShippingStatus.Returned]: "bg-purple-200 text-purple-800",
};

// Hàm dịch trạng thái đơn hàng sang tiếng Việt
export const translateOrderStatus = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.Processing:
            return "Đang xử lý";
        case OrderStatus.Shipping:
            return "Đang giao";
        case OrderStatus.Delivered:
            return "Đã giao";
        case OrderStatus.Canceled:
            return "Đã hủy";
        case OrderStatus.Pending:
            return "Đang chờ";
        default:
            return status;
    }
};

// Hàm dịch trạng thái giao hàng sang tiếng Việt
export const translateShippingStatus = (status: ShippingStatus): string => {
    switch (status) {
        case ShippingStatus.Pending:
            return "Chờ xử lý";
        case ShippingStatus.Preparing:
            return "Đang chuẩn bị";
        case ShippingStatus.Shipping:
            return "Đang giao";
        case ShippingStatus.Delivered:
            return "Đã giao";
        case ShippingStatus.Failed:
            return "Giao thất bại";
        case ShippingStatus.Returned:
            return "Đã trả lại";
        default:
            return status;
    }
};

// Hàm nhóm các chi tiết đơn hàng theo cửa hàng
export const groupByShop = (orderDetails: any[]): Record<number, any[]> => {
    const grouped: Record<number, any[]> = {};
    orderDetails.forEach((detail) => {
        if (!grouped[detail.product.shop_id]) {
            grouped[detail.product.shop_id] = [];
        }
        grouped[detail.product.shop_id].push(detail);
    });
    return grouped;
};
