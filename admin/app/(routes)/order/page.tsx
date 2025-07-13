"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import OrderListTable from "../../components/order/list";
import OrderStatusCard from "../../components/order/card";
import { API_BASE_URL } from "@/utils/api";
import { ShoppingCart, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

type Order = {
  id: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: "Pending" | "Shipped" | "Delivered" | "Canceled";
  shipping_status: "Pending" | "Shipping" | "Delivered" | "Failed";
  shipping_address: string;
  created_at: string;
  total_products: number;
};

type OrderStats = {
  total_orders: number;
  formatted_total_amount: string;
  pending_orders: number;
  shipping_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
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

  const [stats, setStats] = useState<OrderStats | null>(null);

  // fetch thống kê
  const fetchStats = async () => {
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/order-statistics`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("🚨 Failed to load order statistics:", err);
    }
  };

  // fetch tất cả orders
  async function fetchOrders(page = 1) {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/orders?page=${page}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      const mappedOrders = (data.orders || []).map((o: any) => ({
        ...o,
        order_status: (o.order_status ?? "Pending") as Order["order_status"],
        shipping_status: (o.shipping_status ?? "Pending") as Order["shipping_status"],
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
    fetchOrders(currentPage);
    fetchStats();
  }, [currentPage]);

  const handleStatusChange = async (id: number, value: string) => {
    try {
      const shippingMap: Record<Order["order_status"], Order["shipping_status"]> = {
        Pending: "Pending",
        Shipped: "Shipping",
        Delivered: "Delivered",
        Canceled: "Failed"
      };
      const shipping_status = shippingMap[value as Order["order_status"]];
      const order_status = value as Order["order_status"];

      const token = Cookies.get("authToken");
      await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ order_status, shipping_status })
      });

      setOrders(prev =>
        prev.map(order =>
          order.id === id
            ? { ...order, order_status, shipping_status }
            : order
        )
      );

    } catch (err) {
      console.error("🚨 Failed to update order status:", err);
    }
  };

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === "Tất cả" || order.order_status === filterStatus;
    const matchPeriod = filterPeriod ? order.created_at.startsWith(filterPeriod) : true;
    const matchExactDate = filterExactDate ? order.created_at.startsWith(filterExactDate) : true;
    const matchSearch = debouncedSearch
      ? order.shipping_address.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      `#${order.id}`.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;
    return matchStatus && matchPeriod && matchExactDate && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {stats && (
          <>
            <OrderStatusCard title="Tổng số đơn" count={stats.total_orders} icon={<ShoppingCart />} colorIndex={0} />
            <OrderStatusCard title="Tổng tiền" count={stats.formatted_total_amount} icon={<Clock />} colorIndex={1} isAmount />
            <OrderStatusCard title="Đơn đang chờ" count={stats.pending_orders} icon={<Clock />} colorIndex={2} />
            <OrderStatusCard title="Đơn đang giao" count={stats.shipping_orders} icon={<Truck />} colorIndex={3} />
            <OrderStatusCard title="Đơn đã giao" count={stats.delivered_orders} icon={<CheckCircle />} colorIndex={4} />
            <OrderStatusCard title="Đơn đã huỷ" count={stats.cancelled_orders} icon={<XCircle />} colorIndex={5} />
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <OrderListTable
            orders={filteredOrders}
            loading={loading}
            onStatusChange={handleStatusChange}
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
      </div>
    </div>
  );
}
