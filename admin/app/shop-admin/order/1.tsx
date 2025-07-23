



"use client";
import React, { useState } from "react";
import { Eye, Search, Download, RotateCcw } from "lucide-react";

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

function downloadCSV(data: Order[]) {
  const csvRows = [["Mã", "Ngày", "Địa chỉ", "Tổng", "Thanh toán", "Trạng thái", "Vận chuyển"]];
  data.forEach(order => {
    csvRows.push([
      `#${order.id}`,
      formatDateTime(order.created_at),
      order.shipping_address.replace(/,/g, " "),
      Number(order.final_amount).toLocaleString("vi-VN"),
      order.payment_method,
      order.order_status,
      order.shipping_status
    ]);
  });
  const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Tab configuration với counts (giữ nguyên từ giao diện ứng viên)
const tabConfig = [
  { key: "all", label: "Tất cả", count: 99, color: "bg-purple-500" },
  { key: "pending", label: "Đang chờ xử lý", count: 48, color: "bg-orange-500" },
  { key: "shipped", label: "Đang giao hàng", count: 11, color: "bg-blue-500" },
  { key: "delivered", label: "Đã giao hàng", count: 8, color: "bg-green-500" },
  { key: "canceled", label: "Đã hủy", count: 3, color: "bg-red-500" }
];

// Sample data
const sampleOrders: Order[] = [
  {
    id: 1001,
    final_amount: 1250000,
    payment_method: "COD",
    payment_status: "Pending",
    order_status: "Pending",
    shipping_status: "Pending",
    shipping_address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    created_at: "2024-01-15T10:30:00Z",
    total_products: 3
  },
  {
    id: 1002,
    final_amount: 850000,
    payment_method: "Card",
    payment_status: "Paid",
    order_status: "Shipped",
    shipping_status: "Shipping",
    shipping_address: "456 Lê Văn Việt, Quận 9, TP.HCM",
    created_at: "2024-01-14T14:20:00Z",
    total_products: 2
  },
  {
    id: 1003,
    final_amount: 2100000,
    payment_method: "Bank Transfer",
    payment_status: "Paid",
    order_status: "Delivered",
    shipping_status: "Delivered",
    shipping_address: "789 Hoàng Văn Thụ, Tân Bình, TP.HCM",
    created_at: "2024-01-13T09:15:00Z",
    total_products: 5
  },
  {
    id: 1004,
    final_amount: 450000,
    payment_method: "COD",
    payment_status: "Canceled",
    order_status: "Canceled",
    shipping_status: "Failed",
    shipping_address: "321 Võ Văn Tần, Quận 3, TP.HCM",
    created_at: "2024-01-12T16:45:00Z",
    total_products: 1
  }
];

export default function OrderManagementInterface({
  orders = sampleOrders,
  loading = false,
  onStatusChange,
  searchTerm = "",
  setSearchTerm,
  filterStatus = "all",
  setFilterStatus,
  filterPeriod = "",
  setFilterPeriod,
  filterExactDate = "",
  setFilterExactDate,
  currentPage = 1,
  setCurrentPage,
  totalPages = 5,
  totalItems = sampleOrders.length,
  onViewDetail
}: {
  orders?: Order[];
  loading?: boolean;
  onStatusChange?: (id: number, status: string) => void;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  filterStatus?: string;
  setFilterStatus?: (v: string) => void;
  filterPeriod?: string;
  setFilterPeriod?: (v: string) => void;
  filterExactDate?: string;
  setFilterExactDate?: (v: string) => void;
  currentPage?: number;
  setCurrentPage?: (v: number) => void;
  totalPages?: number;
  totalItems?: number;
  onViewDetail?: (id: number) => void;
}) {
  // Internal state fallbacks
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalFilterStatus, setInternalFilterStatus] = useState("all");
  const [internalFilterPeriod, setInternalFilterPeriod] = useState("");
  const [internalFilterExactDate, setInternalFilterExactDate] = useState("");
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  // Use props or fallback to internal state
  const actualSearchTerm = searchTerm !== undefined ? searchTerm : internalSearchTerm;
  const actualSetSearchTerm = setSearchTerm || setInternalSearchTerm;
  const actualFilterStatus = filterStatus !== undefined ? filterStatus : internalFilterStatus;
  const actualSetFilterStatus = setFilterStatus || setInternalFilterStatus;
  const actualFilterPeriod = filterPeriod !== undefined ? filterPeriod : internalFilterPeriod;
  const actualSetFilterPeriod = setFilterPeriod || setInternalFilterPeriod;
  const actualFilterExactDate = filterExactDate !== undefined ? filterExactDate : internalFilterExactDate;
  const actualSetFilterExactDate = setFilterExactDate || setInternalFilterExactDate;
  const actualCurrentPage = currentPage !== undefined ? currentPage : internalCurrentPage;
  const actualSetCurrentPage = setCurrentPage || setInternalCurrentPage;

  const handleStatusChange = (id: number, status: string) => {
    if (onStatusChange) {
      onStatusChange(id, status);
    } else {
      console.log(`Changing order ${id} status to ${status}`);
    }
  };

  const handleViewDetail = (id: number) => {
    if (onViewDetail) {
      onViewDetail(id);
    } else {
      console.log(`View detail for order ${id}`);
    }
  };

  const resetFilters = () => {
    actualSetSearchTerm("");
    actualSetFilterStatus("all");
    actualSetFilterPeriod("");
    actualSetFilterExactDate("");
    setActiveTab("all");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header with filters - Sử dụng giao diện từ ứng viên */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm đơn hàng
              </label>
              <input
                type="text"
                placeholder="Nhập mã đơn hàng hoặc địa chỉ"
                value={actualSearchTerm}
                onChange={(e) => actualSetSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian đặt hàng
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={actualFilterExactDate}
                  onChange={(e) => actualSetFilterExactDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="flex items-center text-gray-500">→</span>
                <input
                  type="date"
                  value={actualFilterPeriod}
                  onChange={(e) => actualSetFilterPeriod(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-end gap-10">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Tab filters - Sử dụng giao diện từ ứng viên */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex border-b border-gray-200">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-1 text-xs text-white rounded-full ${tab.color}`}>
                  {tab.count}+
                </span>
              </button>
            ))}
          </div>

          {/* Table - Giữ nguyên cấu trúc đơn hàng nhưng dùng style từ ứng viên */}
          <div className="overflow-hidden">
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
          ${statusConfig[order.order_status]?.border}`}>
                          {statusConfig[order.order_status]?.label}
                        </span>
                      ) : (
                        <select
                          value={order.order_status}
                          onChange={(e) => onStatusChange(order.id, e.target.value)}
                          className={`rounded-full border px-2 py-1 text-xs font-medium transition-all outline-none min-w-[100px]
          ${statusConfig[order.order_status]?.bg}
          ${statusConfig[order.order_status]?.text}
          ${statusConfig[order.order_status]?.border}`}>
                          {Object.keys(statusConfig).map(status => (
                            <option key={status} value={status}>
                              {statusConfig[status as keyof typeof statusConfig].label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewDetail(order.id)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-green-500 hover:text-green-700">
                          ✓
                        </button>
                        <button className="p-1 text-red-500 hover:text-red-700">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>

            {/* Pagination - Sử dụng giao diện từ ứng viên */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Tổng: {totalItems} đơn hàng
              </div>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => actualSetCurrentPage(1)}
                  disabled={actualCurrentPage === 1}
                  className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                >
                  «
                </button>
                <button
                  onClick={() => actualSetCurrentPage(Math.max(1, actualCurrentPage - 1))}
                  disabled={actualCurrentPage === 1}
                  className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages })
                  .map((_, i) => i + 1)
                  .filter(
                    page =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= actualCurrentPage - 1 && page <= actualCurrentPage + 1)
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
                        onClick={() => actualSetCurrentPage(page)}
                        className={`px-3 py-1 rounded border transition ${page === actualCurrentPage
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-200 hover:border-blue-500 hover:text-blue-500"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => actualSetCurrentPage(Math.min(totalPages, actualCurrentPage + 1))}
                  disabled={actualCurrentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                >
                  ›
                </button>
                <button
                  onClick={() => actualSetCurrentPage(totalPages)}
                  disabled={actualCurrentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}