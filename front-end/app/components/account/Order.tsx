"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

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

  const token = Cookies.get("authToken");

  const filterOrders = (status: string, data: Order[]) => {
    if (status === "all") return data;
    if (status === "processing") {
      return data.filter(
        (o) => o.order_status === "Pending" || o.order_status === "order confirmation"
      );
    }
    return data.filter((o) => o.order_status.toLowerCase() === status);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔥 API response:", res.data);

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];
      setOrders(data);
      setFilteredOrders(filterOrders(activeTab, data));
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };



  const handleCancelOrder = async (orderId: number) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/cancel/${orderId}`,
        {}, // PATCH không cần truyền dữ liệu nếu không yêu cầu
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("✅ Đã gửi yêu cầu hủy đơn hàng.");
      fetchOrders();
    } catch (err) {
      console.error("❌ Hủy đơn hàng thất bại:", err);
    }
  };


  const handleMarkAsShipped = async (orderId: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/ordership/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("🚚 Đã cập nhật trạng thái giao hàng.");
      fetchOrders();
    } catch (err) {
      console.error("❌ Cập nhật trạng thái giao hàng thất bại:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setFilteredOrders(filterOrders(activeTab, orders));
  }, [activeTab, orders]);

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-10 px-4">
      <div className="bg-white p-4 rounded-xl shadow-sm min-h-[500px]">
        <h2 className="text-xl font-semibold text-red-500 mb-4 text-center">Đơn mua của tôi</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-8 py-2 rounded-full border text-base transition-all ${activeTab === tab.value
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
          <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-md">
            <p className="text-lg text-gray-500">Không có đơn hàng phù hợp.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-md p-4 shadow-sm bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div>
                  <p className="font-semibold text-sm text-black">Mã đơn: #{order.id}</p>
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
                  <div className="mt-2 space-x-2">
                    {order.order_status !== "Canceled" && (
                      <button
                        className="text-sm text-red-500 hover:underline"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Hủy đơn
                      </button>
                    )}
                    {order.shipping_status === "Shipping" && (
                      <button
                        className="text-sm text-blue-500 hover:underline"
                        onClick={() => handleMarkAsShipped(order.id)}
                      >
                        Đã giao
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
