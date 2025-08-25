'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineHeart } from "react-icons/ai";
import { FiUser, FiLogOut, FiSettings, FiSearch, FiChevronDown } from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import Wishlist from "../wishlist/Wishlist";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import CartDropdownResponsive from "./CartDropdownResponsive";

import { useUser } from "../../context/UserContext";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useOptimizedNavigation } from "@/hooks/useOptimizedNavigation";
import { AlignJustify } from 'lucide-react';
import { createPortal } from "react-dom";
interface Notification {
  id: number;
  image_url: string;
  title: string;
  content: string;
  is_read: number;
  link: string;
  created_at: string;
}

const Popup = ({
  message,
  onConfirm,
  onClose,
}: {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // tránh SSR mismatch

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl px-6 py-5 max-w-lg w-[90%] sm:w-full shadow-2xl border border-gray-200">
        <p className="text-gray-800 text-base mb-6 flex items-center gap-2">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-5 py-2 rounded-lg bg-[#DB4444] text-white text-sm hover:bg-[#c33]"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


const BRAND = '#DB4444';

const Header = () => {
  const router = useRouter();
  const categoryRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const { user, setUser } = useUser();
  const shopSlug = user?.shop?.slug;

  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const { cartItems, reloadCart } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { wishlistItems } = useWishlist();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [cateDropdownOpen, setCateDropdownOpen] = useState(false);
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showWishlistPopup, setShowWishlistPopup] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const { navigateToCart, prefetchRoute } = useOptimizedNavigation({
    user,
    cartItems,
    categories,
  });

  // Prefetch các trang quan trọng
  useEffect(() => {
    const timer = setTimeout(() => {
      router.prefetch("/cart");
      if (user) {
        router.prefetch("/account");
        router.prefetch("/wishlist");
        if (cartCount > 0) router.prefetch("/checkout");
        if (user.shop) router.prefetch(`/shop/${user.shop.slug}`);
      } else {
        router.prefetch("/login");
        router.prefetch("/register"); // (fix syntax)
      }
      if (categories.length > 0) {
        categories.slice(0, 3).forEach(cat => router.prefetch(`/category/${cat.slug}`));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, router, cartCount, categories]);

  useEffect(() => {
    const handleCartUpdate = () => reloadCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [reloadCart]);

  useEffect(() => {
    const total = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then(res => res.json())
      .then(setCategories)
      .catch(err => console.error("Lỗi lấy category:", err));
  }, []);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;

    axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(async (res) => {
        setUser(res.data);
        const localCart = localStorage.getItem("cart");
        if (localCart) {
          const cart = JSON.parse(localCart);
          for (const item of cart) {
            try {
              await fetch(`${API_BASE_URL}/cart`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(item),
              });
            } catch (err) {
              console.error("❌ Lỗi khi merge giỏ hàng local:", err);
            }
          }
          localStorage.removeItem("cart");
          reloadCart?.();
        }
      })
      .catch(() => {
        Cookies.remove("authToken");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "cart") reloadCart();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [reloadCart]);

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

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target as Node)) {
        setMenuDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleCloseCateList = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleCloseCateList);
    return () => document.removeEventListener("mousedown", handleCloseCateList);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640); // 640px is Tailwind's 'sm'
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) return `${STATIC_BASE_URL}/products/default-product.png`;
    return img.startsWith('http') ? img : `${STATIC_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    if (!keyword) return;
    router.push(`/search?query=${encodeURIComponent(keyword)}`);
    setShowMobileSearch(false);
  };

  const handleLogout = () => {
    Cookies.remove("authToken", { domain: ".marketo.info.vn", secure: true, sameSite: "None" });
    Cookies.remove("authToken");
    const baseUrl = window.location.hostname === "localhost" ? "http://localhost:3000" : "https://marketo.info.vn";
    window.location.href = `${baseUrl}/`;
  };

  const handleNotificationClick = async (id: number, link: string) => {
    try {
      const token = Cookies.get("authToken");
      if (token) {
        await axios.put(`${API_BASE_URL}/notification/${id}/mark-read`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => {
          const updated = prev.map(n => n.id === id ? { ...n, is_read: 1 } : n);
          setUnreadNotificationCount(updated.filter(n => n.is_read === 0).length);
          return updated;
        });
      }
    } catch (err) {
      console.error("Lỗi cập nhật notification:", err);
    }
    if (link) router.push(link);
  };

  const linkCls = "relative group text-white md:text-neutral-700 hover:text-[#DB4444] transition-colors";
  const underline = "absolute left-0 bottom-[-2px] h-[2px] w-0 bg-[#DB4444] transition-all duration-300 group-hover:w-full";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-[100]",
        "bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70",
        "border-b border-neutral-200",
        isSticky ? "shadow-md" : "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        "transition-colors"
      ].join(" ")}
    >
      {/* thanh gradient thương hiệu trên đỉnh */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-[#DB4444]"
      />

      {/* Thanh header chính */}
      <div className="py-0 px-4 md:px-2">
        <div className="grid grid-cols-12 items-center py-4 md:px-16 max-w-[1280px] mx-auto">
          {/* Menu - mobile */}
          <div className="relative block md:hidden col-span-1 " ref={menuDropdownRef}>
            <AlignJustify onClick={() => setMenuDropdownOpen(!menuDropdownOpen)} />

            {menuDropdownOpen && (
              <div
                className="
                absolute left-0 mt-3 w-56
                rounded-xl bg-[rgba(30,30,30,0.80)] backdrop-blur
                shadow-2xl p-3 z-50
                ring-1 ring-white/10
              "
              >
                <ul className="text-white space-y-1 text-sm">
                  <li><Link href="/" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                    onMouseEnter={() => router.prefetch("/")}>
                    Trang Chủ
                  </Link></li>
                  <li>
                    <div className="relative group" ref={categoryRef}>
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded hover:bg-white/10" onClick={() => setCateDropdownOpen(open => !open)} >
                        <Link href="/category" onMouseEnter={() => router.prefetch("/category")}>
                          Danh mục
                        </Link>
                        <FiChevronDown className="cursor-pointer" />
                      </div>

                      {cateDropdownOpen && (
                        <div>
                          <ul>
                            {categories.map(cat => (
                              <li key={cat.id}>
                                <Link
                                  href={`/category/${cat.slug}`}
                                  className="block pl-6 pr-4 py-2 hover:bg-[rgba(219,68,68,0.06)]"
                                  onMouseEnter={() => router.prefetch(`/category/${cat.slug}`)}
                                >
                                  {cat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div></li>
                  <li><Link href="/about" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" onMouseEnter={() => router.prefetch("/about")}>
                    Giới Thiệu
                    <span className={underline}></span>
                  </Link></li>
                </ul>
              </div>
            )}

          </div>

          {/* Logo */}
          <div className="col-span-4 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="w-fit block sm:w-auto sm:inline">
              <Image
                src={isMobile ? "/logo-mobile.png" : "/logo.png"}
                alt="Logo"
                width={isMobile ? 100 : 140}
                height={isMobile ? 100 : 140}
                className="rounded-full cursor-pointer"
                style={isMobile ? { width: "100px", height: "auto" } : { width: "90%", height: "auto" }}
                priority
              />
            </Link>
          </div>

          {/* Menu */}
          <nav className="hidden md:flex items-center space-x-5 col-span-6 justify-center">
            <Link href="/" className={linkCls} onMouseEnter={() => router.prefetch("/")}>
              Trang Chủ
              <span className={underline}></span>
            </Link>

            <div className="relative group" ref={categoryRef}>
              <Link href="/category" className={linkCls} onMouseEnter={() => router.prefetch("/category")}>
                Danh mục
                <span className={underline}></span>
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border border-neutral-200 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <ul>
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="block px-4 py-2 text-neutral-700 hover:bg-[rgba(219,68,68,0.06)]"
                        onMouseEnter={() => router.prefetch(`/category/${cat.slug}`)}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href="/about" className={linkCls} onMouseEnter={() => router.prefetch("/about")}>
              Giới Thiệu
              <span className={underline}></span>
            </Link>

            <a
              onClick={(e) => { e.preventDefault(); if (!user) { setShowVoucherPopup(true); } else { router.push("/voucher"); } }}
              onMouseEnter={() => user && router.prefetch("/voucher")}
              className={linkCls + " cursor-pointer"}
            >
              Mã Giảm Giá
              <span className={underline}></span>
            </a>

            {!user && (
              <Link href="/login" className={linkCls} onMouseEnter={() => router.prefetch("/login")}>
                Đăng Nhập
                <span className={underline}></span>
              </Link>
            )}
          </nav>

          {/* Right */}
          <div className="col-span-7 sm:col-span-9 lg:col-span-4 flex justify-end items-center space-x-4">
            {/* Mobile search toggle */}
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:border-[#DB4444] hover:text-[#DB4444]"
              aria-label="Mở tìm kiếm"
              onClick={() => setShowMobileSearch(s => !s)}
            >
              <FiSearch className="h-5 w-5" />
            </button>

            <div className="hidden md:block">
              <SearchBar />
            </div>

            <div
              className="cursor-pointer"
              onClick={() => router.push("/account?section=NotificationDropdown")}
            >
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                onNotificationClick={handleNotificationClick}
              />
            </div>


            {/* CART */}
            <div
              className="relative cursor-pointer"
              onClick={() => router.push("/cart")}
            >
              <CartDropdownResponsive
                cartItems={cartItems}
                formatImageUrl={formatImageUrl}
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#DB4444] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </div>


            {/* WISHLIST (đặt ngay cạnh giỏ hàng) */}
            <button
              type="button"
              aria-label="Yêu thích"
              className="relative hidden md:flex items-center justify-center transition-colors text-black hover:text-[#DB4444]"
              onClick={() => {
                if (!user) {
                  setShowWishlistPopup(true); // chưa login -> hiện popup
                  return;
                }
                router.push("/wishlist"); // đã login -> đi wishlist
              }}
              onMouseEnter={() => user && prefetchRoute("/wishlist")}
            >
              {/* KHÔNG set màu ở icon, để nó ăn theo button */}
              <AiOutlineHeart className="w-6 h-6" />

              {user && wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DB4444] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </button>





            {user && (
              <div className="relative" ref={dropdownRef}>
                <Image
                  src={
                    user?.avatar
                      ? (user.avatar.startsWith('http') || user.avatar.startsWith('/') ? user.avatar : `${STATIC_BASE_URL}/${user.avatar}`)
                      : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                  }
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                />

                {userDropdownOpen && (
                  <div
                    className="
            absolute right-0 mt-3 w-56
            rounded-xl bg-[rgba(30,30,30,0.80)] backdrop-blur
            shadow-2xl p-3 z-50
            ring-1 ring-white/10
          "
                  >
                    <ul className="text-white space-y-1 text-sm">
                      <li>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                          <FiUser className="w-5 h-5"  /> Quản Lý Tài Khoản
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/wishlist"
                          className="md:hidden flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                          <AiOutlineHeart className="w-5 h-5" />   {/* tăng từ w-5 h-5 → w-6 h-6 */}
                          Danh sách yêu thích
                        </Link>
                      </li>

                      {user?.shop?.slug ? (
                        <Link
                          href={`/shop/${user.shop.slug}`}
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                          <TbBuildingStore className="w-5 h-5" /> Cửa Hàng của bạn
                        </Link>
                      ) : (
                        <Link
                          href="/shop/register"
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                          <TbBuildingStore className="w-5 h-5" /> Đăng Ký Shop
                        </Link>
                      )}

                      {(user?.role === "admin" || user?.role === "seller") && (
                        <Link
                          href={
                            typeof window !== "undefined" && window.location.hostname === "localhost"
                              ? user.role === "admin"
                                ? "http://localhost:3001/admin/dashboard"
                                : "http://localhost:3001/shop-admin/dashboard"
                              : user.role === "admin"
                                ? "https://admin.marketo.info.vn/admin/dashboard"
                                : "https://admin.marketo.info.vn/shop-admin/dashboard"
                          }
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                          <FiSettings className="w-5 h-5" /> {user.role === "admin" ? "Trang Quản Trị Tổng" : "Trang Quản Trị Shop"}
                        </Link>
                      )}

                      <li
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-red-400 hover:bg-white/10"
                      >
                        <FiLogOut /> Đăng Xuất
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

             {!user && (
              <Link href="/login" className={` md:hidden`} onMouseEnter={() => router.prefetch("/login")}>
                Đăng Nhập
                <span className={underline}></span>
              </Link>
            )}

            {showVoucherPopup && (
              <Popup
                message="⚠️ Bạn cần đăng nhập để xem mã giảm giá."
                onConfirm={() => router.push("/login")}
                onClose={() => setShowVoucherPopup(false)}
              />
            )}
            {showWishlistPopup && (
              <Popup
                message="⚠️ Bạn cần đăng nhập để xem danh sách yêu thích."
                onConfirm={() => router.push("/login")}
                onClose={() => setShowWishlistPopup(false)}
              />
            )}

          </div>

        </div>

        {/* Ô tìm kiếm cho mobile */}
        {showMobileSearch && (
          <div className="md:hidden max-w-[1280px] mx-auto px-2 pb-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DB4444]/20"
                placeholder="Tìm kiếm sản phẩm..."
              />
              <button type="submit" className="rounded-full px-4 py-2 bg-[#DB4444] text-white text-sm hover:bg-[#c33]">
                Tìm
              </button>
            </form>
          </div>
        )}
      </div>
    </header>

  );
};

export default Header;
