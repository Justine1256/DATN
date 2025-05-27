// app/dashboard/components/StatCard.tsx
"use client";

import { ReactNode } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type Props = {
  icon: ReactNode;
  title: string;
  value: string;
  color: string;
  data: { value: number }[];
};

export default function StatCard({ icon, title, value, color, data }: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-3 rounded-full bg-opacity-20`} style={{ backgroundColor: color }}>
          <div className="text-xl" style={{ color }}>{icon}</div>
        </div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-2">{value}</div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke={color} fill={`${color}33`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
