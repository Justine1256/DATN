"use client";

import PerformanceChart from "../components/dashboard/PerformanceChart";
import ProfitChart from "../components/dashboard/ProfitChart"; // ⬅️ Import mới

import SummaryCards from "../components/dashboard/SummaryCards";
import RecentOrders from "../components/dashboard/RecentOrders";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>

      <SummaryCards />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <ProfitChart /> {/* ✅ Gắn biểu đồ Profit bên phải */}
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  );
}
