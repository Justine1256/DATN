"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import OrderDetailClient from "@/app/components/order/detail";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);  // ⭐ unwrap promise

    const [order, setOrder] = useState<any>(null);
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
                    setOrder(data.order);
                }
            })
            .catch(() => router.push("/404"));
    }, [id, router]);

    if (!order) return <div className="p-10">Đang tải đơn hàng...</div>;

    return <OrderDetailClient order={order} />;
}
