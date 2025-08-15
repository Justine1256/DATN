'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineHeart } from "react-icons/ai";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";

import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import CartDropdown from "./CartDropdown";
import { useUser } from "../../context/UserContext";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useOptimizedNavigation } from "@/hooks/useOptimizedNavigation";

// Interface định nghĩa kiểu dữ liệu thông báo
interface Notification {
  id: number;
  image_url: string;
  title: string;
  content: string;
  is_read: number;
  link: string;
  created_at: string;
}

// 🔔 Component Popup xác nhận
const Popup = ({
  message,
  onConfirm,
  onClose,
}: {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl px-6 py-5 max-w-lg w-[90%] sm:w-full shadow-2xl animate-fade-in-up border border-gray-300">
        <p className="text-gray-800 text-base mb-6 flex items-center gap-2">
          <span className="text-yellow-500 text-xl"></span>
          {message}
        </p>
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
            className="px-5 py-2 rounded-lg bg-[#db4444] text-white text-sm hover:bg-[#c33]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// 🧠 Component chính: Header
const Header = () => {
  const router = useRouter();
  const categoryRef = useRef<HTMLDivElement>(null);

  // Ref dùng để kiểm tra click ngoài dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State liên quan đến người dùng
  const { user, setUser } = useUser();
  const shopSlug = user?.shop?.slug;

  // State cho danh mục
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  // State giỏ hàng
  const { cartItems, setCartItems, reloadCart } = useCart();
  const [cartCount, setCartCount] = useState(0);

  // State wishlist
  const { wishlistItems } = useWishlist();

  // State thông báo
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // State khác
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);

  // 🚀 Optimized navigation hook
  const { navigateTo, navigateToCart, prefetchRoute } = useOptimizedNavigation({
    user,
    cartItems,
    categories
  });

  // 🛒 Handle cart navigation with smart caching
  const handleCartNavigation = () => {
    // Check if cart data is already cached
    const cartCache = sessionStorage.getItem('cart-page-cache');
    const cacheTime = sessionStorage.getItem('cart-cache-time');
    const now = Date.now();
    
    // If cache is fresh (less than 30 seconds), navigate immediately
    if (cartCache && cacheTime && (now - parseInt(cacheTime)) < 30000) {
      router.replace("/cart");
      return;
    }
    
    // Otherwise, prefetch fresh data
    router.prefetch("/cart");
    router.replace("/cart");
    
    // Cache timestamp for future use
    sessionStorage.setItem('cart-cache-time', now.toString());
  };

  // 🎯 Handle navigation with smart prefetching
  const handleNavigation = (path: string, shouldReplace = false) => {
    router.prefetch(path);
    if (shouldReplace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };

  // 🚀 Critical pages prefetch on component mount (high priority)
  useEffect(() => {
    // Only prefetch critical pages after initial render
    const timer = setTimeout(() => {
      // E-commerce specific prefetching strategy
      router.prefetch("/cart");        // Always high priority
      
      if (user) {
        // Authenticated user paths
        router.prefetch("/account");
        router.prefetch("/wishlist");
        
        // If user has items in cart, prefetch checkout
        if (cartItems.length > 0) {
          router.prefetch("/checkout");
        }
        
        // If user has shop, prefetch shop management
        if (user.shop) {
          router.prefetch(`/shop/${user.shop.slug}`);
        }
      } else {
        // Guest user paths
        router.prefetch("/login");
        router.prefetch("/register");
      }
      
      // Popular categories (based on analytics)
      if (categories.length > 0) {
        // Prefetch top 3 categories only
        categories.slice(0, 3).forEach(cat => {
          router.prefetch(`/category/${cat.slug}`);
        });
      }
    }, 1000); // Wait 1s after mount to avoid blocking initial render

    return () => clearTimeout(timer);
  }, [user, router, cartItems.length, categories]);

  // 🛒 Lắng nghe sự kiện cập nhật giỏ hàng từ nơi khác
  useEffect(() => {
    const handleCartUpdate = () => reloadCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [reloadCart]);

  // 🧮 Tính tổng số lượng sản phẩm trong giỏ
  useEffect(() => {
    const total = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  // 📦 Lấy danh mục sản phẩm
  useEffect(() => {
    fetch(`${API_BASE_URL}/category`)
      .then(res => res.json())
      .then(setCategories)
      .catch(err => console.error("Lỗi lấy category:", err));
  }, []);

  // 👤 Lấy thông tin người dùng (nếu có token)
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return;

    axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(async (res) => {
        setUser(res.data);

        // 🔄 Merge cart từ localStorage vào server
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

  // 🔁 Kiểm tra đồng bộ cart giữa local và server
  // 👂 Nghe sự kiện thay đổi localStorage để reloadCart() nếu cần
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "cart") {
        reloadCart();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [reloadCart]);


  // 📨 Lấy danh sách thông báo
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

  // 📌 Header sticky khi cuộn
  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 👂 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 📷 Hàm xử lý ảnh (trả về URL đầy đủ)
  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) return `${STATIC_BASE_URL}/products/default-product.png`;
    return img.startsWith('http') ? img : `${STATIC_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  // 🔍 Xử lý tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    if (!keyword) return;
    router.push(`/search?query=${encodeURIComponent(keyword)}`);
  };

  // 🚪 Xử lý đăng xuất
const handleLogout = () => {
  // Xóa cookie ở production
  Cookies.remove("authToken", {
    domain: ".marketo.info.vn",
    secure: true,
    sameSite: "None",
  });

  // Xóa cookie ở local
  Cookies.remove("authToken");

  setUser(null);

  const baseUrl =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://marketo.info.vn";

  window.location.href = `${baseUrl}/`;
};


  // 📨 Xử lý khi click vào thông báo
  const handleNotificationClick = async (id: number, link: string) => {
    try {
      const token = Cookies.get("authToken");
      if (token) {
        await axios.put(`${API_BASE_URL}/notification/${id}/mark-read`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Cập nhật local UI
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
      <div className="py-0 px-2 border-b border-gray-200">
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
                style={{ width: "90%", height: "auto" }}
                priority
              />
            </Link>
          </div>

          {/* Menu */}
          <nav className="hidden md:flex items-center space-x-5 col-span-6 justify-center">
            <Link
              href="/"
              className="relative group text-black hover:opacity-90"
              onMouseEnter={() => router.prefetch("/")}
            >
              Trang Chủ
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <div className="relative group" ref={categoryRef}>
              <Link 
                href="/category" 
                className="relative block text-black group"
                onMouseEnter={() => router.prefetch("/category")}
              >
                Danh mục
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {/* Dropdown list */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <ul>
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link 
                        href={`/category/${cat.slug}`} 
                        className="block px-4 py-2 hover:bg-brand/10"
                        onMouseEnter={() => router.prefetch(`/category/${cat.slug}`)}
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
              onMouseEnter={() => router.prefetch("/about")}
            >
              Giới Thiệu
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>
{/*        */}
            <a
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  setShowVoucherPopup(true);
                } else {
                  router.push("/voucher");
                }
              }}
              onMouseEnter={() => user && router.prefetch("/voucher")}
              className="relative group text-black hover:opacity-90 cursor-pointer"
            >
              Mã Giảm Giá
              <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>



            {!user && (
              <Link
                href="/login"
                className="relative group text-black hover:opacity-90"
                onMouseEnter={() => router.prefetch("/login")}
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
            
            <div 
              className="relative" 
              onClick={navigateToCart}
              onMouseEnter={() => prefetchRoute("/cart")}
            >
              <CartDropdown
                key={cartItems.length}
                cartItems={cartItems}
                formatImageUrl={formatImageUrl}
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}

            </div>

            <Link 
              href="/wishlist" 
              className="relative w-5 h-5 block"
              onMouseEnter={() => router.prefetch("/wishlist")}
            >
              <AiOutlineHeart className="w-5 h-5 text-black hover:text-red-500 transition-colors duration-300" />


              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>


          

            {user && (
              <div className="relative" ref={dropdownRef}>
<Image
  src={
    user?.avatar
      ? (user.avatar.startsWith('http') || user.avatar.startsWith('/')
          ? user.avatar
          : `${STATIC_BASE_URL}/${user.avatar}`
        )
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

                      {user?.shop?.slug ? (
                        <Link
                          href={`/shop/${user.shop.slug}`}
                          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded"
                        >
                          <TbBuildingStore className="w-5 h-5" /> Cửa Hàng của bạn
                        </Link>
                      ) : (
                        <Link
                          href="/shop/register"
                          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded"
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
                          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded"
                        >
                          <FiSettings className="w-5 h-5" />
                          {user.role === "admin" ? "Trang Quản Trị Tổng" : "Trang Quản Trị Shop"}
                        </Link>
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
            {showVoucherPopup && (
              <Popup
                message="⚠️ Bạn cần đăng nhập để xem mã giảm giá."
                onConfirm={() => router.push("/login")}
                onClose={() => setShowVoucherPopup(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
    
  );

};

export default Header;
