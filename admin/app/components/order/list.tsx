"use client";

import { useState } from "react";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { IoChevronDownSharp } from "react-icons/io5";

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
      },
    {
        id: "#578246/80",
        date: "2024-04-19",
        customer: "David A. Arnold",
        priority: "High",
        total: "$1,478.00",
        payment: "Paid",
        items: 5,
        delivery: "#D-57837678",
        status: "Draft",
      },
    {
      id: "#578246/80",
      date: "2024-04-19",
      customer: "David A. Arnold",
      priority: "High",
      total: "$1,478.00",
      payment: "Paid",
      items: 5,
      delivery: "#D-57837678",
      status: "Completed",
    },
    {
      id: "#348930/80",
      date: "2024-04-04",
      customer: "Cecile D. Gordon",
      priority: "Normal",
      total: "$720.00",
      payment: "Refund",
      items: 4,
      delivery: "-",
      status: "Canceled",
    },
    {
      id: "#391367/80",
      date: "2024-04-02",
      customer: "William Moreno",
      priority: "Normal",
      total: "$1,909.00",
      payment: "Paid",
      items: 6,
      delivery: "#D-89734235",
      status: "Completed",
    },
    {
      id: "#930447/80",
      date: "2024-03-28",
      customer: "Alphonse Roy",
      priority: "High",
      total: "$879.00",
      payment: "Paid",
      items: 4,
      delivery: "#D-35227268",
      status: "Completed",
    },
    {
      id: "#462397/80",
      date: "2024-03-20",
      customer: "Pierpont Marleau",
      priority: "High",
      total: "$1,230.00",
      payment: "Refund",
      items: 2,
      delivery: "-",
      status: "Canceled",
    },
    {
      id: "#472356/80",
      date: "2024-03-12",
      customer: "Madeleine Gervais",
      priority: "Normal",
      total: "$1,264.00",
      payment: "Paid",
      items: 3,
      delivery: "#D-74922656",
      status: "Completed",
    },
    {
      id: "#448226/80",
      date: "2024-03-02",
      customer: "Satorid Gaillou",
      priority: "High",
      total: "$1,787.00",
      payment: "Paid",
      items: 4,
      delivery: "-",
      status: "Packaging",
    },
  ];
  
  
const statusColorMap = {
  Paid: "bg-green-500 text-white",
  Draft: "bg-gray-200 text-gray-700",
  Packaging: "bg-yellow-100 text-yellow-700 border border-yellow-400",
  Completed: "bg-green-100 text-green-700 border border-green-400",
  Canceled: "bg-orange-100 text-orange-700 border border-orange-400",
};

export default function OrderListTable() {
    const [orders] = useState(mockOrders);
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterExactDate, setFilterExactDate] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 6;
  
    // ✅ Lọc theo bộ lọc người dùng chọn
    const filteredOrders = orders.filter((order) => {
      const matchStatus = filterStatus === "All" || order.status === filterStatus;
      const matchExactDate = filterExactDate ? order.date === filterExactDate : true;
      const matchPeriod = filterPeriod ? order.date.startsWith(filterPeriod) : true;
      return matchStatus && matchExactDate && matchPeriod;
    });
  
    // ✅ Phân trang
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
    return (
      <div className="p-0">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th colSpan={10} className="px-4 py-3">
                  <div className="flex flex-wrap justify-between items-center">
                    <h2 className="text-[20px] font-semibold text-[#313B5E] capitalize normal-case">
                      All order list
                    </h2>
  
                    <div className="flex flex-wrap gap-3">
                      <div className="relative w-[140px]">
                        <select
                          value={filterPeriod}
                          onChange={(e) => setFilterPeriod(e.target.value)}
                          className="appearance-none font-normal capitalize w-full text-sm px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#313B5E] focus:ring-2 focus:ring-blue-200 focus:outline-none cursor-pointer"
                        >
                          <option value="">This month</option>
                          <option value="2024-03">Last month</option>
                          <option value="2024">This year</option>
                        </select>
                        <IoChevronDownSharp className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
  
                      <input
                        type="date"
                        value={filterExactDate}
                        onChange={(e) => setFilterExactDate(e.target.value)}
                        className="w-[180px] text-sm font-normal px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#313B5E] focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
  
                      <div className="relative w-[160px]">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="appearance-none font-normal capitalize w-full text-sm px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#313B5E] focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        >
                          <option value="All">All status</option>
                          <option value="Draft">Draft</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Completed">Completed</option>
                          <option value="Canceled">Canceled</option>
                        </select>
                        <IoChevronDownSharp className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
  
                      <div className="relative w-[140px]">
                        <select className="appearance-none font-normal capitalize w-full text-sm px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#313B5E] focus:ring-2 focus:ring-blue-200 focus:outline-none">
                          <option>Export</option>
                          <option>Import</option>
                        </select>
                        <IoChevronDownSharp className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
  
              <tr className="uppercase font-semibold text-[11px] text-[#777] tracking-wider">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Created at</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Delivery Number</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
  
            <tbody className="bg-white">
              {paginatedOrders.map((order, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.date}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{order.customer}</td>
                  <td className="px-4 py-3">{order.priority}</td>
                  <td className="px-4 py-3">{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusColorMap[order.payment] || ""}`}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.items}</td>
                  <td className="px-4 py-3">{order.delivery}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusColorMap[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                      <FiEye />
                    </button>
                    <button className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition">
                      <FiEdit />
                    </button>
                    <button className="p-2 rounded bg-orange-100 text-orange-600 hover:bg-orange-200 transition">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* ✅ Pagination */}
        <div className="mt-6 flex justify-end gap-2 text-sm text-[#313B5E]">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded ${currentPage === 1 ? "bg-gray-100 text-gray-400" : "hover:bg-gray-100 border-gray-300"}`}
          >
            Trang Trước
          </button>
  
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}
  
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded ${currentPage === totalPages ? "bg-gray-100 text-gray-400" : "hover:bg-gray-100 border-gray-300"}`}
          >
            Trang sau
          </button>
        </div>
      </div>
    );
  }
