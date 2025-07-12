"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import OrderListTable from "../../components/order/list";
import OrderStatusCard from "../../components/order/card";
import { API_BASE_URL } from "@/utils/api";
import { ShoppingCart, Truck, CheckCircle, Clock } from "lucide-react";

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

  async function fetchOrders(page = currentPage) {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/orders?page=${page}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = JSON.parse(text);
      const mappedOrders = (data.orders || []).map((o: any) => ({
        ...o,
        order_status: o.order_status ?? "Pending",
        final_amount: Number(o.final_amount) || 0
      }));

      setOrders(mappedOrders);
      setTotalPages(data.pagination?.last_page || 1);
      setCurrentPage(data.pagination?.current_page || 1);

    } catch (err) {
      console.error("🚨 Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const handleShippingChange = async (id: number, value: string) => {
    try {
      let orderStatus = "Pending";
      if (value === "Shipping") orderStatus = "Shipped";
      else if (value === "Delivered") orderStatus = "Delivered";

      const token = Cookies.get("authToken");
      await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ order_status: orderStatus })
      });

      await fetchOrders();

    } catch (err) {
      console.error("🚨 Failed to update order status:", err);
    }
  };

  // FILTER
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

  // AGGREGATE
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((acc, cur) => acc + cur.final_amount, 0);
  const pendingOrders = orders.filter(o => o.order_status === "Pending").length;
  const shippingOrders = orders.filter(o => o.order_status === "Shipped").length;
  const deliveredOrders = orders.filter(o => o.order_status === "Delivered").length;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <OrderStatusCard title="Tổng số đơn" count={totalOrders} icon={<ShoppingCart />} colorIndex={0} />
        <OrderStatusCard title="Tổng tiền" count={totalAmount} icon={<Clock />} colorIndex={1} isAmount />
        <OrderStatusCard title="Đơn đang chờ" count={pendingOrders} icon={<Clock />} colorIndex={2} />
        <OrderStatusCard title="Đơn đang giao" count={shippingOrders} icon={<Truck />} colorIndex={3} />
        <OrderStatusCard title="Đơn đã giao" count={deliveredOrders} icon={<CheckCircle />} colorIndex={4} />
      </div>

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
