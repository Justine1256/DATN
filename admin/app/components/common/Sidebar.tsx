"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaTshirt,
  FaClipboardList,
  FaTags,
  FaBoxOpen,
  FaTruck,
  FaUsers,
  FaChevronRight,
  FaShoppingCart,
  FaMagic,
} from "react-icons/fa";

const menu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <FaClipboardList />,
  },
  {
    label: "Products",
    icon: <FaTshirt />,
    children: [
      { label: "List", href: "/product" },
      { label: "Create", href: "/product/create" },
    ],
  },
  {
    label: "Category",
    icon: <FaTags />,
    children: [
      { label: "List", href: "/category" },
      { label: "Create", href: "/category/create" },
    ],
  },
  {
    label: "Inventory",
    icon: <FaBoxOpen />,
    href: "/inventory",
    children: [],
  },
  {
    label: "Order",
    icon: <FaTruck />,
    children: [{ label: "List", href: "/order" }],
  },
  {
    label: "Purchases",
    icon: <FaShoppingCart />,
    href: "/purchases",
    children: [],
  },
  {
    label: "Attributes",
    icon: <FaMagic />,
    href: "/attributes",
    children: [],
  },
  {
    label: "Users",
    icon: <FaUsers />,
    href: "/admin/users",
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
    <div className="h-screen w-72 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center">
          <img src="/logo.png" alt="MarketO Logo" className="w-32 h-auto" />
        </div>
      </div>

      {/* Main scrollable content area: This div now contains both navigation and quick actions */}
      {/* Set a specific height if needed, otherwise flex-1 from parent is enough */}
      <div className="flex-1 flex flex-col overflow-y-auto"> {/* Thêm flex flex-col ở đây */}
        {/* Navigation Section: Will take available space and push Quick Actions down */}
        <div className="px-4 py-6"> {/* Bỏ flex-1 ở đây, vì div cha đã là flex-col có overflow */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
              Navigation
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
                        className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isOpen || isActive
                            ? "bg-[#db4444] text-white"
                            : "text-gray-700 hover:bg-[#db4444] hover:text-white"
                          }`}
                      >
                        <div className="flex items-center">
                          <span
                            className={`text-lg mr-3 ${isOpen || isActive ? "text-white" : "text-gray-500"
                              }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""
                            }`}
                        >
                          <FaChevronRight className="text-xs" />
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={item.href || "#"}
                        className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                            ? "bg-[#db4444] text-white"
                            : "text-gray-700 hover:bg-[#db4444] hover:text-white"
                          }`}
                      >
                        <span
                          className={`text-lg mr-3 ${isActive ? "text-white" : "text-gray-500"
                            }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    )}

                    {hasChildren && isOpen && (
                      <div className="mt-1 ml-4 pl-6 border-l-2 border-gray-100">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mt-1 ${isChildActive
                                  ? "bg-[#db4444]/10 text-[#db4444] border-l-2 border-[#db4444]"
                                  : "text-gray-600 hover:bg-[#db4444] hover:text-white"
                                }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-3 ${isChildActive ? "bg-[#db4444]" : "bg-gray-300"
                                  }`}
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
        </div> {/* Kết thúc div chứa Navigation */}

        {/* Quick Actions - Đặt ở đây, bên trong div cuộn chính */}
        {/* Nó sẽ nằm dưới Navigation, và navigation sẽ cuộn nếu vượt quá không gian */}
        <div className="mt-auto px-4 py-6 border-t border-gray-50"> {/* Dùng mt-auto để đẩy xuống dưới */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Link
              href="/product/create"
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#db4444] transition-all duration-200"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Add Product
            </Link>
            <Link
              href="/order"
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#db4444] transition-all duration-200"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}