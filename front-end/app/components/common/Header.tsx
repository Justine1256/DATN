'use client'
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineSearch, AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { FiUser, FiLogOut } from "react-icons/fi";
import { FaRegBell } from "react-icons/fa";
import Image from "next/image";
import logoImage from "../../../public/logo.png";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

// Định nghĩa kiểu dữ liệu thông báo
interface Notification {
  id: number;
  image_url: string;
  title: string;
  content: string;
  is_read: number; // 0: chưa đọc, 1: đã đọc
  link: string;
  created_at: string; // Thêm trường created_at để lưu thời gian
}

const Header = () => {
  // Khởi tạo các hook và state cần thiết cho component
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; avatar?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // State để lưu trữ danh sách thông báo và số lượng thông báo chưa đọc
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from the API
  useEffect(() => {
    const token = Cookies.get("authToken"); // Lấy token để xác thực
    if (!token) {
      // Không có token, không gọi API thông báo
      return;
    }

    axios
      .get(`${API_BASE_URL}/notification`, {
        headers: { Authorization: `Bearer ${token}` }, // Gửi token vào header
      })
      .then((res) => {
        setNotifications(res.data);
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = res.data.filter((note: Notification) => note.is_read === 0).length;
        setUnreadNotificationCount(unreadCount);
      })
      .catch((err) => console.error("Failed to fetch notifications", err));
  }, []); // Chỉ gọi một lần khi component mount

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý sticky header khi cuộn trang
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lấy thông tin người dùng từ token trong cookie
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

  // Định nghĩa các liên kết điều hướng
  const navLinks = [
    { href: "/", label: "Trang chủ" },
    // { href: "/contact", label: "Liên hệ" },
    { href: "/about", label: "Giới thiệu" },
    { href: "/voucher", label: "Mã giảm giá" },
  ];

  // Xử lý sự kiện tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // Có thể thêm logic điều hướng hoặc gọi API tìm kiếm ở đây
    }
  };

  // Xử lý đăng xuất người dùng
  const handleLogout = () => {
    Cookies.remove("authToken");
    setUser(null);
    router.push("/");
  };

  // Xử lý khi nhấp vào thông báo trong dropdown
  const handleNotificationClick = (id: number, link: string) => {
    // Cập nhật trạng thái 'đã đọc' trong state cục bộ
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, is_read: 1 } : notification
      );
      // Đếm lại số thông báo chưa đọc
      const newUnreadCount = updatedNotifications.filter(note => note.is_read === 0).length;
      setUnreadNotificationCount(newUnreadCount);
      return updatedNotifications;
    });

    // Gửi yêu cầu API để đánh dấu thông báo là đã đọc trên backend
    const token = Cookies.get("authToken");
    if (token) {
      axios.put(
        `${API_BASE_URL}/notification/${id}`,
        { is_read: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .catch((err) => console.error("Lỗi khi cập nhật trạng thái thông báo", err));
    }

    // Điều hướng đến liên kết của thông báo
    if (link) {
      router.push(link);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] ${isSticky ? "shadow-md" : ""} bg-white transition-all duration-300`}>
      {/* 🔻 Banner khuyến mãi */}
      <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
        <div className="container mx-auto max-w-[1200px] px-2">
          <span className="text-gray-400">Khuyến mãi mùa hè cho tất cả đồ bơi và giao hàng nhanh miễn phí - GIẢM 50%!</span>
          <Link href="/shop" className="text-white ml-2 hover:underline transition text-sm">Mua Ngay</Link>
        </div>
      </div>

      {/* 🔲 Thanh điều hướng chính */}
      <div className="py-0 px-2">
        <div className="grid grid-cols-12 items-center py-4 px-6 md:px-16 max-w-[1260px] mx-auto w-full">
          {/* 🅰️ Logo */}
          <div className="col-span-2">
            <Link href="/">
              <Image src={logoImage} alt="Logo" width={140} height={80} className="rounded-full cursor-pointer" priority />
            </Link>
          </div>

          {/* 📋 Menu chính */}
          <nav className="hidden md:flex items-center space-x-6 col-span-6 justify-center">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="relative group text-black text-sm md:text-base transition duration-300 hover:opacity-90"
              >
                {link.label}
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </button>
            ))}

            {!user && (
              <div className="relative group cursor-pointer text-black text-sm md:text-base transition duration-300 hover:opacity-90">
                <Link href="/login" className="block">
                  Đăng Nhập
                </Link>
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </div>
            )}
          </nav>

          {/* 🔍 Tìm kiếm + Yêu thích + Giỏ hàng + Avatar */}
          <div className="col-span-4 flex items-center justify-end space-x-4">
            {/* 🔍 Ô tìm kiếm */}
            <div className="relative w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-1.5 pr-10 rounded-md bg-white border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DB4444] focus:border-[#DB4444]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
              />
              <AiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-black cursor-pointer h-5 w-5" onClick={handleSearchSubmit} />
            </div>

            {/* 🔔 Thông báo */}
            <div className="relative group">
              <div className="relative group w-5 h-5 flex items-center justify-center cursor-pointer scale-[0.9]">
                {/* Biểu tượng chuông thông báo */}
                <FaRegBell className="text-black group-hover:text-[#DB4444] w-5 h-5 transition duration-200" />

                {/* Số lượng thông báo chưa đọc */}
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#DB4444] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>

              {/* Popup danh sách thông báo */}
              <div className="absolute top-full mt-2 right-0 w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-300 z-50">
                <div className="px-4 py-2 border-b text-base font-semibold text-black">Thông báo mới nhận</div>
                <ul className="divide-y divide-gray-100">
                  {notifications.slice(0, 5).map((note) => (
                    <li
                      key={note.id}
                      className={`flex gap-3 p-3 hover:bg-gray-100 transition cursor-pointer ${note.is_read === 0 ? "" : ""}`} // Bỏ nền đỏ
                      onClick={() => handleNotificationClick(note.id, note.link)} // Gọi hàm khi click vào thông báo
                    >
                      <div className="w-[56px] h-[56px] flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                          src={note.image_url ? `${STATIC_BASE_URL}${note.image_url}` : '/images/default-image.png'}
                          alt={note.title}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-image.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-semibold ${note.is_read === 0 ? "text-black" : "text-gray-700"}`}>
                            {note.title}
                          </h4>
                          {note.is_read === 0 && (
                            <div className="w-2 h-2 bg-[#DB4444] rounded-full mt-1 ml-2"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(note.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                      </div>
                    </li>
                  ))}
                  {notifications.length === 0 && (
                    <li className="p-3 text-center text-gray-500">Không có thông báo nào.</li>
                  )}
                </ul>
                <div className="text-center p-2">
                  <button onClick={() => router.push("/account")} className="text-sm text-[#DB4444] font-medium hover:underline transition">
                    Xem tất cả
                  </button>
                </div>
              </div>
            </div>


            {/* ❤️ Wishlist */}
            <Link href="/wishlist">
              <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
            </Link>

            {/* 🛒 Giỏ hàng */}
            <Link href="/cart">
              <AiOutlineShoppingCart className="h-5 w-5 text-black hover:text-red-500 transition" />
            </Link>

            {/* 👤 Avatar người dùng */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <Image
                  src={user.avatar ? `${STATIC_BASE_URL}/${user.avatar}?t=${Date.now()}` : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`}
                  onError={(e) => {
                    e.currentTarget.src = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
                  }}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  width={32}
                  height={32}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-[224px] rounded-md shadow-xl z-50" style={{ backgroundColor: "rgba(30,30,30,0.7)", backdropFilter: "blur(6px)" }}>
                    <ul className="space-y-1 text-sm font-medium text-white p-3">
                      <li>
                        <Link href="/account" className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded"><FiUser /> Quản Lý Tài Khoản</Link>
                      </li>
                      <li>
                        <Link href="/shop/open" className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded">🏪 Cửa Hàng</Link>
                      </li>
                      {(user.role === "admin" || user.role === "seller") && (
                        <li>
                          <Link href="http://localhost:3001/dashboard" className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded">🛠️ Trang quản trị</Link>
                        </li>
                      )}
                      <li onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-red-400 cursor-pointer rounded">
                        <FiLogOut /> Đăng Xuất
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧱 Line kẻ dưới header */}
      <div className="bg-gray-200 h-[1px] w-full" />
    </header>
  );
};

export default Header;
