"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import OrderListTable from "@/app/components/shop-admin/order/list";
import OrderStatusCard from "@/app/components/shop-admin/order/card";
import OrderDetailView from "@/app/components/shop-admin/order/OrderDetailView";
import { API_BASE_URL } from "@/utils/api";
import { ShoppingCart, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

// Types
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

type Product = {
    id: number;
    image: string | string[];
    name: string;
    price_at_time: string;
    quantity: number;
    subtotal: string;
};

type OrderStats = {
    total_orders: number;
    total_amount: number;
    formatted_total_amount: string;
    pending_orders: number;
    shipping_orders: number;
    delivered_orders: number;
    canceled_orders: number;
};

export default function ModernOrderTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<"" | Order["order_status"]>("");
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<{
        buyer?: any;
        products: Product[];
        shippingStatus: Order["shipping_status"];
    } | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // NEW filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("");
    const [filterExactDate, setFilterExactDate] = useState("");

    const handleCardClick = (status: Order["order_status"]) => {
        setFilterStatus(status);
    };

    const filteredOrders = orders
        .filter(order =>
            order.shipping_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm)
        )
        .filter(order =>
            !filterStatus || order.order_status === filterStatus
        )
        .filter(order =>
            !filterPeriod || order.created_at.startsWith(filterPeriod)
        )
        .filter(order =>
            !filterExactDate || order.created_at.slice(0, 10) === filterExactDate
        );

    const handleExportInvoice = async () => {
        try {
            if (!selectedOrderId) return;
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/orders/${selectedOrderId}/invoice`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/pdf",
                },
            });

            if (!res.ok) throw new Error("Lỗi khi tải hóa đơn");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice_order_${selectedOrderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("❌ Không thể xuất hóa đơn:", err);
            alert("Xuất hóa đơn thất bại.");
        }
    };

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
        } catch (err) {
            console.error("🚨 Failed to load order statistics:", err);
        }
    };

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/admin/orders?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            const data = await res.json();
            const mappedOrders = (data.orders || []).map((o: any) => ({
                ...o,
                order_status: (o.order_status ?? "Pending") as Order["order_status"],
                shipping_status: (o.shipping_status ?? "Pending") as Order["shipping_status"],
                final_amount: Number(o.final_amount) || 0,
            }));
            setOrders(mappedOrders);
            setCurrentPage(data.pagination?.current_page || 1);
        } catch (err) {
            console.error("🚨 Failed to load orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id: number) => {
        setSelectedOrderId(id);
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/admin/order/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            const order = data.order;
            setSelectedOrderDetail({
                buyer: order.buyer ?? null,
                products: Array.isArray(order.products) ? order.products : [],
                shippingStatus: order.shipping_status ?? "Pending",
            });
            setIsDetailOpen(true);
        } catch (err) {
            console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", err);
        }
    };

    const handleStatusChange = async (id: number, value: string) => {
        try {
            const shippingMap: Record<Order["order_status"], Order["shipping_status"]> = {
                Pending: "Pending",
                Shipped: "Shipping",
                Delivered: "Delivered",
                Canceled: "Failed",
            };
            const order_status = value as Order["order_status"];
            const shipping_status = shippingMap[order_status];
            const token = Cookies.get("authToken");

            await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ order_status, shipping_status }),
            });

            setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, order_status, shipping_status } : o))
            );

            fetchStats();
        } catch (err) {
            console.error("🚨 Failed to update order status:", err);
        }
    };

    useEffect(() => {
        fetchOrders(currentPage);
        fetchStats();
    }, [currentPage]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {stats && (
                    <>
                        <OrderStatusCard title="Tổng số đơn" count={stats.total_orders} icon={<ShoppingCart />} colorIndex={0} isActive={filterStatus === ""} onClick={() => setFilterStatus("")} />
                        <OrderStatusCard title="Tổng tiền" count={stats.total_amount} icon={<Clock />} colorIndex={1} isAmount />
                        <OrderStatusCard title="Đơn đang chờ" count={stats.pending_orders} icon={<Clock />} colorIndex={2} isActive={filterStatus === "Pending"} onClick={() => handleCardClick("Pending")} />
                        <OrderStatusCard title="Đơn đang giao" count={stats.shipping_orders} icon={<Truck />} colorIndex={3} isActive={filterStatus === "Shipped"} onClick={() => handleCardClick("Shipped")} />
                        <OrderStatusCard title="Đơn đã giao" count={stats.delivered_orders} icon={<CheckCircle />} colorIndex={4} isActive={filterStatus === "Delivered"} onClick={() => handleCardClick("Delivered")} />
                        <OrderStatusCard title="Đơn đã huỷ" count={stats.canceled_orders} icon={<XCircle />} colorIndex={5} isActive={filterStatus === "Canceled"} onClick={() => handleCardClick("Canceled")} />
                    </>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <OrderListTable
                        orders={orders}
                        loading={loading}
                        onStatusChange={handleStatusChange}
                        onViewDetail={handleViewDetail}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterPeriod={filterPeriod}
                        setFilterPeriod={setFilterPeriod}
                        filterExactDate={filterExactDate}
                        setFilterExactDate={setFilterExactDate}
                    />
                </div>
            </div>

            {isDetailOpen && selectedOrderDetail && selectedOrderId !== null && (
                <OrderDetailView
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    buyer={selectedOrderDetail.buyer}
                    products={selectedOrderDetail.products}
                    shippingStatus={selectedOrderDetail.shippingStatus}
                    selectedOrderId={selectedOrderId}
                    onExportInvoice={handleExportInvoice}
                />
            )}
        </div>
    );
}
