"use client";

import OrderProgress from "@/app/components/order/OrderProgress";

export default function OrderDetailPage({ order, setOrder }) {
    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Tiến trình */}
            <OrderProgress order={order} setOrder={setOrder} />
        </div>
    );
}
