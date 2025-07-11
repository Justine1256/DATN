import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

const statusLabel = {
    Pending: "Đang chờ xử lý",
    "order confirmation": "Đã xác nhận",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Canceled: "Đã hủy"
} as const;

async function getOrder(id: string) {
    try {
        console.log("🔍 Gọi API lấy order với id:", id);
        const res = await fetch(`${API_BASE_URL}/admin/order/${id}`, {
            headers: {
                "Accept": "application/json"
                // Nếu API yêu cầu token:
                // "Authorization": `Bearer ${token}`
            },
            // cache: "no-store"
        });

        console.log("⚙️ Status API:", res.status);
        const contentType = res.headers.get("content-type");
        console.log("🔍 Content-Type:", contentType);

        const text = await res.text();
        console.log("📦 Raw API response:", text);

        if (!res.ok) throw new Error("HTTP error");

        if (!contentType?.includes("application/json")) {
            console.error("🚨 Không phải JSON:", text);
            return null;
        }

        const data = JSON.parse(text);
        console.log("✅ JSON parsed:", data);
        return data;
    } catch (err) {
        console.error("❌ Lỗi getOrder:", err);
        return null;
    }
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    console.log("🆔 Nhận được params:", params);
    const order = await getOrder(params.id);

    console.log("📊 Order sau khi fetch:", order);

    if (!order) {
        console.error("🚨 Không tìm thấy order hoặc lỗi API -> notFound()");
        return notFound();
    }

    return (
        <div className="p-10 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
                Chi tiết đơn hàng #{order.id}
            </h1>

            <div className="bg-white p-6 rounded-xl shadow border space-y-4">
                <p><strong>Ngày đặt:</strong> {order.created_at}</p>
                <p><strong>Địa chỉ giao:</strong> {order.shipping_address}</p>
                <p><strong>Tổng tiền:</strong> {Number(order.final_amount).toLocaleString("vi-VN")} đ</p>
                <p><strong>Phương thức thanh toán:</strong> {order.payment_method}</p>
                <p><strong>Trạng thái thanh toán:</strong> {order.payment_status}</p>
                <p><strong>Trạng thái đơn hàng:</strong> {statusLabel[order.order_status as keyof typeof statusLabel]}</p>
                <p><strong>Trạng thái giao hàng:</strong> {order.shipping_status}</p>
            </div>
        </div>
    );
}
