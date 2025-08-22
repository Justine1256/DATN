"use client";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  FiLogOut,
  FiBell,
  FiMenu,
  FiUser,
  FiHome,
} from "react-icons/fi";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { FiStar } from "react-icons/fi"; // Đổi từ FiCrown sang FiStar

export default function ModernAdminHeader() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Lấy logo shop/ảnh admin
  const getUserLogo = (logoUrl: string | null) =>
    logoUrl ? `${STATIC_BASE_URL}/${logoUrl}?t=${Date.now()}` : "/placeholder.svg?height=40&width=40";
  const getAdminLogo = (avatarsUrl: string | null) =>
    avatarsUrl ? `${STATIC_BASE_URL}/${avatarsUrl}?t=${Date.now()}` : "/placeholder.svg?height=40&width=40";

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/user`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => {
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
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://marketo.info.vn";
    window.location.href = `${baseUrl}`;
  };

  const handleLogout = () => {
    // Xóa cookie ở production
    Cookies.remove("authToken", { domain: ".marketo.info.vn", secure: true, sameSite: "None" });
    // Xóa cookie ở local
    Cookies.remove("authToken");
    setUser(null);
    const baseUrl = window.location.hostname === "localhost" ? "http://localhost:3000" : "https://marketo.info.vn";
    window.location.href = `${baseUrl}/`;
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200/60 backdrop-blur-xl shadow-sm">
      {/* padding co giãn theo màn hình */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* LEFT: menu + brand (giữ chỗ search đã bỏ) */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Mobile Menu */}
          <button
            className="lg:hidden p-2.5 sm:p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            aria-label="Open menu"
          >
            <FiMenu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Brand / Tên người dùng (ẩn trên mobile để gọn) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="text-sm sm:text-base font-semibold text-gray-800">
              {/* {user?.shop ? user.shop.name : user?.name || "Marketo Admin"} */}
            </div>
            {/* {user?.role === "admin" && <FiStar className="w-4 h-4 text-yellow-500" />} */}
          </div>
        </div>

        {/* RIGHT: notifications + user dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          {/* <div className="relative">
            <button
              className="relative p-2.5 sm:p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white px-1">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                </div>
              )}
            </button>
          </div> */}

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-2xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:border-blue-300 transition-colors duration-200">
                  <img
                    src={user?.shop ? getUserLogo(user.shop.logo) : getAdminLogo(user?.avatar)}
                    alt="user-avatar"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              </div>

              {/* Info (ẩn trên mobile) */}
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                    {user?.shop ? user.shop.name : user?.name || "Admin Tổng"}
                  </p>
                  {user?.role === "admin" && <FiStar className="w-3 h-3 text-yellow-500" />}
                </div>
                <p className="text-xs text-gray-500">{user?.shop?.email || user?.email}</p>
              </div>

              {/* Arrow */}
              <svg
                className={`w-4 h-4 text-gray-400 transition-all duration-200 group-hover:text-blue-500 ${dropdownOpen ? "rotate-180" : ""
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-[18rem] sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 backdrop-blur-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                {/* Profile */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/60">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 sm:border-[3px] border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={user?.shop ? getUserLogo(user.shop.logo) : getAdminLogo(user?.avatar)}
                          alt="user-avatar"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 sm:border-[3px] border-white shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">
                          {user?.shop ? user.shop.name : user?.name || "Admin Tổng"}
                        </h3>
                        {user?.role === "admin" && (
                          <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg">
                            <FiStar className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        {user?.shop?.email || user?.email}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{user?.shop?.phone || user?.phone}</p>
                      <div className="flex items-center space-x-2 sm:space-x-3 mt-2">
                        <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-medium rounded-lg">
                          {user?.role || "User"}
                        </span>
                        {user?.rank && (
                          <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-lg">
                            {user.rank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="py-2 sm:py-3">
                  <button className="w-full flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-2.5 sm:py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 group">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors duration-200">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Hồ sơ cá nhân</p>
                      <p className="text-xs text-gray-500">Xem và chỉnh sửa thông tin</p>
                    </div>
                  </button>
                </div>

                {/* Go Home */}
                <div className="border-t border-gray-200/60 bg-gray-50/50 p-2 sm:p-3">
                  <button
                    onClick={handleGoHome}
                    className="w-full flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-2.5 sm:py-3 text-sm text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 hover:text-blue-700 rounded-xl transition-all duration-200 group"
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

                {/* Logout */}
                <div className="border-t border-gray-200/60 bg-gray-50/50 p-2 sm:p-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-2.5 sm:py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 rounded-xl transition-all duration-200 group"
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
