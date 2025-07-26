"use client";
import React, { useState, useEffect } from "react";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

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

const initialTabConfig = [
  { key: "all", label: "Tất cả", count: 0, color: "bg-purple-500" },
  { key: "Pending", label: "Đang chờ xử lý", count: 0, color: "bg-orange-500" },
  { key: "Shipped", label: "Đang giao hàng", count: 0, color: "bg-blue-500" },
  { key: "Delivered", label: "Đã giao hàng", count: 0, color: "bg-green-500" },
  { key: "Canceled", label: "Đã hủy", count: 0, color: "bg-red-500" }
];

const statusConfig = {
  Pending: { label: "Đang chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Shipped: { label: "Đang giao hàng", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Delivered: { label: "Đã giao hàng", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Canceled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
} as const;

const shippingConfig = {
  Pending: { label: "Chờ giao", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Shipping: { label: "Đang giao", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Delivered: { label: "Đã giao", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Failed: { label: "Giao thất bại", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
} as const;

function formatDateTime(datetime: string) {
  if (!datetime) return "";
  return new Date(datetime).toLocaleString("vi-VN", {
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

export default function OrderListTable({
  orders, loading, onStatusChange,
  searchTerm, setSearchTerm,
  filterStatus, setFilterStatus,
  filterPeriod, setFilterPeriod,
  filterExactDate, setFilterExactDate,
  currentPage, setCurrentPage,
  totalPages, totalItems,
  onViewDetail
}: {
  orders: Order[];
  loading: boolean;
  onStatusChange: (id: number, status: string) => void;
  searchTerm: string; setSearchTerm: (v: string) => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterPeriod: string; setFilterPeriod: (v: string) => void;
  filterExactDate: string; setFilterExactDate: (v: string) => void;
  currentPage: number; setCurrentPage: (v: number) => void;
  totalPages: number; totalItems: number;
  onViewDetail: (id: number) => void;
}) {
  const [tabs, setTabs] = useState(initialTabConfig);

  const fetchStats = async () => {
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/order-admin-statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();

      setTabs(prevTabs => {
        return prevTabs.map(tab => {
          switch (tab.key) {
            case "all":
              return { ...tab, count: data.total_orders };
            case "Pending":
              return { ...tab, count: data.pending_orders };
            case "Shipped":
              return { ...tab, count: data.shipping_orders };
            case "Delivered":
              return { ...tab, count: data.delivered_orders };
            case "Canceled":
              return { ...tab, count: data.canceled_orders };
            default:
              return tab;
          }
        });
      });
    } catch (err) {
      console.error("Failed to load order statistics:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm địa chỉ, mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 w-72 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-gray-300 transition-all outline-none text-sm placeholder-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-3">
      

            <input type="month" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none" />
            <input type="date" value={filterExactDate} onChange={(e) => setFilterExactDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${filterStatus === tab.key
                  ? "border-blue-500 text-blue-600 bg-blue-50" // Active tab style
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50" // Inactive tab style
                }`}
            >
              {tab.label}
              <span className={`px-2 py-1 text-xs text-white rounded-full ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
              {orders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-[#fff3f3] transition-colors">
                  <td className="py-4 px-3 font-mono text-gray-900 font-medium">#{order.id}</td>
                  <td className="py-4 px-3 text-gray-900 text-xs">{formatDateTime(order.created_at)}</td>
                  <td className="py-4 px-3 text-gray-900 truncate max-w-[160px]" title={order.shipping_address}>
                    {order.shipping_address}
                  </td>
                  <td className="py-4 px-3 text-right font-semibold text-gray-900">{order.final_amount.toLocaleString("vi-VN")} đ</td>
                  <td className="py-4 px-3 text-center font-medium text-gray-900">
                    {order.total_products > 0 ? order.total_products : "-"}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {order.payment_method}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                      ${shippingConfig[order.shipping_status]?.bg}
                      ${shippingConfig[order.shipping_status]?.text}
                      ${shippingConfig[order.shipping_status]?.border}`}>
                      {shippingConfig[order.shipping_status]?.label}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    {order.order_status === "Delivered" || order.order_status === "Canceled" ? (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                          ${statusConfig[order.order_status]?.bg}
                          ${statusConfig[order.order_status]?.text}
                          ${statusConfig[order.order_status]?.border}`}
                      >
                        {statusConfig[order.order_status]?.label}
                      </span>
                    ) : (
                      <select
                        value={order.order_status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        className={`rounded-full border px-2 py-1 text-xs font-medium transition-all outline-none min-w-[100px]
                          ${statusConfig[order.order_status]?.bg}
                          ${statusConfig[order.order_status]?.text}
                          ${statusConfig[order.order_status]?.border}`}
                      >
                        {Object.keys(statusConfig).map(status => (
                          <option key={status} value={status}>
                            {statusConfig[status as keyof typeof statusConfig].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetail(order.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:border-[#db4444] hover:bg-[#db4444] hover:text-white transition-all group"
                    >
                      <Eye size={16} className="text-gray-600 group-hover:text-white" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between p-4 text-sm text-gray-500">
            <div>Tổng: {totalItems} đơn</div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
              >
                ‹
              </button>

              {Array.from({ length: totalPages })
                .map((_, i) => i + 1)
                .filter(
                  page =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .reduce<number[]>((acc, page, i, arr) => {
                  if (i > 0 && page - arr[i - 1] > 1) acc.push(-1);
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, i) =>
                  page === -1 ? (
                    <span key={`dots-${i}`} className="px-2">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border transition
                        ${page === currentPage
                          ? "border-[#db4444] bg-[#db4444] text-white"
                          : "border-gray-200 hover:border-[#db4444] hover:text-[#db4444]"}`}
                      title={`Trang ${page}`}
                    >
                      {page}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}