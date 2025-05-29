"use client";
import { FaShoppingBasket, FaSeedling, FaHandshake, FaWallet } from "react-icons/fa";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const chartData = Array.from({ length: 10 }, (_, i) => ({
  name: `P${i + 1}`,
  value: Math.floor(Math.random() * 100) + 1,
}));

const cards = [
  {
    title: "Total Orders",
    value: "15,432",
    icon: <FaShoppingBasket className="text-xl text-blue-600" />,
    color: "bg-blue-50",
    stroke: "#22c55e",
  },
  {
    title: "New Leads",
    value: "12,983",
    icon: <FaSeedling className="text-xl text-green-600" />,
    color: "bg-green-50",
    stroke: "#3b82f6",
  },
  {
    title: "Deals",
    value: "1,283",
    icon: <FaHandshake className="text-xl text-lime-600" />,
    color: "bg-lime-50",
    stroke: "#3b82f6",
  },
  {
    title: "Booked Revenue",
    value: "$234.8k",
    icon: <FaWallet className="text-xl text-indigo-600" />,
    color: "bg-indigo-50",
    stroke: "#22c55e",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition duration-300"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{card.title}</p>
              <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
            </div>
          </div>
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="value" stroke={card.stroke} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}