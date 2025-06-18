import React from "react";

interface OrderFilterTabsProps {
    activeTab: string;
    onFilterChange: (status: string) => void;
}

interface Tab {
    key: string;
    label: string;
}

export default function OrderFilterTabs({ activeTab, onFilterChange }: OrderFilterTabsProps) {
    const tabs: Tab[] = [
        { key: "all", label: "Tất cả" },
        { key: "processing", label: "Đang xử lý" },
        { key: "shipping", label: "Đang giao" },
        { key: "delivered", label: "Đã giao" },
        { key: "canceled", label: "Đã hủy" },
    ];

    return (
        <div className="flex justify-center mb-6 gap-4">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onFilterChange(tab.key)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${
                        activeTab === tab.key
                            ? "bg-[#db4444] text-white"
                            : "bg-gray-200 text-black"
                    } hover:bg-[#db4444] hover:text-white hover:scale-105`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
