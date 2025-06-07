"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLogOut, FiSearch } from "react-icons/fi";
import { FaBell, FaCog } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";

export default function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔁 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔐 Lấy thông tin người dùng từ API nếu có token
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      axios
        .get("http://localhost:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => {
          Cookies.remove("authToken");
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("authToken");
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="w-full flex items-center justify-between px-6 py-3">
        {/* 🔍 Thanh tìm kiếm bên trái */}
        <div className="flex-1">
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 text-sm text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#DC4B47]"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-500" />
          </div>
        </div>

        {/* 🔘 Icon + Avatar bên phải */}
        <div className="flex items-center gap-4 relative ml-6 flex-shrink-0">
          {[FaBell, FaCog].map((Icon, i) => (
            <div
              key={i}
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition"
            >
              <Icon className="text-[#DC4B47] text-lg" />
            </div>
          ))}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-8 w-8 bg-[#DC4B47] text-white rounded-full flex items-center justify-center uppercase"
              >
                {user.name[0]}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-xl text-sm z-50 border border-gray-200">
                  <div className="px-4 py-3 border-b">
                    <p className="text-gray-800 font-semibold">Welcome {user.name}!</p>
                  </div>
                  <ul className="divide-y divide-gray-100 font-medium text-gray-700">
                    <li>
                      <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                        <FiUser /> Profile
                      </a>
                    </li>
                    <li>
                      <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                        <FaCog /> Settings
                      </a>
                    </li>
                  </ul>
                  <div className="border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 font-semibold"
                    >
                      <FiLogOut className="inline mr-2" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
