import { ReactNode } from "react";

type OrderStatusCardProps = {
  title: string;
  count: number;
  icon: ReactNode;
  colorIndex?: number;
};

const colors = [
  { hover: 'hover:border-blue-300', bg: 'bg-blue-100', text: 'text-blue-600' },
  { hover: 'hover:border-emerald-300', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { hover: 'hover:border-amber-300', bg: 'bg-amber-100', text: 'text-amber-600' },
  { hover: 'hover:border-violet-300', bg: 'bg-violet-100', text: 'text-violet-600' },
  { hover: 'hover:border-rose-300', bg: 'bg-rose-100', text: 'text-rose-600' },
  { hover: 'hover:border-indigo-300', bg: 'bg-indigo-100', text: 'text-indigo-600' }
];

export default function OrderStatusCard({ title, count, icon, colorIndex = 0 }: OrderStatusCardProps) {
  const color = colors[colorIndex % colors.length];

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${color.hover} transition-colors duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600 mb-2">{title}</h3>
          <p className="text-2xl font-bold text-slate-800">{count}</p>
        </div>
        <div className={`${color.bg} p-3 rounded-lg ${color.text} text-xl ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  );
}