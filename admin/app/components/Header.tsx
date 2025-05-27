"use client";
import { FaBell, FaCog, FaClock, FaMoon, FaUserCircle } from "react-icons/fa";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white shadow px-6 py-4 flex justify-between items-center border-b">
      <div className="text-lg font-semibold">Product List</div>
      <div className="flex items-center gap-6">
        <FaMoon className="text-gray-500 hover:text-gray-700 cursor-pointer" />
        <FaBell className="text-gray-500 hover:text-gray-700 cursor-pointer" />
        <FaCog className="text-gray-500 hover:text-gray-700 cursor-pointer" />
        <FaClock className="text-gray-500 hover:text-gray-700 cursor-pointer" />
        <FaUserCircle className="text-gray-500 text-2xl cursor-pointer" />
      </div>
    </header>
  );
}