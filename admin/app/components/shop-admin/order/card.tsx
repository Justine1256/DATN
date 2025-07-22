import { ReactNode, useEffect, useState } from "react";

type OrderStatusCardProps = {
  title: string;
  count: number;
  icon: ReactNode;
  colorIndex?: number;
  isAmount?: boolean;
  isActive?: boolean;
  onClick?: () => void;
};

const colors = [
  { hover: "hover:border-blue-300", bg: "bg-blue-100", text: "text-blue-600" },
  { hover: "hover:border-emerald-300", bg: "bg-emerald-100", text: "text-emerald-600" },
  { hover: "hover:border-amber-300", bg: "bg-amber-100", text: "text-amber-600" },
  { hover: "hover:border-violet-300", bg: "bg-violet-100", text: "text-violet-600" },
  { hover: "hover:border-rose-300", bg: "bg-rose-100", text: "text-rose-600" },
  { hover: "hover:border-indigo-300", bg: "bg-indigo-100", text: "text-indigo-600" },
];

export default function OrderStatusCard({
  title,
  count,
  icon,
  colorIndex = 0,
  isAmount = false,
  isActive = false,
  onClick,
}: OrderStatusCardProps) {
  const color = colors[colorIndex % colors.length];
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 500;
    const frameRate = 30;
    const totalFrames = duration / frameRate;
    const increment = (count - start) / totalFrames;

    let currentFrame = 0;
    const interval = setInterval(() => {
      currentFrame++;
      const newValue = Math.min(Math.round(start + increment * currentFrame), count);
      setCurrentCount(newValue);
      if (currentFrame >= totalFrames) clearInterval(interval);
    }, frameRate);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer select-none transition-colors duration-200
        border rounded-xl p-5 
        ${isActive ? "border-[#db4444] bg-red-50" : "bg-white border-gray-200"}
        ${color.hover}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`${color.bg} p-3 rounded-lg ${color.text} text-2xl`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{title}</span>
          <span className="text-xl font-semibold text-gray-800">
            {isAmount
              ? `${currentCount.toLocaleString("vi-VN")} đ`
              : currentCount.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>
    </div>
  );
}
