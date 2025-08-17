"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChevronRight } from "react-icons/fa";
import {
  Package,
  Tags,
  Truck,
  Users,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Menu,
} from "lucide-react";

export const menu = [
  {
    label: "Bảng điều khiển",
    href: "/shop-admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Sản phẩm",
    icon: <Package size={18} />,
    children: [
      { label: "Danh sách", href: "/shop-admin/product" },
      { label: "Thêm mới", href: "/shop-admin/product/create", icon: <PlusCircle size={14} /> },
      { label: "Nhập hàng", href: "/shop-admin/shop/stock", icon: <PlusCircle size={14} /> },
    ],
  },
  {
    label: "Danh mục",
    icon: <Tags size={18} />,
    children: [
      { label: "Danh sách", href: "/shop-admin/category" },
      { label: "Thêm mới", href: "/shop-admin/category/create", icon: <PlusCircle size={14} /> },
    ],
  },
  {
    label: "Đơn hàng",
    icon: <Truck size={18} />,
    children: [
      { label: "Danh sách", href: "/shop-admin/order" },
      { label: "Đơn hàng khiếu nại", href: "/shop-admin/refund-reports" },
    ],
  },
  {
    label: "Khách Hàng",
    icon: <Users size={18} />,
    href: "/shop-admin/customers",
  },
  {
    label: "Mã Giảm Giá",
    icon: <MessageSquare size={18} />,
    children: [
      { label: "Mã giảm giá", href: "/shop-admin/voucher" },
      { label: "Tạo mã giảm giá", href: "/shop-admin/voucher/create" },
    ],
  },
  {
    label: "Tin nhắn",
    icon: <MessageSquare size={18} />,
    href: "/shop-admin/chat",
  },
  {
    label: "Cài đặt",
    icon: <Settings size={18} />,
    children: [
      { label: "Thông tin shop", href: "/shop-admin/shop/info" },
      { label: "Chỉnh sửa shop", href: "/shop-admin/shop/update" },
      { label: "Quản lý thanh toán", href: "/shop-admin/payment" },
      { label: "Quản lý vận chuyển", href: "/shop-admin/shipping-manager" },
    ],
  },
];

export default function ModernAdminSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mở group nếu route hiện tại nằm trong group đó
  useEffect(() => {
    const next = new Set<string>();
    menu.forEach((item) => {
      if (item.children?.length) {
        const activeChild = item.children.some((c) => c.href === pathname);
        if (activeChild || item.href === pathname) next.add(item.label);
      }
    });
    setOpenDropdowns(next);
    setMobileOpen(false); // đóng drawer khi đổi route
  }, [pathname]);

  const toggleDropdown = (label: string) => {
    const next = new Set(openDropdowns);
    next.has(label) ? next.delete(label) : next.add(label);
    setOpenDropdowns(next);
  };

  const SidebarContent = (
    <div className="h-full w-72 bg-[#0f172a] text-[#e2e8f0] border-r border-[#334155]/80 flex flex-col shadow-xl lg:shadow-none">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#334155]/70 flex justify-center bg-[#0b1221]">
        <a
          href={typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:3000" : "https://marketo.info.vn"}
          className="inline-flex items-center gap-2"
        >
          <img src="/logo.png" alt="MarketO Logo" className="w-32 h-auto" />
        </a>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y">
        <div className="px-4 py-5">
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.08em] mb-3 px-3">Điều hướng</p>
          <nav className="space-y-1">
            {menu.map((item) => {
              const isActive = pathname === item.href || item.children?.some((c) => pathname === c.href);
              const isOpen = openDropdowns.has(item.label);
              const hasChildren = !!item.children?.length;

              return (
                <div key={item.label} className="relative">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-[13px] font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#db4444]/40
                        ${isOpen || isActive ? "bg-[#db4444] text-white" : "hover:bg-[#1e293b] hover:text-white"}`}
                      aria-expanded={isOpen}
                      aria-controls={`group-${item.label}`}
                    >
                      <div className="flex items-center">
                        <span className={`text-base mr-3 ${isOpen || isActive ? "text-white" : "text-[#9ca3af]"}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                        <FaChevronRight className="text-xs" />
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`w-full flex items-center px-3 py-3 text-[13px] font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#db4444]/40
                        ${isActive ? "bg-[#db4444] text-white" : "hover:bg-[#1e293b] hover:text-white"}`}
                    >
                      <span className={`text-base mr-3 ${isActive ? "text-white" : "text-[#9ca3af]"}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )}

                  {hasChildren && (
                    <div
                      id={`group-${item.label}`}
                      className={`${isOpen ? "block animate-slide-left" : "hidden"} mt-1 ml-4 pl-6 border-l-2 border-[#1f2937]`}
                    >
                      {item.children!.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`w-full flex items-center px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 mt-1
                              ${isChildActive ? "bg-[#db4444]/20 text-[#db4444] border-l-2 border-[#db4444]" : "hover:bg-[#1e293b] hover:text-white"}
                              focus:outline-none focus:ring-2 focus:ring-[#db4444]/40`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-3 ${isChildActive ? "bg-[#db4444]" : "bg-[#94a3b8]"}`} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer nhỏ */}
      <div className="px-4 py-3 text-[11px] text-[#94a3b8] border-t border-[#334155]/70 bg-[#0b1221]">© {new Date().getFullYear()} MarketO</div>
    </div>
  );

  return (
    <>
      {/* Topbar (mobile only) để mở sidebar) */}
      <div className="lg:hidden sticky top-0 z-[60] bg-[#0f172a] text-[#e2e8f0] border-b border-[#334155]/70">
        <div className="h-12 flex items-center justify-between px-3">
          <button
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 bg-[#0b1221] border border-[#334155]/70 active:scale-[.98]"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu size={18} />
            <span className="text-sm">Menu</span>
          </button>
          <Link href="/shop-admin/dashboard" className="text-sm font-medium">Bảng điều khiển</Link>
        </div>
      </div>

      {/* Desktop sidebar (hiển thị cố định) */}
      <div className="hidden lg:block h-screen sticky top-0 z-[50]">{SidebarContent}</div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-[70] transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Thanh điều hướng quản trị"
      >
        <div className="h-full w-[19rem] max-w-[85vw] bg-transparent">
          <div className="h-full bg-[#0f172a] rounded-r-2xl shadow-2xl border border-[#334155]/60 overflow-hidden">
            {SidebarContent}
          </div>
        </div>
      </div>

      {/* Overlay khi mở drawer */}
      {mobileOpen && (
        <button
          className="lg:hidden fixed inset-0 z-[65] bg-black/45 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}
    </>
  );
}
