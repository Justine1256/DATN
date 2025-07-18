import { ReactNode, useEffect, useState } from "react";

type OrderStatusCardProps = {
  title: string;
  count: number;
  icon: ReactNode;
  colorIndex?: number;
  isAmount?: boolean;
};

const colors = [
  { hover: 'hover:border-blue-300', bg: 'bg-blue-100', text: 'text-blue-600' },
  { hover: 'hover:border-emerald-300', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { hover: 'hover:border-amber-300', bg: 'bg-amber-100', text: 'text-amber-600' },
  { hover: 'hover:border-violet-300', bg: 'bg-violet-100', text: 'text-violet-600' },
  { hover: 'hover:border-rose-300', bg: 'bg-rose-100', text: 'text-rose-600' },
  { hover: 'hover:border-indigo-300', bg: 'bg-indigo-100', text: 'text-indigo-600' }
];

export default function OrderStatusCard({
  title,
  count,
  icon,
  colorIndex = 0,
  isAmount = false
}: OrderStatusCardProps) {
  const color = colors[colorIndex % colors.length];
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const step = count / (duration / 50);
    let currentValue = 0;

    const interval = setInterval(() => {
      currentValue += step;
      if (currentValue >= count) {
        clearInterval(interval);
        currentValue = count;
      }
      setCurrentCount(Math.floor(currentValue));
    }, 50);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 ${color.hover} transition-colors duration-200`}>
      <div className="flex items-center gap-4">
        <div className={`${color.bg} p-3 rounded-lg ${color.text} text-2xl`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{title}</span>
          <span className="text-xl font-semibold text-gray-800">
            {isAmount
              ? `${currentCount.toLocaleString('vi-VN')} đ`
              : currentCount.toLocaleString('vi-VN')
            }
          </span>
        </div>
      </div>
    </div>
  );
}
