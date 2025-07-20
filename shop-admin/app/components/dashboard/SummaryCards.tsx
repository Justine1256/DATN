"use client";
import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Sprout,
  Handshake,
  Wallet,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ArrowUpRight
} from "lucide-react";

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  trend: boolean;
  trendValue: number;
  isPositive: boolean;
  period?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  trend,
  trendValue,
  isPositive,
  period = "so với tháng trước"
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        current = value;
        clearInterval(timer);
      }
      setAnimatedValue(Math.floor(current));
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`
        relative group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 
        hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 
        transition-all duration-300 ease-out cursor-pointer overflow-hidden
      `}
    >
      {/* Nền mờ decor */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] -mr-16 -mt-16 transition-all duration-500"
        style={{ backgroundColor: color }}
      />

      {/* Nút tuỳ chọn */}
      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center relative
              transition-all duration-300 group-hover:scale-110
            `}
            style={{
              backgroundColor: `${color}15`,
              boxShadow: `0 8px 25px ${color}25`
            }}
          >
            <Icon
              className="w-6 h-6 transition-all duration-300"
              style={{ color: color }}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {animatedValue.toLocaleString()}
              </h3>

              {trend && (
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trendValue}%</span>
                </div>
              )}
            </div>
            {period && (
              <p className="text-xs text-gray-400 mt-1">{period}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-500">Đang hoạt động</span>
        </div>

        <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 group">
          <span>Chi tiết</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default function SummaryCards() {
  const cardData = [
    {
      icon: ShoppingCart,
      label: "Tổng đơn hàng",
      value: 15432,
      color: "#2563eb",
      trend: true,
      trendValue: 12.5,
      isPositive: true
    },
    {
      icon: Sprout,
      label: "Khách hàng mới",
      value: 12983,
      color: "#16a34a",
      trend: true,
      trendValue: 8.2,
      isPositive: true
    },
    {
      icon: Handshake,
      label: "Giao dịch",
      value: 1283,
      color: "#7e22ce",
      trend: true,
      trendValue: -2.1,
      isPositive: false
    },
    {
      icon: Wallet,
      label: "Doanh thu đặt chỗ",
      value: 234800,
      color: "#9333ea",
      trend: true,
      trendValue: 15.8,
      isPositive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cardData.map((card, index) => (
        <SummaryCard
          key={index}
          {...card}
        />
      ))}
    </div>
  );
}
