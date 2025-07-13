"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import OrderProgress from "@/app/components/order/OrderProgress";
import ProductListTable from "@/app/components/order/ProductListTable";
import BuyerInfoCard from "@/app/components/order/BuyerInfoCard";
import type { Order } from "../../../ts/oder";


export default function OrderDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
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

    if (!order) return <div className="p-10">Đang tải đơn hàng...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex gap-6 items-start">
                <div className="w-2/3 space-y-6">
                    <OrderProgress order={order} setOrder={setOrder} />
                  =
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
