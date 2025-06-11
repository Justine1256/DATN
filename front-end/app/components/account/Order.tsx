"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface Order {
  id: number;
  final_amount: number;
  order_status: string;
  shipping_status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  shipping_address: string;
}

const tabs = [
  { label: "Tất cả", value: "all" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đang giao", value: "shipping" },
  { label: "Đã giao", value: "delivered" },
  { label: "Đã hủy", value: "canceled" },
];

export default function OrderSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const filterOrders = (status: string, data: Order[]) => {
    if (status === "all") return data;
    if (status === "processing") {
      return data.filter(
        (o) => o.order_status === "Pending" || o.order_status === "order confirmation"
      );
    }
    return data.filter((o) => o.order_status.toLowerCase() === status);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const token = Cookies.get("authToken");
      try {
        const res = await axios.get("http://localhost:8000/api/showdh", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(res.data);
        setFilteredOrders(filterOrders(activeTab, res.data));
      } catch (err) {
        console.error("❌ Lỗi khi lấy đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    setFilteredOrders(filterOrders(activeTab, orders));
  }, [activeTab, orders]);

  return (
    <div className="w-full max-w-[1200px] mx-auto mt-10 px-4">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-red-500 mb-4 text-center">Đơn mua của tôi</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-full border ${
                activeTab === tab.value
                  ? "bg-red-500 text-white border-red-500"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải đơn hàng...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500">Không có đơn hàng phù hợp.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-md p-4 shadow-sm bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div>
                  <p className="font-semibold text-sm text-black">
                    Mã đơn: #{order.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ngày đặt: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Phương thức:</strong> {order.payment_method} ({order.payment_status})
                  </p>
                  <p className="text-sm">
                    <strong>Giao hàng:</strong> {order.shipping_status}
                  </p>
                  <p className="text-sm">
                    <strong>Địa chỉ:</strong> {order.shipping_address}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs mb-2">
                    {order.order_status}
                  </span>
                  <p className="font-bold text-red-600">
                    {order.final_amount.toLocaleString()}₫
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
