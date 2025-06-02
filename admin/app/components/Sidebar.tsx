"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaTshirt,
  FaClipboardList,
  FaTags,
  FaBoxOpen,
  FaTruck,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
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
    children: [],
  },
  {
    label: "Order",
    icon: <FaTruck />,
    children: [
      { label: "List", href: "/order" },
    ],
  },
  {
    label: "Purchases",
    icon: <FaShoppingCart />,
    children: [],
  },
  {
    label: "Attributes",
    icon: <FaMagic />,
    children: [],
  },
  {
    label: "Users",
    icon: <FaUsers />,
    href: "/admin/users",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const storedOpen = localStorage.getItem("sidebar_open");
    if (storedOpen) setOpen(storedOpen);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_open", open ?? "");
  }, [open]);

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm overflow-y-auto z-40 px-5 py-4">
      {/* Logo */}
      <div className="flex items-center mb-6">
        <img src="/reg-logo.png" alt="Logo" className="w-50 h-20 mr-2" />
        
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase mb-3 tracking-wider">
        GENERAL
      </p>

      <ul className="space-y-1 text-[15px]">
        {menu.map((item) => {
          const isOpen = open === item.label;

          const isCurrentParent =
            item.href === pathname ||
            item.children?.some((child) => pathname.startsWith(child.href));

          return (
            <li key={item.label}>
              {item.children && item.children.length > 0 ? (
                <div>
                  <button
                    onClick={() =>
                      setOpen(isOpen ? null : item.label)
                    }
                    className={`flex items-center justify-between w-full py-2 px-3 rounded-lg transition font-medium ${
                      isCurrentParent
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-lg w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {isOpen ? (
                      <FaChevronUp className="text-xs" />
                    ) : (
                      <FaChevronDown className="text-xs" />
                    )}
                  </button>

                  {isOpen && (
                    <ul className="ml-7 mt-1 space-y-1">
                      {item.children.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className={`block px-3 py-2 rounded-lg transition font-medium ${
                              pathname === sub.href
                                ? "bg-blue-100 text-blue-700 font-semibold"
                                : "text-gray-600 hover:bg-blue-50"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-lg w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="ml-2">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
