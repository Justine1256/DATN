"use client";

import { useState } from "react";
import { FaBell, FaCog, FaClock, FaMoon, FaUser } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import Image from "next/image";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
      {/* Search Bar */}
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 text-sm text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-5 relative">
        <FaMoon className="text-gray-500 text-lg cursor-pointer hover:text-blue-500 transition" />

        <div className="relative">
          <FaBell className="text-gray-500 text-lg cursor-pointer hover:text-blue-500 transition" />
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full px-1.5">3</span>
        </div>

        <FaCog className="text-gray-500 text-lg cursor-pointer hover:text-blue-500 transition" />
        <FaClock className="text-gray-500 text-lg cursor-pointer hover:text-blue-500 transition" />

        {/* Avatar */}
        <div className="relative">
          <Image
            src="/avatar.jpg"
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full cursor-pointer border border-gray-300 hover:ring hover:ring-blue-100"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white shadow-lg rounded-xl overflow-hidden text-sm border border-gray-100 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-gray-800 font-semibold">Welcome Gaston!</p>
              </div>
              <ul className="divide-y divide-gray-100">
                <li>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FaUser className="text-gray-400" /> Profile
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FaBell className="text-gray-400" /> Messages
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FaCog className="text-gray-400" /> Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FaClock className="text-gray-400" /> Help
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FaMoon className="text-gray-400" /> Lock screen
                  </a>
                </li>
              </ul>
              <div className="border-t border-gray-100">
                <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 font-semibold">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}