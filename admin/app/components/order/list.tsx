"use client";

import { Eye, ChevronDown, Search, Download } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  final_amount: number; // ép chắc chắn là number
  payment_method: string;
  payment_status: string;
  order_status: string; // không cho undefined
  shipping_status: string;
  shipping_address: string;
  created_at: string;
};


const statusConfig = {
  Pending: { label: "Đang chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Shipped: { label: "Đang giao hàng", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Delivered: { label: "Đã giao hàng", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
} as const;

const shippingStatusMap = {
  Pending: "Chờ giao",
  Shipping: "Đang giao",
  Delivered: "Đã giao"
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
  const csvRows = [
    ["Mã", "Ngày", "Địa chỉ", "Tổng", "Thanh toán", "Trạng thái", "Vận chuyển"]
  ];

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

export default function OrderListTable({
  orders,
  loading,
  onShippingChange,
  searchTerm, setSearchTerm,
  filterStatus, setFilterStatus,
  filterPeriod, setFilterPeriod,
  filterExactDate, setFilterExactDate,
  currentPage, setCurrentPage,
  totalPages, totalItems
}: {
  orders: Order[];
  loading: boolean;
  onShippingChange: (id: number, status: string) => void;
  searchTerm: string; setSearchTerm: (v: string) => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterPeriod: string; setFilterPeriod: (v: string) => void;
  filterExactDate: string; setFilterExactDate: (v: string) => void;
  currentPage: number; setCurrentPage: (v: number) => void;
  totalPages: number; totalItems: number;
}) {
  const router = useRouter();

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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none min-w-[160px]"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Pending">Đang chờ xử lý</option>
              <option value="Shipped">Đang giao hàng</option>
              <option value="Delivered">Đã giao hàng</option>
            </select>
            <input
              type="month"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none"
            />
            <input
              type="date"
              value={filterExactDate}
              onChange={(e) => setFilterExactDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none"
            />
            <button
              onClick={() => downloadCSV(orders)}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium transition-all"
            >
              <Download size={16} /> Xuất CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-left font-semibold text-gray-700">Mã đơn</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700">Ngày tạo</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700">Địa chỉ giao hàng</th>
                <th className="py-4 px-6 text-right font-semibold text-gray-700">Tổng tiền</th>
                <th className="py-4 px-6 text-center font-semibold text-gray-700">Thanh toán</th>
                <th className="py-4 px-6 text-center font-semibold text-gray-700">Vận chuyển</th>
                <th className="py-4 px-6 text-center font-semibold text-gray-700">Trạng thái</th>
                <th className="py-4 px-6 text-center font-semibold text-gray-700">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <div className="text-gray-400">📦</div>
                      <div>Không có đơn hàng nào</div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-mono text-gray-900 font-medium">#{order.id}</td>
                    <td className="py-4 px-6 text-gray-900">{formatDateTime(order.created_at)}</td>
                    <td className="py-4 px-6 text-gray-900 truncate max-w-[200px]" title={order.shipping_address}>
                      {order.shipping_address}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-900">
                      {Number(order.final_amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <select
                        value={order.shipping_status}
                        onChange={(e) => onShippingChange(order.id, e.target.value)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium bg-white hover:bg-gray-50 focus:border-gray-300 transition-all outline-none"
                      >
                        {Object.keys(shippingStatusMap).map(status => (
                          <option key={status} value={status}>
                            {shippingStatusMap[status as keyof typeof shippingStatusMap]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                        ${statusConfig[order.order_status as keyof typeof statusConfig]?.bg}
                        ${statusConfig[order.order_status as keyof typeof statusConfig]?.text}
                        ${statusConfig[order.order_status as keyof typeof statusConfig]?.border}`}>
                        {statusConfig[order.order_status as keyof typeof statusConfig]?.label ?? order.order_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:border-[#db4444] hover:bg-[#db4444] hover:text-white transition-all group"
                      >
                        <Eye size={16} className="text-gray-600 group-hover:text-white" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
