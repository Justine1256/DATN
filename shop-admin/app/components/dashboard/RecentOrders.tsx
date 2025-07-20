"use client";

import { useState } from "react";
import { FaCreditCard, FaPaypal } from "react-icons/fa";
import Image from "next/image";

const orders = [
  {
    id: "#TZ5625",
    date: "29 April 2024",
    image: "/images/laptop.png",
    customer: "Anna M. Hines",
    phone: "(+1)-555–1564–261",
    address: "Burr Ridge/Illinois",
    payment: "Credit Card",
    status: "Completed",
  },
  {
    id: "#TZ9652",
    date: "25 April 2024",
    image: "/images/camera.png",
    customer: "Judith H. Fritsche",
    phone: "(+57)-305–5579–759",
    address: "SULLIVAN/Kentucky",
    payment: "Credit Card",
    status: "Completed",
  },
  {
    id: "#TZ5984",
    date: "25 April 2024",
    image: "/images/watch.png",
    customer: "Peter T. Smith",
    phone: "(+33)-655–5187–93",
    address: "Yreka/California",
    payment: "Pay Pal",
    status: "Completed",
  },
  {
    id: "#TZ3625",
    date: "21 April 2024",
    image: "/images/phone.png",
    customer: "Emmanuel J. Delcid",
    phone: "(+30)-693–5553–637",
    address: "Atlanta/Georgia",
    payment: "Pay Pal",
    status: "Processing",
  },
  {
    id: "#TZ8652",
    date: "18 April 2024",
    image: "/images/laptop.png",
    customer: "William J. Cook",
    phone: "(+91)-855–5446–150",
    address: "Rosenberg/Texas",
    payment: "Credit Card",
    status: "Processing",
  },
];

const ordersPerPage = 5;

export default function RecentOrders() {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const start = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = orders.slice(start, start + ordersPerPage);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-200 transition">
          + Create Order
        </button>
      </div>

      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 px-3">Order ID</th>
            <th className="py-2 px-3">Date</th>
            <th className="py-2 px-3">Product</th>
            <th className="py-2 px-3">Customer Name</th>
            <th className="py-2 px-3">Phone No.</th>
            <th className="py-2 px-3">Address</th>
            <th className="py-2 px-3">Payment Type</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
  {paginatedOrders.map((order) => (
    <tr key={order.id} className="border-b hover:bg-gray-50 text-gray-800 font-medium">
      <td className="py-2 px-3 text-black font-bold">{order.id}</td>
      <td className="py-2 px-3">{order.date}</td>
      <td className="py-2 px-3">
        <Image
          src={order.image}
          alt="Product"
          width={40}
          height={40}
          className="rounded"
        />
      </td>
      <td className="py-2 px-3">{order.customer}</td>
      <td className="py-2 px-3">{order.phone}</td>
      <td className="py-2 px-3">{order.address}</td>
      <td className="py-2 px-3">
        {order.payment === "Credit Card" ? (
          <span className="flex items-center gap-1">
            <FaCreditCard /> {order.payment}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <FaPaypal /> {order.payment}
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        <span
          className={`flex items-center gap-2 text-sm font-semibold ${
            order.status === "Completed" ? "text-green-600" : "text-blue-600"
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${
              order.status === "Completed" ? "bg-green-500" : "bg-blue-500"
            }`}
          ></span>
          {order.status}
        </span>
      </td>
    </tr>
  ))}
</tbody>

      </table>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <p>
          Showing <strong>{paginatedOrders.length}</strong> of{" "}
          <strong>{orders.length}</strong> orders
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
