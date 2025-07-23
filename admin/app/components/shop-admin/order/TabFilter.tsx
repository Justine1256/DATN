"use client";

import React from "react";

interface Tab {
    key: string;
    label: string;
    count: number;
    color: string;
}

interface TabFilterProps {
    tabConfig: Tab[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setFilterStatus: (status: string) => void;
}

const TabFilter: React.FC<TabFilterProps> = ({
    tabConfig,
    activeTab,
    setActiveTab,
    setFilterStatus,
}) => {
    return (
        <div className="flex border-b border-gray-200">
            {tabConfig.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => {
                        setActiveTab(tab.key);
                        setFilterStatus(tab.key); // Cập nhật trạng thái lọc
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                >
                    {tab.label}
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${tab.color}`}>
                        {tab.count}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default TabFilter;
