"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineSearch, AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { FiUser, FiLogOut } from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { FaRegBell } from "react-icons/fa";
import Image from "next/image";
import logoImage from "../../../public/logo.png";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; avatar?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Danh sách thông báo mẫu
  const allNotifications = [
    {
      id: 1,
      image: "/images/sale-banner.jpg",
      title: "Flash Sale 50%",
      description: "Giảm giá 50% cho toàn bộ đồ bơi hôm nay!",
    },
    {
      id: 2,
      image: "/images/new-arrivals.jpg",
      title: "Hàng mới về",
      description: "Khám phá bộ sưu tập mới nhất của mùa hè!",
    },
    {
      id: 3,
      image: "/images/sale-banner.jpg",
      title: "Miễn phí vận chuyển",
      description: "Đơn hàng từ 299K trở lên!",
    },
    {
      id: 4,
      image: "/images/new-arrivals.jpg",
      title: "Voucher tặng bạn",
      description: "Nhận voucher 100K ngay hôm nay!",
    },
    {
      id: 5,
      image: "/images/sale-banner.jpg",
      title: "Đăng ký nhận quà",
      description: "Thành viên mới nhận quà hấp dẫn!",
    },
  ];

  // ✅ Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Sticky header khi scroll
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Lấy thông tin người dùng từ token
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

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/contact", label: "Liên hệ" },
    { href: "/about", label: "Giới thiệu" },
    { href: "/voucher", label: "Mã giảm giá" },
  ];

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    setUser(null);
    router.push("/");
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

      {/* 🔲 Thanh điều hướng */}
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


          {/* 🔍 Tìm kiếm + Thông báo + Yêu thích + Giỏ hàng + Avatar */}
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
                <FaRegBell className="text-black group-hover:text-[#DB4444] w-5 h-5 transition duration-200" />
                <span className="absolute -top-2 -right-2 bg-[#DB4444] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {allNotifications.length}
                </span>
              </div>

              {/* 📩 Popup danh sách thông báo */}
              <div className="absolute top-full mt-2 right-0 w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-300 z-50">
                <div className="px-4 py-2 border-b text-base font-semibold text-black">Thông báo mới nhận</div>
                <ul className="divide-y divide-gray-100">
                  {allNotifications.slice(0, 5).map((note) => (
                    <li key={note.id} className="flex gap-3 p-3 hover:bg-gray-100 transition">
                      <div className="w-[56px] h-[56px] flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image src={note.image} alt={note.title} width={56} height={56} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-black">{note.title}</h4>
                        <p className="text-xs text-gray-600">{note.description}</p>
                      </div>
                    </li>
                  ))}
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
                <img
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

        {/* ☰ Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-6 py-3 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block text-black text-sm font-medium hover:underline transition" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link href="/login" className="block text-black text-sm font-medium hover:underline transition" onClick={() => setMobileMenuOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 🧱 Line kẻ dưới header */}
      <div className="bg-gray-200 h-[1px] w-full" />
    </header>
  );
};

export default Header;
