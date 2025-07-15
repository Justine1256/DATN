"use client";

import Image from "next/image";
import { STATIC_BASE_URL } from "@/utils/api";
import { Diamond, Star, Medal, Crown, User } from "lucide-react";

type Buyer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  rank: "member" | "gold" | "silver" | "bronze" | "diamond";
  avatar: string;
};

export default function BuyerInfoCard({ buyer }: { buyer: Buyer }) {
  const rankMap: Record<string, { label: string; icon: any; color: string }> = {
    member: { label: "Thành viên", icon: <User className="w-4 h-4" />, color: "text-gray-600" },
    gold: { label: "Vàng", icon: <Crown className="w-4 h-4 text-yellow-500" />, color: "text-yellow-600" },
    silver: { label: "Bạc", icon: <Medal className="w-4 h-4 text-gray-400" />, color: "text-gray-500" },
    bronze: { label: "Đồng", icon: <Medal className="w-4 h-4 text-amber-700" />, color: "text-amber-700" },
    diamond: { label: "Kim cương", icon: <Diamond className="w-4 h-4 text-blue-400" />, color: "text-blue-500" },
  };

  const rankInfo = rankMap[buyer.rank] || rankMap["member"];

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-5 w-full flex flex-col items-center">
      <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">Thông tin người mua</h3>
      <Image
        src={`${STATIC_BASE_URL}/${buyer.avatar}`}
        alt={buyer.name || "Avatar người mua"}
        width={90}
        height={90}
        className="rounded-full border-2 border-gray-300 shadow-lg mb-4"
      />

      <div className="flex flex-col items-start w-full max-w-xs">
        <p><span className="font-semibold">Tên:</span> {buyer.name}</p>
        <p><span className="font-semibold">Email:</span> {buyer.email}</p>
        <p><span className="font-semibold">Điện thoại:</span> {buyer.phone}</p>
        <div className={`inline-flex items-center gap-1 mt-1 ${rankInfo.color}`}>
          Rank:{rankInfo.icon}
          <span className="font-semibold">{rankInfo.label}</span>
        </div>
      </div>
    </div>
  );
}
