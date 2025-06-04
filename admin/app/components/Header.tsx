"use client";

import { useState } from "react";
import { FaBell, FaCog, FaUser } from "react-icons/fa"; // 🔔 Chỉ giữ lại các icon cần thiết
import { FiSearch } from "react-icons/fi";
import Image from "next/image";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false); // 👤 Dropdown toggle

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
      {/* 🔍 Ô tìm kiếm */}
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 text-sm text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {/* 🔘 Các icon điều hướng + Avatar người dùng */}
      <div className="flex items-center gap-4 relative">
        {/* 🟠 Các icon tròn (loại bỏ FaMoon và FaClock) */}
        {[FaBell, FaCog].map((Icon, i) => (
          <div
            key={i}
            className="bg-gray-100 hover:bg-blue-100 p-2 rounded-full cursor-pointer relative"
          >
            <Icon className="text-gray-600 hover:text-blue-600" />
            {/* 🔔 Thông báo có badge số lượng */}
            {Icon === FaBell && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full px-1.5">
                3
              </span>
            )}
          </div>
        ))}

        {/* 👤 Avatar và menu dropdown */}
        <div className="relative">
          <Image
            src="/avatar.jpg"
            alt="User"
            width={32}
            height={32}
            className="rounded-full cursor-pointer border border-gray-300 hover:ring hover:ring-blue-100"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white shadow-lg rounded-xl overflow-hidden text-sm border border-gray-100 z-50">
              {/* 👋 Lời chào */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-gray-800 font-semibold">Welcome Gaston!</p>
              </div>

              {/* 📄 Danh sách menu */}
              <ul className="divide-y divide-gray-100 font-medium">
                {[
                  { icon: FaUser, label: "Profile" },
                  { icon: FaBell, label: "Messages" },
                  { icon: FaCog, label: "Pricing" },
                ].map(({ icon: Icon, label }, idx) => (
                  <li key={idx}>
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 no-underline"
                    >
                      <Icon className="text-gray-500" /> {label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* 🔓 Nút đăng xuất */}
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
