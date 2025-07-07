"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChevronRight } from "react-icons/fa";

import {
  Home,
  Package,
  Tags,
  Warehouse,
  Truck,
  ShoppingCart,
  Settings,
  Users,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";

const menu = [
  {
    label: "Bảng điều khiển",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Sản phẩm",
    icon: <Package size={18} />,
    children: [
      { label: "Danh sách", href: "/product" },
      { label: "Thêm mới", href: "/product/create", icon: <PlusCircle size={14} /> },
    ],
  },
  {
    label: "Danh mục",
    icon: <Tags size={18} />,
    children: [
      { label: "Danh sách", href: "/category" },
      { label: "Thêm mới", href: "/category/create", icon: <PlusCircle size={14} /> },
    ],
  },
  {
    label: "Kho hàng",
    icon: <Warehouse size={18} />,
    href: "/inventory",
  },
  {
    label: "Đơn hàng",
    icon: <Truck size={18} />,
    children: [{ label: "Danh sách", href: "/order" }],
  },
  {
    label: "Nhập hàng",
    icon: <ShoppingCart size={18} />,
    href: "/purchases",
  },
  {
    label: "Thuộc tính",
    icon: <Settings size={18} />,
    href: "/attributes",
  },
  {
    label: "Người dùng",
    icon: <Users size={18} />,
    href: "/admin/users",
  },
  {
    label: "Tin nhắn",
    icon: <MessageSquare size={18} />,
    href: "/chat",
  },
];

export default function ModernAdminSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newOpenDropdowns = new Set<string>();
    menu.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const isChildActive = item.children.some(
          (child) => child.href === pathname
        );
        const isParentActive = item.href === pathname;

        if (isChildActive || isParentActive) {
          newOpenDropdowns.add(item.label);
        }
      }
    });
    setOpenDropdowns(newOpenDropdowns);
  }, [pathname]);

  const toggleDropdown = (label: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(label)) {
      newOpenDropdowns.delete(label);
    } else {
      newOpenDropdowns.add(label);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  return (
    <div className="h-screen w-72 bg-[#1e293b] text-[#e2e8f0] border-r border-[#334155] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#334155] flex justify-center">
        <img src="/logo.png" alt="MarketO Logo" className="w-32 h-auto" />
      </div>

      {/* Main scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-6">
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-4 px-3">
              Điều hướng
            </p>

            <nav className="space-y-1">
              {menu.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.children &&
                    item.children.some((child) => pathname === child.href));
                const isOpen = openDropdowns.has(item.label);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.label} className="relative">
                    {hasChildren ? (
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                          ${isOpen || isActive
                            ? "bg-[#db4444] text-white"
                            : "hover:bg-[#7f1d1d] hover:text-white"
                          }`}
                      >
                        <div className="flex items-center">
                          <span
                            className={`text-lg mr-3 ${isOpen || isActive ? "text-white" : "text-[#9ca3af]"}`}
                          >
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
                        className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                          ${isActive
                            ? "bg-[#db4444] text-white"
                            : "hover:bg-[#7f1d1d] hover:text-white"
                          }`}
                      >
                        <span
                          className={`text-lg mr-3 ${isActive ? "text-white" : "text-[#9ca3af]"}`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    )}

                    {hasChildren && isOpen && (
                      <div className="mt-1 ml-4 pl-6 border-l-2 border-[#1f2937]">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mt-1
                                ${isChildActive
                                  ? "bg-[#db4444]/20 text-[#db4444] border-l-2 border-[#db4444]"
                                  : "hover:bg-[#7f1d1d] hover:text-white"
                                }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-3 ${isChildActive ? "bg-[#db4444]" : "bg-[#9ca3af]"}`}
                              ></div>
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
      </div>
    </div>
  );
}
