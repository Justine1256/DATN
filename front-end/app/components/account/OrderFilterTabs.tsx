"use client"

import type React from "react"
import { Package, Clock, Truck, CheckCircle, XCircle, RotateCcw } from "lucide-react"

interface OrderFilterTabsProps {
    activeTab: string
    onFilterChange: (status: string) => void
}

interface Tab {
    key: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    activeColors: string
    hoverColors: string
}

export default function OrderFilterTabs({ activeTab, onFilterChange }: OrderFilterTabsProps) {
    const tabs: Tab[] = [
        {
            key: "all",
            label: "Tất cả",
            icon: Package,
            activeColors: "bg-gray-600 text-white",
            hoverColors: "hover:bg-gray-100",
        },
        {
            key: "processing",
            label: "Đang xử lý",
            icon: Clock,
            activeColors: "bg-amber-500 text-white",
            hoverColors: "hover:bg-amber-50",
        },
        {
            key: "shipping",
            label: "Đang giao",
            icon: Truck,
            activeColors: "bg-blue-500 text-white",
            hoverColors: "hover:bg-blue-50",
        },
        {
            key: "delivered",
            label: "Đã giao",
            icon: CheckCircle,
            activeColors: "bg-emerald-500 text-white",
            hoverColors: "hover:bg-emerald-50",
        },
        {
            key: "canceled",
            label: "Đã hủy",
            icon: XCircle,
            activeColors: "bg-red-500 text-white",
            hoverColors: "hover:bg-red-50",
        },
        {
            key: "return_refund",
            label: "Trả hàng/Hoàn tiền",
            icon: RotateCcw,
            activeColors: "bg-purple-500 text-white",
            hoverColors: "hover:bg-purple-50",
        },
    ]

    return (
        <div className="w-full mb-6">
            {/* Mobile Dropdown */}
            <div className="block sm:hidden">
                <select
                    value={activeTab}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {tabs.map((tab) => (
                        <option key={tab.key} value={tab.key}>
                            {tab.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden sm:flex flex-nowrap justify-center gap-3 overflow-x-auto scrollbar-hide">


                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key

                    return (
                        <button
                            key={tab.key}
                            onClick={() => onFilterChange(tab.key)}
                            className={`
    inline-flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2.5
    rounded-full font-normal text-[13px]
    transition-colors duration-200
    whitespace-nowrap
    ${isActive
                                    ? tab.activeColors
                                    : `bg-white text-gray-600 border border-gray-200 ${tab.hoverColors}`}
  `}
                        >
                            <Icon className="w-[14px] h-[14px]" />
                            <span>{tab.label}</span>
                        </button>

                    )
                })}
            </div>
        </div>
    )
}
