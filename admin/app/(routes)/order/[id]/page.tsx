"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import OrderProgress from "@/app/components/order/OrderProgress";
import ProductListTable from "@/app/components/order/ProductListTable";
import BuyerInfoCard from "@/app/components/order/BuyerInfoCard";
import { ChevronLeft } from "lucide-react";
import type { Order } from "../../../ts/oder";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // unwrap promise
    const [order, setOrder] = useState<Order | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get("authToken");
        if (!token) {
            router.push("/404");
            return;
        }

        fetch(`${API_BASE_URL}/admin/order/${id}`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (!data?.order?.id) {
                    router.push("/404");
                } else {
                    console.log("✅ Đơn hàng nhận được:", data.order);
                    setOrder(data.order);
                }
            })
            .catch(() => router.push("/404"));
    }, [id, router]);

    if (!order) return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-[#db4444] rounded-full animate-spin"></div>
            <div className="text-gray-700 text-sm">Đang tải thông tin đơn hàng...</div>
        </div>
    );
      

    return (
        <div className=" space-y-4">
            {/* Nút quay lại */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Quay lại
            </button>

            <div className="flex gap-6 items-start">
                <div className="w-2/3 space-y-6">
                    <OrderProgress order={order} setOrder={setOrder} />
                </div>
                <div className="w-1/3 space-y-4">
                    <BuyerInfoCard buyer={order.buyer} />
                </div>
            </div>

            <div className="mt-10">
                <ProductListTable products={order.products} shippingStatus={order.shipping_status} />
            </div>
        </div>
    );
}
