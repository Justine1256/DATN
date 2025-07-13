"use client";
import { CheckCircle, Clock, Package, Truck, Home, XCircle } from "lucide-react";
import { useState } from "react";

export default function OrderProgress({ order, setOrder }: { order: any, setOrder: (v: any) => void }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async (newStatus: "Delivered" | "Canceled") => {
        setIsLoading(true);
        try {
            // Gọi API thực tế thay thế đoạn này nếu cần
            await new Promise(resolve => setTimeout(resolve, 800));

            const shippingMap = {
                Delivered: "Delivered",
                Canceled: "Failed"
            };

            setOrder({
                ...order,
                order_status: newStatus,
                shipping_status: shippingMap[newStatus]
            });
        } catch (err) {
            console.error("🚨 Failed to update status:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        {
            label: "Xử lý",
            icon: Package,
            completed: order.order_status === "Delivered" || order.shipping_status === "Shipping" || order.shipping_status === "Delivered",
            inProgress: order.shipping_status === "Shipping",
        },
        {
            label: "Vận chuyển",
            icon: Truck,
            completed: order.shipping_status === "Delivered" || order.order_status === "Delivered",
            inProgress: order.shipping_status === "Delivered" && order.order_status !== "Delivered",
        },
        {
            label: "Đã giao hàng",
            icon: Home,
            completed: order.order_status === "Delivered",
            inProgress: false,
        }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow p-6 space-y-6">
            {/* Mã đơn + ngày */}
            <div className="flex justify-between text-sm text-gray-600">
                <div>
                    <span className="font-medium text-gray-800">Mã đơn:</span> #{order.id}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Ngày đặt:</span> {new Date(order.created_at).toLocaleString("vi-VN")}
                </div>
            </div>

            {/* Buttons */}
            {(order.order_status !== "Delivered" && order.order_status !== "Canceled") && (
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => handleStatusUpdate("Delivered")}
                        disabled={isLoading}
                        className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {isLoading ? "Đang xử lý..." : "Đã giao hàng"}
                    </button>
                    <button
                        onClick={() => handleStatusUpdate("Canceled")}
                        disabled={isLoading}
                        className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {isLoading ? "Đang xử lý..." : "Hủy đơn hàng"}
                    </button>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex justify-between items-center mt-6 relative px-2">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <div key={index} className="flex flex-col items-center relative flex-1">
                            {/* Line */}
                            {index !== 0 && (
                                <div className={`absolute top-4 -left-1/2 w-full h-1 rounded-full 
                                    ${steps[index - 1].completed ? "bg-green-500" :
                                        steps[index - 1].inProgress ? "bg-yellow-400 animate-pulse" :
                                            "bg-gray-200"}`}>
                                </div>
                            )}

                            {/* Circle */}
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2
                                ${step.completed ? "bg-green-500 text-white" :
                                    step.inProgress ? "bg-yellow-400 text-white animate-pulse" :
                                        "bg-gray-200 text-gray-500"}`}>
                                {step.completed ? <CheckCircle className="w-6 h-6" />
                                    : step.inProgress ? <Clock className="w-6 h-6" />
                                        : <Icon className="w-6 h-6" />}
                            </div>

                            <span className={`text-xs font-medium 
                                ${step.completed ? "text-green-700" :
                                    step.inProgress ? "text-yellow-700" :
                                        "text-gray-500"}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Status summary */}
            <div className="text-center pt-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm 
                    ${order.order_status === "Delivered" ? "bg-green-50 text-green-700" :
                        order.order_status === "Canceled" ? "bg-red-50 text-red-700" :
                            "bg-yellow-50 text-yellow-700"}`}>
                    <div className={`w-2 h-2 rounded-full 
                        ${order.order_status === "Delivered" ? "bg-green-500" :
                            order.order_status === "Canceled" ? "bg-red-500" : "bg-yellow-500"}`}></div>
                    {order.order_status === "Delivered"
                        ? "Đơn hàng đã giao thành công"
                        : order.order_status === "Canceled"
                            ? "Đơn hàng đã bị hủy"
                            : "Đơn hàng đang được xử lý"}
                </span>
            </div>
        </div>
    );
}
