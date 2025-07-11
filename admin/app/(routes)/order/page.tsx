"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import OrderListTable from "../../components/order/list";
import { API_BASE_URL } from "@/utils/api";

type Order = {
  id: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  shipping_status: string;
  shipping_address: string;
  created_at: string;
};

export default function ModernOrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterExactDate, setFilterExactDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Đưa fetchOrders ra ngoài để gọi được ở handleShippingChange
  async function fetchOrders(page = currentPage) {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      console.log("🐾 Token:", token);

      const res = await fetch(`${API_BASE_URL}/admin/orders?page=${page}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("👉 API GET orders status:", res.status);
      const contentType = res.headers.get("content-type");
      const text = await res.text();
      console.log("📦 Raw response:", text);

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      if (!contentType?.includes("application/json")) {
        console.error("❌ Không phải JSON:", text);
        return;
      }

      const data = JSON.parse(text);
      console.log("✅ JSON parsed:", data);

      setOrders(data.orders || []);
      setTotalPages(data.pagination?.last_page || 1);
      setCurrentPage(data.pagination?.current_page || 1);

    } catch (err) {
      console.error("🚨 Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  // Gọi khi mount và khi page đổi
  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const handleShippingChange = async (id, value) => {
    try {
      console.log(`🚀 Update shipping for order ${id} to "${value}"`);

      // ánh xạ shipping -> order_status đúng
      let orderStatus = "Pending";
      if (value === "Shipping") orderStatus = "Shipped";
      else if (value === "Delivered") orderStatus = "Delivered";

      console.log("👉 Sending order_status:", orderStatus);

      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ order_status: orderStatus })
      });

      console.log(`✅ PUT response status: ${res.status}`);
      const text = await res.text();
      console.log("🔍 PUT response body:", text);

      await fetchOrders();

    } catch (err) {
      console.error("🚨 Failed to update order status:", err);
    }
  };
  

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === "Tất cả" || order.order_status === filterStatus;
    const matchPeriod = filterPeriod ? order.created_at.startsWith(filterPeriod) : true;
    const matchExactDate = filterExactDate ? order.created_at.startsWith(filterExactDate) : true;
    const matchSearch = searchTerm
      ? order.shipping_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#${order.id}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchStatus && matchPeriod && matchExactDate && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8">
      <OrderListTable
        orders={filteredOrders}
        loading={loading}
        onShippingChange={handleShippingChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPeriod={filterPeriod}
        setFilterPeriod={setFilterPeriod}
        filterExactDate={filterExactDate}
        setFilterExactDate={setFilterExactDate}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
      />
    </div>
  );
}
