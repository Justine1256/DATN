'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineHeart } from "react-icons/ai";
import { FiUser, FiLogOut } from "react-icons/fi";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import CartDropdown from "./CartDropdown";
import { useUser } from "../../context/UserContext";
import { TbBuildingStore } from "react-icons/tb";
import { FiSettings } from "react-icons/fi";
// Kiểu dữ liệu thông báo
interface Notification {
  id: number;
  image_url: string;
  title: string;
  content: string;
  is_read: number;
  link: string;
  created_at: string;
}

const Header = () => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);


  // State người dùng
  // const [user, setUser] = useState<{ name: string; role: string; avatar?: string } | null>(null);
  const { user, setUser } = useUser();
  const shopSlug = user?.shop?.slug;
  // State các danh mục
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  // State giỏ hàng
  const [cartItems, setCartItems] = useState<any[]>([]);
  // State thông báo
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  // Các state khác
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lấy danh mục
  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then(res => res.json())
      .then(setCategories)
      .catch(err => console.error("Lỗi lấy category:", err));
  }, []);

  // Lấy thông tin user
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;
    axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => setUser(res.data))
      .catch(() => {
        Cookies.remove("authToken");
        setUser(null);
      });
  }, []);

  // Lấy giỏ hàng
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) {
      const guestCart = localStorage.getItem("cart");
      if (guestCart) {
        const parsedCart = JSON.parse(guestCart).map((item: any) => ({
          id: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.name,
            image: [item.image],
            price: item.price,
            sale_price: null,
          },
          variant: item.variant_id ? {
            id: item.variant_id,
            option1: "Phân loại 1",
            option2: "Phân loại 2",
            value1: item.value1,
            value2: item.value2,
            price: item.price,
            sale_price: null,
          } : null
        }));
        setCartItems(parsedCart);
      } else {
        setCartItems([]);
      }
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCartItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Không thể lấy giỏ hàng:", err);
        setLoading(false);
      });
  }, []);

  // Lấy thông báo
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;
    axios.get(`${API_BASE_URL}/notification`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setNotifications(res.data);
        setUnreadNotificationCount(res.data.filter((n: Notification) => n.is_read === 0).length);
      })
      .catch(err => console.error("Lỗi lấy notification:", err));
  }, []);

  // Sticky header
  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Định dạng ảnh sản phẩm
  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) return `${STATIC_BASE_URL}/products/default-product.png`;
    return img.startsWith('http') ? img : `${STATIC_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  // Xử lý tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    if (!keyword) return;
    router.push(`/search?query=${encodeURIComponent(keyword)}`);
  };

  // Xử lý logout
  const handleLogout = () => {
    Cookies.remove("authToken");
    setUser(null);
    setDropdownOpen(false);
    setUnreadNotificationCount(0);
    setCartItems([]);
    router.replace("/");
  };

  // Click notification
  const handleNotificationClick = (id: number, link: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: 1 } : n);
      setUnreadNotificationCount(updated.filter(n => n.is_read === 0).length);
      return updated;
    });
    const token = Cookies.get("authToken");
    if (token) {
      axios.put(`${API_BASE_URL}/notification/${id}`, { is_read: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error("Lỗi cập nhật notification:", err));
    }
    if (link) router.push(link);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] bg-white transition duration-300 ${isSticky ? "shadow-md" : ""}`}>
      {/* Banner khuyến mãi */}
      <div className="bg-black text-white py-2 text-center text-sm">
        <div className="container mx-auto max-w-[1200px] px-2">
          <span className="text-gray-400">Khuyến mãi mùa hè cho đồ bơi - GIẢM 50%!</span>
          <Link href="/shop" className="text-white ml-2 hover:underline">Mua Ngay</Link>
        </div>
      </div>

      {/* Thanh header chính */}
      <div className="py-0 px-2">
        <div className="grid grid-cols-12 items-center py-4 md:px-16 max-w-[1280px] mx-auto">
          {/* Logo */}
          <div className="col-span-6 sm:col-span-3 lg:col-span-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo"
                width={140}
                height={140}
                className="rounded-full cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* Menu */}
          <nav className="hidden md:flex items-center space-x-6 col-span-6 justify-center">
            <Link
              href="/"
              className="relative group text-black hover:opacity-90"
            >
              Trang Chủ
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div className="relative group" ref={categoryRef}>
              <button className="relative text-black">
                Danh Mục
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <ul>
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="block px-4 py-2 hover:bg-brand/10"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href="/about"
              className="relative group text-black hover:opacity-90"
            >
              Giới Thiệu
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <Link
              href="/voucher"
              className="relative group text-black hover:opacity-90"
            >
              Mã Giảm Giá
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {!user && (
              <Link
                href="/login"
                className="relative group text-black hover:opacity-90"
              >
                Đăng Nhập
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </nav>

          {/* Phần bên phải: search, thông báo, wishlist, cart, avatar */}
          <div className="col-span-6 sm:col-span-9 lg:col-span-4 flex justify-end items-center space-x-4">
            <div className="hidden md:block">
              <SearchBar />
            </div>

            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadNotificationCount}
              onNotificationClick={handleNotificationClick}
            />

            <Link href="/wishlist">
              <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
            </Link>

            <div onClick={() => router.push("/cart")}>
              <CartDropdown
                cartItems={cartItems}
                formatImageUrl={formatImageUrl}
              />
            </div>

            {user && (
              <div className="relative" ref={dropdownRef}>
                <Image
                  src={
                    user?.avatar
                      ? `${STATIC_BASE_URL}/${user.avatar}`
                      : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                  }
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-md shadow-xl bg-[rgba(30,30,30,0.7)] backdrop-blur p-3 z-50">
                    <ul className="text-white space-y-1 text-sm">
                      <li>
                        <Link href="/account" className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded">
                          <FiUser /> Quản Lý Tài Khoản
                        </Link>
                      </li>
                      <li>
                        <Link href={shopSlug ? `/shop/${shopSlug}` : "/shop/open"}
                          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded">
                          <TbBuildingStore className="w-5 h-5" /> Cửa Hàng
                        </Link>

                      </li>
                      {(user.role === "admin" || user.role === "seller") && (
                        <li>
                          <Link href="http://localhost:3001/dashboard"
                            className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded">
                            <FiSettings className="w-5 h-5" /> Trang Quản Trị
                          </Link>

                        </li>
                      )}
                      <li
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-400 hover:bg-white/10 px-3 py-2 rounded cursor-pointer"
                      >
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

      {/* Line dưới header */}
      <div className="bg-gray-200 h-[1px] w-full" />
    </header>
  );

};

export default Header;
