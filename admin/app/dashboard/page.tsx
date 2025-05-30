"use client";
import React, { useEffect } from "react";

// 📊 Biểu đồ hiệu suất và lợi nhuận
import PerformanceChart from "../components/dashboard/PerformanceChart";
import ProfitChart from "../components/dashboard/ProfitChart";

// 📋 Thẻ tổng quan và đơn hàng gần đây
import SummaryCards from "../components/dashboard/SummaryCards";
import RecentOrders from "../components/dashboard/RecentOrders";

export default function DashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Access Token:", token);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Tiêu đề Dashboard */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>

      {/* Các thẻ tổng quan (doanh thu, đơn hàng...) */}
      <SummaryCards />

      {/* Biểu đồ hiệu suất và lợi nhuận */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <ProfitChart />
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <RecentOrders />
    </div>
  );
}
