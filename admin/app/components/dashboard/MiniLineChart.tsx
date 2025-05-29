"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniLineChartProps {
  color: string;
  fillOpacity?: number;
}

const data = [
  { value: 10 },
  { value: 20 },
  { value: 15 },
  { value: 30 },
  { value: 25 },
];

export default function MiniLineChart({ color }: MiniLineChartProps) {
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
