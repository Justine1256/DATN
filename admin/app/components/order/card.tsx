import { ReactNode } from "react";

type OrderStatusCardProps = {
  title: string;
  count: number;
  icon: ReactNode;
};

export default function OrderStatusCard({ title, count, icon }: OrderStatusCardProps) {
  return (
    <div className="bg-white shadow rounded-[5px] p-4 flex justify-between items-center hover:shadow-md transition-all duration-200 ease-in-out h-24">
      <div>
        <h3 className="text-[14px] font-semibold text-[#313B5E]">{title}</h3>
        <p className="text-[20px] font-medium mt-1 text-[#5D7186]">{count}</p>
      </div>
      <div className="bg-blue-100 p-3 rounded-xl text-blue-600 text-[22px]">
        {icon}
      </div>
    </div>
  );
}
