"use client";
import Image from "next/image";
import { STATIC_BASE_URL } from "@/utils/api";

const statusLabel = {
    Pending: "Đang chờ xử lý",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Canceled: "Đã hủy"
} as const;

const shippingStatusLabel = {
    Pending: "Chờ xử lý",
    Shipping: "Đang giao",
    Delivered: "Đã giao",
    Failed: "Giao thất bại"
} as const;

const paymentStatusLabel = {
    Pending: "Chưa thanh toán",
    Paid: "Đã thanh toán",
    Failed: "Thanh toán thất bại",
    Refunded: "Đã hoàn tiền"
} as const;

export default function OrderDetailClient({ order }: { order: any }) {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
                Chi tiết đơn hàng #{order.id}
            </h1>

            {/* Buyer info */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-xl shadow border mb-8">
                <Image
                    src={order.buyer?.avatar ? `${STATIC_BASE_URL}/${order.buyer.avatar}` : "/default-avatar.png"}
                    alt={order.buyer?.name || "User"}
                    width={60}
                    height={60}
                    className="rounded-full border object-cover"
                />
                <div>
                    <div className="text-lg font-semibold">{order.buyer?.name}</div>
                    <div className="text-sm text-gray-600">{order.buyer?.email}</div>
                    <div className="text-sm text-gray-600">SĐT: {order.buyer?.phone}</div>
                    <div className="text-sm text-orange-500">Hạng: {order.buyer?.rank}</div>
                </div>
            </div>

            {/* Order info */}
            <div className="bg-white p-6 rounded-xl shadow border space-y-3 mb-8">
                <p><strong>Ngày đặt:</strong> {order.created_at}</p>
                <p><strong>Địa chỉ giao:</strong> {order.shipping_address}</p>
                <p><strong>Phương thức thanh toán:</strong> {order.payment_method}</p>
                <p><strong>Trạng thái thanh toán:</strong>
                    <span className="ml-2 font-semibold text-gray-800">
                        {paymentStatusLabel[order.payment_status as keyof typeof paymentStatusLabel] ?? order.payment_status}
                    </span>
                </p>
                <p><strong>Trạng thái đơn:</strong>
                    <span className="ml-2 font-semibold text-gray-800">
                        {statusLabel[order.order_status as keyof typeof statusLabel] ?? order.order_status}
                    </span>
                </p>
                <p><strong>Trạng thái giao hàng:</strong>
                    <span className="ml-2 font-semibold text-gray-800">
                        {shippingStatusLabel[order.shipping_status as keyof typeof shippingStatusLabel] ?? order.shipping_status}
                    </span>
                </p>
            </div>

            {/* Product list */}
            <div className="bg-white p-6 rounded-xl shadow border">
                <h2 className="text-xl font-semibold mb-4">Danh sách sản phẩm</h2>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-left">Sản phẩm</th>
                            <th className="p-3 text-center">SL</th>
                            <th className="p-3 text-right">Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.products.map((p: any, i: number) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 flex items-center gap-3">
                                    <Image
                                        src={p.image ? `${STATIC_BASE_URL}/${p.image}` : "/default-product.png"}
                                        alt={p.name}
                                        width={50}
                                        height={50}
                                        className="rounded border object-cover"
                                    />
                                    <div>{p.name}</div>
                                </td>
                                <td className="p-3 text-center">{p.quantity}</td>
                                <td className="p-3 text-right text-red-600 font-semibold">
                                    {parseFloat(p.subtotal).toLocaleString()} đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-6">
                    <div className="text-lg font-semibold text-gray-700">
                        Tổng cộng: <span className="text-2xl font-bold text-red-600">
                            {Number(order.final_amount).toLocaleString("vi-VN")} đ
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
