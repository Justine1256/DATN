"use client";

import { Eye, ChevronDown, Search, Download } from "lucide-react";
import { useRouter } from "next/navigation";

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

const statusConfig = {
  Pending: { label: "Đang chờ xử lý", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  Shipped: { label: "Đang giao hàng", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Delivered: { label: "Đã giao hàng", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
} as const;

const shippingStatusMap = {
  Pending: "Chờ giao",
  Shipping: "Đang giao",
  Delivered: "Đã giao"
} as const;

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
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full min-w-[1200px] text-sm text-center">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="py-4 px-6">Mã</th>
            <th className="py-4 px-6">Ngày</th>
            <th className="py-4 px-6">Địa chỉ</th>
            <th className="py-4 px-6">Tổng</th>
            <th className="py-4 px-6">Thanh toán</th>
            <th className="py-4 px-6">Vận chuyển</th>
            <th className="py-4 px-6">Trạng thái</th>
            <th className="py-4 px-6">Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-8">Đang tải...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={8} className="py-8">Không có đơn nào</td></tr>
          ) : (
            orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6 font-mono">#{order.id}</td>
                <td className="py-4 px-6">{order.created_at}</td>
                <td className="py-4 px-6 text-left truncate max-w-[200px]" title={order.shipping_address}>
                  {order.shipping_address}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">{Number(order.final_amount).toLocaleString("vi-VN")} đ</td>
                <td className="py-4 px-6">{order.payment_method}</td>
                <td className="py-4 px-6">
                  <select
                    value={order.shipping_status}
                    onChange={(e) => onShippingChange(order.id, e.target.value)}
                    className="rounded-full border px-3 py-1 text-xs"
                  >
                    {Object.keys(shippingStatusMap).map(status => (
                      <option key={status} value={status}>{shippingStatusMap[status as keyof typeof shippingStatusMap]}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                    ${statusConfig[order.order_status as keyof typeof statusConfig]?.bg}
                    ${statusConfig[order.order_status as keyof typeof statusConfig]?.text}
                    ${statusConfig[order.order_status as keyof typeof statusConfig]?.border}`}>
                    {statusConfig[order.order_status as keyof typeof statusConfig]?.label ?? order.order_status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <button onClick={() => router.push(`/orders/${order.id}`)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-between p-4 border-t bg-gray-50 text-sm text-gray-500">
        <span>Hiển thị {(orders.length > 0 ? 1 : 0)}-{orders.length} trên {totalItems}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-100 text-gray-400" : "border hover:bg-gray-50"}`}>
            Trước
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? "bg-gray-100 text-gray-400" : "border hover:bg-gray-50"}`}>
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
