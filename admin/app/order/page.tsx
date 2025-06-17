"use client";

import OrderStatusCard from "../components/order/card";
import OrderListTable from "../components/order/list"; // 👈 bảng danh sách
import {
  BsCartX, BsBoxSeam, BsClipboardCheck,
  BsClock, BsBagCheckFill, BsInboxes,
} from "react-icons/bs";

const orderData = [
  { title: "Order Cancel", count: 241, icon: <BsCartX /> },
  { title: "Order Shipped", count: 630, icon: <BsBoxSeam /> },
  { title: "Pending Review", count: 210, icon: <BsClipboardCheck /> },
  { title: "Pending Payment", count: 608, icon: <BsClock /> },
  { title: "Delivered", count: 200, icon: <BsBagCheckFill /> },
  { title: "In Progress", count: 656, icon: <BsInboxes /> },
];

export default function OrdersPage() {
  return (
    <div className="p-4 pt-2 space-y-6">
      <div>
      <h1 className="text-2xl font-bold text-[#DC4B47] mb-3 flex items-center gap-2">
  Orders List
</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {orderData.map((item, index) => (
            <OrderStatusCard key={index} {...item} />
          ))}
        </div>
      </div>

      <OrderListTable /> {/* 👈 bảng danh sách phía dưới */}
    </div>
  );
}
