"use client"
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie"; // Đảm bảo bạn đã cài cookie để lấy token
import axios from "axios"; // Đảm bảo bạn đã cài axios
import { FiSearch, FiUser, FiLogOut, FiBell, FiSettings, FiMenu } from "react-icons/fi";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";


export default function ModernAdminHeader() {
  const [user, setUser] = useState<any>(null); // Sử dụng any để dễ dàng xử lý dữ liệu người dùng
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);


  // Fetch user information from the API
  useEffect(() => {
    const token = Cookies.get("authToken"); // Lấy token từ cookie
    if (!token) return; // Nếu không có token thì không làm gì cả

    axios
      .get(`${API_BASE_URL}/user`, {
        withCredentials: true, // Gửi cookie cùng request
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data)) // Lưu dữ liệu người dùng vào state
      .catch(() => {
        Cookies.remove("authToken"); // Xóa token nếu có lỗi
        setUser(null); // Đặt lại state user về null
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
    setDropdownOpen(false);
    Cookies.remove("authToken"); // Xóa token khi đăng xuất
    setUser(null); // Đặt lại user về null
  };

  const clearSearch = () => {
    setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">

        {/* Left Section - Menu & Search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiMenu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <div className={`relative transition-all duration-200 ${searchFocused ? "transform scale-105" : ""}`}>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search products, orders, customers..."
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${searchFocused ? "shadow-lg" : ""}`}
              />
              <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-3">

          {/* Notification Button */}
          <div className="relative">
            <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors relative">
              <FiBell className="w-5 h-5 text-gray-600" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              </span>
            </button>
          </div>

          {/* Settings Button */}
          <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiSettings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200"></div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'NA'}

                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user ? user.name : 'Loading...'}</p>
                <p className="text-xs text-gray-500">{user ? user.email : ''}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'NA'}

                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user ? user.name : 'Loading...'}</p>
                      <p className="text-xs text-gray-500">{user ? user.email : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FiUser className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FiSettings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
