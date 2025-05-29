// components/ProfitChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "M", Sales: 50, Revenue: 65 },
  { name: "T", Sales: 80, Revenue: 80 },
  { name: "W", Sales: 65, Revenue: 70 },
  { name: "T", Sales: 78, Revenue: 78 },
  { name: "F", Sales: 38, Revenue: 55 },
  { name: "S", Sales: 70, Revenue: 80 },
  { name: "S", Sales: 55, Revenue: 80 },
];

export default function ProfitChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-800">Profit this week</h2>
        <select className="text-sm text-gray-600 bg-transparent focus:outline-none">
          <option>This Week</option>
        </select>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend iconType="circle" iconSize={10} />
            <Bar dataKey="Sales" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Revenue" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
