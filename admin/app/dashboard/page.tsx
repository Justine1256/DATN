"use client";
import React, { useEffect } from "react";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import ProfitChart from "../components/dashboard/ProfitChart";
import SummaryCards from "../components/dashboard/SummaryCards";
import RecentOrders from "../components/dashboard/RecentOrders";
import Swal from "sweetalert2";

export default function DashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Access Token:", token);

    // ✅ Tùy chỉnh style SweetAlert2: hover nút đóng thành đỏ, không viền
    const style = document.createElement("style");
    style.innerHTML = `
      .swal2-close {
        color: #999 !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
      }
      .swal2-close:hover {
        color: red !important;
      }
    `;
    document.head.appendChild(style);

    // ✅ Hiển thị popup khi truy cập dashboard
    Swal.fire({
      title: "Chào mừng trở lại!",
      text: "Bạn đang xem bảng điều khiển tổng quan.",
      icon: "info",
      showCloseButton: true,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      allowOutsideClick: true,
    });

    // ✅ Cleanup khi component unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <SummaryCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <ProfitChart />
        </div>
      </div>
      <RecentOrders />
    </div>
  );
}
