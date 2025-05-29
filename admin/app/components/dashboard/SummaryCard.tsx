// components/dashboard/SummaryCard.tsx
import { motion } from "framer-motion";
import { IconType } from "react-icons";

interface SummaryCardProps {
  icon: IconType;
  label: string;
  value: string;
  color: string;
  chart: React.ReactNode;
}

export default function SummaryCard({ icon: Icon, label, value, color, chart }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-4 rounded-xl shadow hover:shadow-md transition duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${color} bg-opacity-10`}>
          <Icon className={`${color} text-xl`} />
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
