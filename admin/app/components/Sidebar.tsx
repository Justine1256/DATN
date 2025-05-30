"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  FaBars,
} from "react-icons/fa";

// ✅ Menu cấu hình tĩnh – đã xoá mục Edit vì cần id động
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
    children: [],
  },
  {
    label: "Inventory",
    icon: <FaBoxOpen />,
    children: [],
  },
  {
    label: "Orders",
    icon: <FaTruck />,
    href: "/admin/orders",
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
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [open, setOpen] = useState<string | null>("Products");

  const isCollapsed = collapsed && !hovered;

  return (
    <aside
      onMouseEnter={() => hoverEnabled && setHovered(true)}
      onMouseLeave={() => hoverEnabled && setHovered(false)}
      className={`fixed top-0 left-0 h-screen bg-white border-r shadow-sm overflow-y-auto transition-all duration-300 z-40 ${
        isCollapsed ? "w-20 px-2" : "w-64 px-5"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <Link href="/">
          <div className="flex items-center space-x-2">
            {!isCollapsed && (
              <>
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                <span className="font-bold text-sm text-gray-800">Venton</span>
              </>
            )}
            {isCollapsed && (
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 mx-auto" />
            )}
          </div>
        </Link>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setCollapsed((prev) => !prev);
            setHoverEnabled((prev) => !prev);
            setHovered(false); // reset hover
          }}
        >
          <FaBars />
        </button>
      </div>

      {!isCollapsed && (
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-3 px-1 tracking-wider">
          GENERAL
        </p>
      )}

      {/* Menu Items */}
      <ul className="space-y-1">
        {menu.map((item) => (
          <li key={item.label}>
            {item.children && item.children.length > 0 ? (
              <div>
                <button
                  onClick={() =>
                    setOpen(open === item.label ? null : item.label)
                  }
                  className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-lg w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                  {!isCollapsed &&
                    (open === item.label ? (
                      <FaChevronUp className="text-xs" />
                    ) : (
                      <FaChevronDown className="text-xs" />
                    ))}
                </button>

                {open === item.label && !isCollapsed && (
                  <ul className="ml-7 mt-1 space-y-1">
                    {item.children.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition hover:bg-blue-50 ${
                            pathname === sub.href
                              ? "bg-blue-100 text-blue-700 font-semibold"
                              : "text-gray-600"
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
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition hover:bg-blue-50 ${
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600"
                }`}
              >
                <span className="text-lg w-5 h-5 flex items-center justify-center">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="ml-2">{item.label}</span>}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
