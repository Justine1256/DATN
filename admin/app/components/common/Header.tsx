"use client";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { FiSearch, FiLogOut, FiBell, FiSettings, FiMenu, FiShoppingBag, FiUser, FiHome } from "react-icons/fi";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { FiStar } from "react-icons/fi"; // Đổi từ FiCrown sang FiStar

export default function ModernAdminHeader() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notificationCount, setNotificationCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Hàm lấy thông tin logo shop hoặc ảnh mặc định cho admin không có shop
  const getUserLogo = (logoUrl: string | null) => {
    if (logoUrl) {
      return `${STATIC_BASE_URL}/${logoUrl}?t=${Date.now()}`; // Cache busting
    }
    return "/placeholder.svg?height=40&width=40"; // Logo mặc định
  };

  // Hàm lấy logo admin nếu không có shop
  const getAdminLogo = (avatarsUrl: string | null) => {
    if (avatarsUrl) {
      return `${STATIC_BASE_URL}/${avatarsUrl}?t=${Date.now()}`; // Cache busting
    }
    return "/placeholder.svg?height=40&width=40"; // Avatar mặc định
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/user`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        Cookies.remove("authToken");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
const handleGoHome = () => {
  const baseUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://marketo.info.vn';

  window.location.href = `${baseUrl}`;
};
const handleLogout = () => {
  // Xóa cookie local
  Cookies.remove("authToken");

  // Nếu đang ở production → xóa cookie với domain gốc
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    Cookies.remove("authToken", {
      domain: ".marketo.info.vn",
      secure: true,
      sameSite: "None",
    });
  }

  // Clear state
  setUser(null);

  // Điều hướng về trang login
  const baseUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://marketo.info.vn";

  window.location.href = `${baseUrl}/login`;
};


  const clearSearch = () => setSearchValue("");

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200/60 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left Section - Enhanced */}
        <div className="flex items-center space-x-6 flex-1">
          {/* Mobile Menu Button */}
          <button className="lg:hidden p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
            <FiMenu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-lg w-full">
            <div className={`relative transition-all duration-300 ${searchFocused ? "transform scale-[1.02]" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm opacity-0 transition-opacity duration-300 ${searchFocused ? 'opacity-100' : ''}"></div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
                className={`relative w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${searchFocused ? "shadow-xl bg-white border-blue-300" : "shadow-sm hover:shadow-md"
                  }`}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <FiSearch
                  className={`w-5 h-5 transition-colors duration-200 ${searchFocused ? "text-blue-500" : "text-gray-400"}`}
                />
              </div>
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced */}
        <div className="flex items-center space-x-4">
          {/* Notification Button */}
          <div className="relative">
            <button className="relative p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 group">
              <FiBell className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white px-1">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          {/* User Dropdown - Enhanced */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-3 rounded-2xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              {/* Avatar with Status Ring */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:border-blue-300 transition-colors duration-200">
                  <img
                    src={user?.shop ? getUserLogo(user.shop.logo) : getAdminLogo(user?.avatar)}
                    alt="user-avatar"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                    {user?.shop ? user.shop.name : user?.name || "Admin Tổng"}
                  </p>
                  {user?.role === "admin" && <FiStar className="w-3 h-3 text-yellow-500" />}
                </div>
                <p className="text-xs text-gray-500">{user?.shop?.email || user?.email}</p>
              </div>

              {/* Dropdown Arrow */}
              <svg
                className={`w-4 h-4 text-gray-400 transition-all duration-200 group-hover:text-blue-500 ${dropdownOpen ? "rotate-180" : ""
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Enhanced Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 backdrop-blur-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                {/* User Profile Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200/60">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={user?.shop ? getUserLogo(user.shop.logo) : getAdminLogo(user?.avatar)}
                          alt="user-avatar"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-gray-900">
                          {user?.shop ? user.shop.name : user?.name || "Admin Tổng"}
                        </h3>
                        {user?.role === "admin" && (
                          <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg">
                            <FiStar className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{user?.shop?.email || user?.email}</p>
                      <p className="text-xs text-gray-500">{user?.shop?.phone || user?.phone}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                          {user?.role || "User"}
                        </span>
                        {user?.rank && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg">
                            {user.rank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-3">
                  <button className="w-full flex items-center space-x-4 px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 group">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors duration-200">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Hồ sơ cá nhân</p>
                      <p className="text-xs text-gray-500">Xem và chỉnh sửa thông tin</p>
                    </div>
                  </button>
                  {/* More buttons go here */}
                </div>
                      <div className="border-t border-gray-200/60 bg-gray-50/50 p-3">
                  <button
                    onClick={handleGoHome}
                    className="w-full flex items-center space-x-4 px-6 py-3 text-sm text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 hover:text-blue-700 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors duration-200">
                      <FiHome className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Về trang chủ</p>
                      <p className="text-xs text-blue-400">Quay lại Marketo</p>
                    </div>
                  </button>
                </div>
                {/* Logout Section */}
                <div className="border-t border-gray-200/60 bg-gray-50/50 p-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-4 px-6 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-xl bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200">
                      <FiLogOut className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Đăng xuất</p>
                      <p className="text-xs text-red-400">Thoát khỏi hệ thống</p>
                    </div>
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
