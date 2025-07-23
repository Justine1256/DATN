"use client";

import React from "react";
import { Eye } from "lucide-react";

interface Order {
    id: number;
    final_amount: number;
    payment_method: string;
    order_status: "Pending" | "Shipped" | "Delivered" | "Canceled";
    shipping_status: "Pending" | "Shipping" | "Delivered" | "Failed";
    shipping_address: string;
    created_at: string;
    total_products: number;
}

interface OrderTableProps {
    orders: Order[];
    onStatusChange: (id: number, status: string) => void;
    onViewDetail: (id: number) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onStatusChange, onViewDetail }) => {
    const statusConfig = {
        Pending: { label: "Đang chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
        Shipped: { label: "Đang giao hàng", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        Delivered: { label: "Đã giao hàng", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
        Canceled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    };

    const shippingConfig = {
        Pending: { label: "Chờ giao", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
        Shipping: { label: "Đang giao", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        Delivered: { label: "Đã giao", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
        Failed: { label: "Giao thất bại", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    };

    function formatDateTime(datetime: string) {
        if (!datetime) return "";
        return new Date(datetime).toLocaleString("vi-VN", {
            hour12: false,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
        });
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-4 px-3 text-left font-semibold text-gray-700 w-[8%]">Mã đơn</th>
                        <th className="py-4 px-3 text-left font-semibold text-gray-700 w-[12%]">Ngày tạo</th>
                        <th className="py-4 px-3 text-left font-semibold text-gray-700 w-[18%]">Địa chỉ</th>
                        <th className="py-4 px-3 text-right font-semibold text-gray-700 w-[12%]">Tổng tiền</th>
                        <th className="py-4 px-3 text-center font-semibold text-gray-700 w-[8%]">Số lượng</th>
                        <th className="py-4 px-3 text-center font-semibold text-gray-700 w-[10%]">Thanh toán</th>
                        <th className="py-4 px-3 text-center font-semibold text-gray-700 w-[10%]">Vận chuyển</th>
                        <th className="py-4 px-3 text-center font-semibold text-gray-700 w-[12%]">Trạng thái</th>
                        <th className="py-4 px-3 text-center font-semibold text-gray-700 w-[7%]">Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-[#fff3f3] transition-colors">
                            <td className="py-4 px-3 font-mono text-gray-900 font-medium">#{order.id}</td>
                            <td className="py-4 px-3 text-gray-900 text-xs">{formatDateTime(order.created_at)}</td>
                            <td className="py-4 px-3 text-gray-900 truncate max-w-[160px]" title={order.shipping_address}>
                                {order.shipping_address}
                            </td>
                            <td className="py-4 px-3 text-right font-semibold text-gray-900">
                                {order.final_amount.toLocaleString("vi-VN")} đ
                            </td>
                            <td className="py-4 px-3 text-center font-medium text-gray-900">
                                {order.total_products > 0 ? order.total_products : "-"}
                            </td>
                            <td className="py-4 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {order.payment_method}
                                </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                  ${shippingConfig[order.shipping_status]?.bg}
                  ${shippingConfig[order.shipping_status]?.text}
                  ${shippingConfig[order.shipping_status]?.border}`}
                                >
                                    {shippingConfig[order.shipping_status]?.label}
                                </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                                <select
                                    value={order.order_status}
                                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                                    className={`rounded-full border px-2 py-1 text-xs font-medium transition-all outline-none min-w-[100px]
                  ${statusConfig[order.order_status]?.bg}
                  ${statusConfig[order.order_status]?.text}
                  ${statusConfig[order.order_status]?.border}`}
                                >
                                    {Object.keys(statusConfig).map((status) => (
                                        <option key={status} value={status}>
                                            {statusConfig[status as keyof typeof statusConfig].label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="py-4 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onViewDetail(order.id)}
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderTable;
