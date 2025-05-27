"use client";

import StatCard from "./StatCard";
import { FaShoppingBasket, FaLeaf, FaHandshake, FaWallet } from "react-icons/fa";

const dummy = [10, 30, 20, 40, 25, 35].map(v => ({ value: v }));

export default function OverviewCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<FaShoppingBasket />} title="Total Orders" value="15,432" color="#22c55e" data={dummy} />
      <StatCard icon={<FaLeaf />} title="New Leads" value="12,983" color="#3b82f6" data={dummy} />
      <StatCard icon={<FaHandshake />} title="Deals" value="1,283" color="#60a5fa" data={dummy} />
      <StatCard icon={<FaWallet />} title="Booked Revenue" value="$234.8k" color="#10b981" data={dummy} />
    </div>
  );
}
