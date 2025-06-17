"use client";

import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { FaShoppingCart, FaLeaf, FaHandshake, FaWallet } from "react-icons/fa";
import MiniLineChart from "./MiniLineChart";

interface SummaryCardProps {
  icon: IconType;
  label: string;
  value: string;
  color: string;
  chart: React.ReactNode;
}

function SummaryCard({ icon: Icon, label, value, color, chart }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-4 rounded-xl shadow hover:shadow-md transition duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon style={{ color }} className="text-xl" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
      <div className="mt-4">{chart}</div>
    </motion.div>
  );
}

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <SummaryCard
        icon={FaShoppingCart}
        label="Total Orders"
        value="15,432"
        color="#2563eb"
        chart={<MiniLineChart color="#2563eb" fillOpacity={0.10} />} 
      />

      <SummaryCard
        icon={FaLeaf}
        label="New Leads"
        value="12,983"
        color="#16a34a"
        chart={<MiniLineChart color="#16a34a" fillOpacity={0.2} />} 
      />

      <SummaryCard
        icon={FaHandshake}
        label="Deals"
        value="1,283"
        color="#7e22ce"
        chart={<MiniLineChart color="#7e22ce" fillOpacity={0.2} />} 
      />

      <SummaryCard
        icon={FaWallet}
        label="Booked Revenue"
        value="$234.8k"
        color="#9333ea"
        chart={<MiniLineChart color="#9333ea" fillOpacity={0.2} />} 
      />
    </div>
  );
}
