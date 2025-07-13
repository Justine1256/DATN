"use client";
import { useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";

export default function OrderStatusProgress({ order, setOrder }: { order: any, setOrder: (o: any) => void }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = async (newStatus: "Delivered" | "Canceled") => {
        setIsUpdating(true);
        try {
            const shippingMap = {
                Pending: "Pending",
                Shipped: "Shipping",
                Delivered: "Delivered",
                Canceled: "Failed",
            };
            const shipping_status = shippingMap[newStatus];
            const token = Cookies.get("authToken");

            await fetch(`${API_BASE_URL}/orders/${order.id}/status`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    order_status: newStatus,
                    shipping_status,
                }),
            });

            setOrder({ ...order, order_status: newStatus, shipping_status });
        } catch (err) {
            console.error("🚨 Failed to update order status:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const steps = [
        { label: "Xác nhận đơn hàng", done: true },
        { label: "Đang chờ thanh toán", done: order.payment_status === "Paid" },
        { label: "Xử lý", done: order.order_status !== "Pending" },
        { label: "Vận chuyển", done: order.order_status === "Shipped" || order.order_status === "Delivered" },
        { label: "Đã giao hàng", done: order.order_status === "Delivered" },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow border space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold">#{order.id}</div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleUpdateStatus("Delivered")}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Đã giao
                    </button>
                    <button
                        onClick={() => handleUpdateStatus("Canceled")}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Hủy
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                        <div
                            className={`h-2 w-full rounded-full mb-2 ${step.done ? "bg-green-400" : "bg-gray-200"}`}
                            style={{ backgroundImage: step.done ? "repeating-linear-gradient(45deg, #22c55e, #22c55e 10px, #4ade80 10px, #4ade80 20px)" : "" }}
                        ></div>
                        <div className={`text-sm font-medium ${step.done ? "text-green-700" : "text-gray-400"}`}>
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
