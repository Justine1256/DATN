"use client";

import { useState } from "react";
import { Eye, Edit3, Trash2, ChevronDown, Search, Filter, Download, Plus } from "lucide-react";

const mockOrders = [
  {
    id: "#324587/80",
    date: "2024-02-28",
    customer: "Juliette Tremblay",
    priority: "Normal",
    total: "$832.00",
    payment: "Paid",
    items: 3,
    delivery: "#D-23456789",
    status: "Completed",
  },
  {
    id: "#846293/80",
    date: "2024-02-21",
    customer: "Nathan Lefebvre",
    priority: "High",
    total: "$1,122.00",
    payment: "Refund",
    items: 5,
    delivery: "-",
    status: "Canceled",
  },
  {
    id: "#783245/80",
    date: "2024-01-15",
    customer: "Camille Bouchard",
    priority: "Normal",
    total: "$956.00",
    payment: "Paid",
    items: 2,
    delivery: "#D-90876543",
    status: "Packaging",
  },
  {
    id: "#658234/80",
    date: "2024-01-07",
    customer: "Louis Moreau",
    priority: "High",
    total: "$2,145.00",
    payment: "Paid",
    items: 7,
    delivery: "#D-98765432",
    status: "Completed",
  },
  {
    id: "#823476/80",
    date: "2024-03-10",
    customer: "Emma Gagnon",
    priority: "Normal",
    total: "$1,058.00",
    payment: "Refund",
    items: 3,
    delivery: "-",
    status: "Canceled",
  },
  {
    id: "#946271/80",
    date: "2024-04-01",
    customer: "Lucas Caron",
    priority: "High",
    total: "$1,612.00",
    payment: "Paid",
    items: 6,
    delivery: "#D-73829184",
    status: "Draft",
  },
  {
    id: "#104836/80",
    date: "2024-03-25",
    customer: "Lea Fortin",
    priority: "Normal",
    total: "$1,210.00",
    payment: "Paid",
    items: 4,
    delivery: "#D-84576123",
    status: "Completed",
  },
  {
    id: "#478235/80",
    date: "2024-02-05",
    customer: "Gabriel Lemoine",
    priority: "High",
    total: "$1,345.00",
    payment: "Refund",
    items: 5,
    delivery: "-",
    status: "Canceled",
  },
  {
    id: "#203947/80",
    date: "2024-01-28",
    customer: "Sophie Martel",
    priority: "Normal",
    total: "$1,089.00",
    payment: "Paid",
    items: 3,
    delivery: "#D-12312312",
    status: "Packaging",
  },
  {
    id: "#582046/80",
    date: "2024-02-18",
    customer: "Mathieu Ouellet",
    priority: "High",
    total: "$1,722.00",
    payment: "Paid",
    items: 6,
    delivery: "#D-84930284",
    status: "Completed",
  }
];

const statusConfig = {
  Paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Draft: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  Packaging: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Canceled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  Refund: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" }
};

const priorityConfig = {
  High: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Normal: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" }
};

export default function ModernOrderTable() {
  const [orders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterExactDate, setFilterExactDate] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === "All" || order.status === filterStatus;
    const matchExactDate = filterExactDate ? order.date === filterExactDate : true;
    const matchPeriod = filterPeriod ? order.date.startsWith(filterPeriod) : true;
    const matchSearch = searchTerm ?
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchStatus && matchExactDate && matchPeriod && matchSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  return (
    <div className="min-h-screen bg-gray-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order Management</h1>
              <p className="text-gray-500 mt-1">Manage and track all your orders efficiently</p>
            </div>
            {/* <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              <Plus size={18} />
              New Order
            </button> */}
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-80 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                  >
                    <option value="">This month</option>
                    <option value="2024-03">Last month</option>
                    <option value="2024">This year</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <input
                  type="date"
                  value={filterExactDate}
                  onChange={(e) => setFilterExactDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                />

                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <button className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="py-5 px-6">
                      <span className="font-mono text-sm font-medium text-gray-900">{order.id}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm text-gray-600">{order.date}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">{order.customer}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig[order.priority as keyof typeof priorityConfig]?.bg} ${priorityConfig[order.priority as keyof typeof priorityConfig]?.text} ${priorityConfig[order.priority as keyof typeof priorityConfig]?.border}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-semibold text-gray-900">{order.total}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.payment as keyof typeof statusConfig]?.bg} ${statusConfig[order.payment as keyof typeof statusConfig]?.text} ${statusConfig[order.payment as keyof typeof statusConfig]?.border}`}>
                        {order.payment}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm text-gray-600">{order.items}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-mono text-gray-600">{order.delivery}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status as keyof typeof statusConfig]?.bg} ${statusConfig[order.status as keyof typeof statusConfig]?.text} ${statusConfig[order.status as keyof typeof statusConfig]?.border}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + ordersPerPage, filteredOrders.length)} of {filteredOrders.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}