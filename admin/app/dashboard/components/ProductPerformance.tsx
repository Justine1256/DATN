// app/dashboard/components/ProductPerformance.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, Legend, CartesianGrid } from "recharts";

const data = [
  { name: "Jan", page: 32, click: 7, social: 23 },
  { name: "Feb", page: 65, click: 12, social: 40 },
  { name: "Mar", page: 43, click: 6, social: 34 },
  { name: "Apr", page: 67, click: 15, social: 26 },
  { name: "May", page: 48, click: 20, social: 45 },
  { name: "Jun", page: 59, click: 10, social: 21 },
  { name: "Jul", page: 39, click: 4, social: 18 },
  { name: "Aug", page: 45, click: 9, social: 29 },
  { name: "Sep", page: 72, click: 6, social: 22 },
  { name: "Oct", page: 51, click: 28, social: 23 },
  { name: "Nov", page: 61, click: 12, social: 11 },
  { name: "Dec", page: 58, click: 30, social: 17 },
];

export default function ProductPerformance() {
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Product Performance</h2>
        <div className="flex gap-2 text-sm">
          {["ALL", "1M", "6M", "1Y"].map((t) => (
            <button
              key={t}
              className={`px-3 py-1 rounded border text-gray-600 hover:bg-gray-100 ${
                t === "1Y" ? "bg-gray-100 font-semibold" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 text-center text-sm text-gray-500 gap-4">
        <div><p>Total Sales</p><p className="text-lg font-bold text-gray-800">$50.4k</p></div>
        <div><p>Total Refunds</p><p className="text-lg font-bold text-gray-800">$3.2k</p></div>
        <div><p>Total Orders</p><p className="text-lg font-bold text-gray-800">1,200</p></div>
        <div><p>Net Profit</p><p className="text-lg font-bold text-gray-800">$15.7k</p></div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="page" fill="#06b6d4" name="Page Views" />
            <Bar dataKey="click" fill="#22c55e" name="Clicks" />
            <Line dataKey="social" stroke="#facc15" name="Social Media" strokeDasharray="5 5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
