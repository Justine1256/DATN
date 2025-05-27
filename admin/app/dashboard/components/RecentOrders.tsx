// app/dashboard/components/RecentOrders.tsx
"use client";
import { useState } from "react";




const orders = [
  {
    id: "#TZ5625",
    date: "29 April 2024",
    productImg: "/laptop.png",
    customer: "Anna M. Hines",
    phone: "(+1)-555–1564–261",
    address: "Burr Ridge/Illinois",
    payment: "Credit Card",
    status: "Completed",
  },
  {
    id: "#TZ9652",
    date: "25 April 2024",
    productImg: "/camera.png",
    customer: "Judith H. Fritsche",
    phone: "(+57)-305–5579–759",
    address: "SULLIVAN/Kentucky",
    payment: "Credit Card",
    status: "Completed",
  },
  {
    id: "#TZ5984",
    date: "25 April 2024",
    productImg: "/watch.png",
    customer: "Peter T. Smith",
    phone: "(+33)-655–5187–93",
    address: "Yreka/California",
    payment: "Pay Pal",
    status: "Completed",
  },
  {
    id: "#TZ3625",
    date: "21 April 2024",
    productImg: "/phone.png",
    customer: "Emmanuel J. Delcid",
    phone: "(+30)-693–5553–637",
    address: "Atlanta/Georgia",
    payment: "Pay Pal",
    status: "Processing",
  },
  {
    id: "#TZ8652",
    date: "18 April 2024",
    productImg: "/laptop-black.png",
    customer: "William J. Cook",
    phone: "(+91)-855–5446–150",
    address: "Rosenberg/Texas",
    payment: "Credit Card",
    status: "Processing",
  },
];
const ORDERS_PER_PAGE = 5;

export default function RecentOrders() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);

  const currentData = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          + Create Order
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3">Order ID.</th>
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
            {currentData.map((order, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 text-blue-600 font-medium">{order.id}</td>
                <td className="py-2 px-3">{order.date}</td>
                <td className="py-2 px-3">
                  <img src={order.productImg} alt="" className="w-8 h-8" />
                </td>
                <td className="py-2 px-3">{order.customer}</td>
                <td className="py-2 px-3">{order.phone}</td>
                <td className="py-2 px-3">{order.address}</td>
                <td className="py-2 px-3">{order.payment}</td>
                <td className="py-2 px-3">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    order.status === "Completed" ? "bg-green-500" : "bg-blue-500"
                  }`} />
                  {order.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
        <span>
          Showing <strong>{currentData.length}</strong> of <strong>{orders.length}</strong> orders
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
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
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}