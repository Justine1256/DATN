"use client";

import React, { useState, useEffect } from "react";
import { Eye, Search, Download, RotateCcw } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

// Define types for Order
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

// Status configuration for orders
const statusConfig = {
    Pending: { label: "Đang chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    Shipped: { label: "Đang giao hàng", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    Delivered: { label: "Đã giao hàng", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Canceled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
} as const;

// Shipping status configuration
const shippingConfig = {
    Pending: { label: "Chờ giao", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    Shipping: { label: "Đang giao", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    Delivered: { label: "Đã giao", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Failed: { label: "Giao thất bại", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
} as const;

// Format the date to a more readable format
function formatDateTime(datetime: string) {
    if (!datetime) return "";
    return new Date(datetime).toLocaleString("vi-VN", {
        hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

// Tab configuration with dynamic counts based on the API response
const tabConfig = [
    { key: "all", label: "Tất cả", count: 0, color: "bg-purple-500" },
    { key: "pending", label: "Đang chờ xử lý", count: 0, color: "bg-orange-500" },
    { key: "shipped", label: "Đang giao hàng", count: 0, color: "bg-blue-500" },
    { key: "delivered", label: "Đã giao hàng", count: 0, color: "bg-green-500" },
    { key: "canceled", label: "Đã hủy", count: 0, color: "bg-red-500" }
];

export default function OrderManagementInterface({
    orders = [],
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
    totalItems = orders.length,
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
    // Define loading state
    const [loadingState, setLoadingState] = useState(false);

    const [internalSearchTerm, setInternalSearchTerm] = useState("");
    const [internalFilterStatus, setInternalFilterStatus] = useState("all");
    const [internalFilterPeriod, setInternalFilterPeriod] = useState("");
    const [internalFilterExactDate, setInternalFilterExactDate] = useState("");
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState("all");
    const [stats, setStats] = useState<any>({});

    // Fetch order statistics and update tab counts
    const fetchStats = async () => {
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/order-statistics`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            const data = await res.json();
            setStats(data);

            // Update the tab count dynamically based on the fetched data
            tabConfig.forEach((tab) => {
                switch (tab.key) {
                    case "all":
                        tab.count = data.total_orders;
                        break;
                    case "pending":
                        tab.count = data.pending_orders;
                        break;
                    case "shipped":
                        tab.count = data.shipping_orders;
                        break;
                    case "delivered":
                        tab.count = data.delivered_orders;
                        break;
                    case "canceled":
                        tab.count = data.canceled_orders;
                        break;
                }
            });
        } catch (err) {
            console.error("🚨 Failed to load order statistics:", err);
        }
    };

    // Fetch orders based on the selected status and page
    const fetchOrders = async (status = "all", page = 1) => {
        setLoadingState(true); // Set loading state to true
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/admin/orders?status=${status}&page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            const data = await res.json();
            setOrders(data.orders);
        } catch (err) {
            console.error("🚨 Failed to load orders:", err);
        } finally {
            setLoadingState(false); // Set loading state to false
        }
    };

    useEffect(() => {
        fetchOrders(filterStatus, currentPage);
        fetchStats();
    }, [filterStatus, currentPage]);

    const handleStatusChange = (id: number, status: string) => {
        if (onStatusChange) {
            onStatusChange(id, status);
        }
    };

    const handleViewDetail = (id: number) => {
        if (onViewDetail) {
            onViewDetail(id);
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterPeriod("");
        setFilterExactDate("");
        setActiveTab("all");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header with filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm đơn hàng</label>
                            <input
                                type="text"
                                placeholder="Nhập mã đơn hàng hoặc địa chỉ"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian đặt hàng</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filterExactDate}
                                    onChange={(e) => setFilterExactDate(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="flex items-center text-gray-500">→</span>
                                <input
                                    type="date"
                                    value={filterPeriod}
                                    onChange={(e) => setFilterPeriod(e.target.value)}
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

                {/* Tab filters for order statuses */}
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
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Orders Table */}
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

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200">
                            <div className="text-sm text-gray-500">Tổng: {totalItems} đơn hàng</div>
                            <div className="flex gap-1 items-center">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                                >
                                    ‹
                                </button>

                                {Array.from({ length: totalPages })
                                    .map((_, i) => i + 1)
                                    .filter(
                                        (page) =>
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                    )
                                    .map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded border transition ${page === currentPage
                                                ? "border-blue-500 bg-blue-500 text-white"
                                                : "border-gray-200 hover:border-blue-500 hover:text-blue-500"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border border-gray-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
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
