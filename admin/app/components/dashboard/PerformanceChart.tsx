"use client";
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, Calendar,
  RefreshCw, Maximize2, Eye, EyeOff
} from 'lucide-react';
import type { TooltipProps } from 'recharts';

type DataKey = 'revenue' | 'orders' | 'customers';

interface ChartDatum {
  name: string;
  revenue: number;
  orders: number;
  customers: number;
}

const chartData: ChartDatum[] = [
  { name: 'Jan', revenue: 45000, orders: 240, customers: 180 },
  { name: 'Feb', revenue: 38000, orders: 198, customers: 165 },
  { name: 'Mar', revenue: 52000, orders: 280, customers: 220 },
  { name: 'Apr', revenue: 48000, orders: 258, customers: 195 },
  { name: 'May', revenue: 61000, orders: 320, customers: 280 },
  { name: 'Jun', revenue: 55000, orders: 290, customers: 245 },
  { name: 'Jul', revenue: 68000, orders: 385, customers: 320 },
  { name: 'Aug', revenue: 72000, orders: 410, customers: 350 },
  { name: 'Sep', revenue: 65000, orders: 365, customers: 310 },
  { name: 'Oct', revenue: 78000, orders: 445, customers: 390 },
  { name: 'Nov', revenue: 82000, orders: 480, customers: 420 },
  { name: 'Dec', revenue: 95000, orders: 550, customers: 485 }
];

// Scale revenue /1000
const scaledData = chartData.map(d => ({
  name: d.name,
  revenue: d.revenue / 1000, // e.g. 95
  orders: d.orders,
  customers: d.customers
}));

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2">{`Month: ${label}`}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600 capitalize">{entry.dataKey}</span>
            </div>
            <span className="font-medium text-gray-900">
              {entry.dataKey === 'revenue'
                ? `$${(entry.value ?? 0).toFixed(1)}k`
                : (entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardChart() {
  const [selectedMetrics, setSelectedMetrics] = useState<Record<DataKey, boolean>>({
    revenue: true,
    orders: true,
    customers: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRange] = useState('12M');

  const currentRevenue = (chartData[chartData.length - 1]?.revenue || 0) / 1000;
  const previousRevenue = (chartData[chartData.length - 2]?.revenue || 0) / 1000;
  const growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
  const isPositiveGrowth = Number(growthPercentage) > 0;

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const toggleMetric = (metric: DataKey) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : 'col-span-12'
      }`}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Product Performance</h2>
            <p className="text-sm text-gray-600">Track your business metrics over time</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isPositiveGrowth ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
            {isPositiveGrowth ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{Math.abs(Number(growthPercentage))}%</span>
            <span className="text-xs">vs last month</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['revenue', 'orders', 'customers'] as DataKey[]).map(metric => (
              <button
                key={metric}
                onClick={() => toggleMetric(metric)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${selectedMetrics[metric]
                    ? metric === 'revenue'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : metric === 'orders'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {selectedMetrics[metric] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={refreshData} disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-4 h-4" /> {timeRange}
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-6 mb-6">
          {selectedMetrics.revenue && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-semibold text-gray-900">${currentRevenue.toFixed(1)}k</span>
            </div>
          )}
          {selectedMetrics.orders && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Orders</span>
              <span className="text-sm font-semibold text-gray-900">{chartData[chartData.length - 1].orders.toLocaleString()}</span>
            </div>
          )}
          {selectedMetrics.customers && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-600">Customers</span>
              <span className="text-sm font-semibold text-gray-900">{chartData[chartData.length - 1].customers.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Updating chart...</span>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height={isFullscreen ? 500 : 350}>
            <BarChart data={scaledData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {selectedMetrics.revenue && (
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              )}
              {selectedMetrics.orders && (
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              )}
              {selectedMetrics.customers && (
                <Bar dataKey="customers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
