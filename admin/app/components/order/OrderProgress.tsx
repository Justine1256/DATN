import { Dispatch, SetStateAction, useState } from "react";
import Cookies from "js-cookie";
import { CheckCircle, Clock, Package, Truck, Home } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import type { Order } from "../../ts/oder";

export default function OrderProgress({
    order,
    setOrder,
}: {
    order: Order;
    setOrder: Dispatch<SetStateAction<Order | null>>;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async (newStatus: "Delivered" | "Canceled") => {
        setIsLoading(true);
        try {
            const shippingMap: Record<"Delivered" | "Canceled", Order["shipping_status"]> = {
                Delivered: "Delivered",
                Canceled: "Failed",
            };

            const token = Cookies.get("authToken");
            await fetch(`${API_BASE_URL}/orders/${order.id}/status`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    order_status: newStatus,
                    shipping_status: shippingMap[newStatus],
                }),
            });

            setOrder((prev) =>
                prev
                    ? { ...prev, order_status: newStatus, shipping_status: shippingMap[newStatus] }
                    : null
            );
        } catch (err) {
            console.error("🚨 Update failed:", err);
        } finally {
            setIsLoading(false);
        }
    };


  const steps = [
    {
      label: "Đang xử lý",
      icon: Package,
      completed:
        ["Shipping", "Delivered"].includes(order.shipping_status) || order.order_status === "Delivered",
      active: order.shipping_status === "Pending" || order.order_status === "Pending",
    },
    {
      label: "Đang giao",
      icon: Truck,
      completed: order.shipping_status === "Delivered" || order.order_status === "Delivered",
      active: order.shipping_status === "Shipping",
    },
    {
      label: "Đã giao",
      icon: Home,
      completed: order.order_status === "Delivered",
      active: order.order_status === "Delivered",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between text-sm text-gray-600">
        <div>
          <span className="font-semibold">Mã đơn:</span> #{order.id}
        </div>
        <div>
          <span className="font-semibold">Ngày đặt:</span>{" "}
          {new Date(order.created_at).toLocaleString("vi-VN")}
        </div>
      </div>

      {/* Progress bars */}
      <div className="flex justify-between items-end mt-2 space-x-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${step.completed
                  ? "bg-green-500 text-white"
                  : step.active
                  ? "bg-yellow-400 text-white animate-pulse"
                  : "bg-gray-300 text-gray-500"
                }`}
            >
              {step.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : step.active ? (
                <Clock className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="text-xs text-center">{step.label}</div>
            <div
              className={`w-full h-1 rounded-full
                ${step.completed
                  ? "bg-green-500"
                  : step.active
                  ? "bg-yellow-400 bg-stripes animate-stripe"
                  : "bg-gray-200"
                }`}
            ></div>
          </div>
        ))}
      </div>

      {/* Status summary */}
      <div className="text-center pt-2">
        <span
          className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm
            ${order.order_status === "Delivered"
              ? "bg-green-50 text-green-700"
              : order.order_status === "Canceled"
              ? "bg-red-50 text-red-700"
              : "bg-yellow-50 text-yellow-700"
            }`}
        >
          <div
            className={`w-2 h-2 rounded-full
              ${order.order_status === "Delivered"
                ? "bg-green-500"
                : order.order_status === "Canceled"
                ? "bg-red-500"
                : "bg-yellow-500"
              }`}
          ></div>
          {order.order_status === "Delivered"
            ? "Đơn hàng đã giao thành công"
            : order.order_status === "Canceled"
            ? "Đơn hàng đã bị hủy"
            : "Đơn hàng đang được xử lý"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 pt-2">
        <button
          onClick={() => handleStatusUpdate("Delivered")}
          disabled={isLoading || order.order_status === "Delivered" || order.order_status === "Canceled"}
          className={`px-5 py-2 rounded transition disabled:opacity-50 
            ${order.order_status === "Delivered" || order.order_status === "Canceled"
              ? "invisible"
              : "bg-green-600 text-white hover:bg-green-700"
            }`}
        >
          {isLoading ? "Đang xử lý..." : "Đã giao hàng"}
        </button>
        <button
          onClick={() => handleStatusUpdate("Canceled")}
          disabled={isLoading || order.order_status === "Delivered" || order.order_status === "Canceled"}
          className={`px-5 py-2 rounded transition disabled:opacity-50 
            ${order.order_status === "Delivered" || order.order_status === "Canceled"
              ? "invisible"
              : "bg-red-600 text-white hover:bg-red-700"
            }`}
        >
          {isLoading ? "Đang xử lý..." : "Hủy đơn hàng"}
        </button>
      </div>
    </div>
  );
}
