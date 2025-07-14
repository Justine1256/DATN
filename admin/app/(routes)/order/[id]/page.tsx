"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import OrderProgress from "@/app/components/order/OrderProgress";
import ProductListTable from "@/app/components/order/ProductListTable";
import BuyerInfoCard from "@/app/components/order/BuyerInfoCard";
import { ChevronLeft, X } from "lucide-react";
import type { Order } from "../../../ts/oder";
import OrderInvoice from "@/app/components/order/OrderInvoice";

type Shop = {
    name: string;
    phone: string;
    email: string;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [shop, setShop] = useState<Shop>({ name: "", phone: "", email: "" });
    const [showInvoice, setShowInvoice] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get("authToken");
        if (!token) {
            router.push("/404");
            return;
        }

        const fetchData = async () => {
            try {
                const [orderRes, userRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/order/${id}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/user`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    })
                ]);

                const orderData = await orderRes.json();
                const userData = await userRes.json();

                if (!orderData?.order?.id) {
                    router.push("/404");
                    return;
                }

                setOrder(orderData.order);
                setShop({
                    name: userData?.shop?.name || "Shop Thời Trang",
                    phone: userData?.shop?.phone || "0123 456 789",
                    email: userData?.shop?.email || "shop@example.com"
                });
            } catch (err) {
                console.error("🚨 Lỗi tải dữ liệu:", err);
                router.push("/404");
            }
        };

        fetchData();
    }, [id, router]);

    const downloadInvoice = async () => {
        try {
            const token = Cookies.get("authToken");
            const response = await fetch(`${API_BASE_URL}/orders/${order?.id}/invoice`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Không thể tải hóa đơn");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice_order_${order?.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("🚨 Lỗi tải hóa đơn:", err);
            alert("Không thể tải hóa đơn. Vui lòng thử lại.");
        }
    };

    if (!order) return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-[#db4444] rounded-full animate-spin"></div>
            <div className="text-gray-700 text-sm">Đang tải thông tin đơn hàng...</div>
        </div>
    );

    return (
        <>
            <div className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </button>

                <div className="flex gap-6 items-start">
                    <div className="w-1/3 space-y-4">
                        <BuyerInfoCard buyer={order.buyer} />
                    </div>
                    <div className="w-2/3 space-y-6">
                        <OrderProgress order={order} setOrder={setOrder} />
                    </div>
                </div>

                <div className="mt-10">
                    <ProductListTable products={order.products} shippingStatus={order.shipping_status} />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => setShowInvoice(true)}
                        className="mt-4 px-6 py-2 bg-[#db4444] text-white rounded-xl hover:bg-[#c73333] transition"
                    >
                        Xem hoá đơn
                    </button>
                </div>
            </div>

            {showInvoice && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowInvoice(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-3xl w-full relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Nút đóng */}
                        <button
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                            onClick={() => setShowInvoice(false)}
                        >
                            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        </button>

                        {/* Bill */}
                        <OrderInvoice order={order} shop={shop} />

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={downloadInvoice}
                                className="px-6 py-2 bg-[#db4444] text-white rounded-xl hover:bg-[#c73333] transition"
                            >
                                Xuất hoá đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
