// Sidebar.tsx
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
} from "react-icons/fa";

const menu = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <FaClipboardList className="mr-2" />,
  },
  {
    label: "Products",
    icon: <FaTshirt className="mr-2" />,
    children: [
      { label: "List", href: "/admin/product" },
      { label: "Grid", href: "/admin/product/grid" },
      { label: "Details", href: "/admin/product/details" },
      { label: "Edit", href: "/admin/product/edit" },
      { label: "Create", href: "/admin/product/create" },
    ],
  },
  {
    label: "Category",
    icon: <FaTags className="mr-2" />,
    children: [],
  },
  {
    label: "Inventory",
    icon: <FaBoxOpen className="mr-2" />,
    children: [],
  },
  {
    label: "Orders",
    icon: <FaTruck className="mr-2" />,
    href: "/admin/orders",
  },
  {
    label: "Purchases",
    icon: <FaShoppingCart className="mr-2" />,
    children: [],
  },
  {
    label: "Attributes",
    icon: <FaMagic className="mr-2" />,
    children: [],
  },
  {
    label: "Users",
    icon: <FaUsers className="mr-2" />,
    href: "/admin/users",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>("Products");

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 p-5 overflow-y-auto shadow-sm">
      <div className="mb-6 text-center">
        <Link href="/">
          <div className="flex flex-col items-center">
            <img
              src="/logo.svg"
              alt="Venton Logo"
              className="w-8 h-8 mb-1 hover:scale-110 transition-transform"
            />
            <span className="text-sm font-semibold text-gray-800">Venton</span>
          </div>
        </Link>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase mb-3 px-3 tracking-wider">GENERAL</p>

      <ul className="space-y-1">
        {menu.map((item) => (
          <li key={item.label}>
            {item.children && item.children.length > 0 ? (
              <div>
                <button
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                  className="flex justify-between items-center w-full px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition"
                >
                  <span className="flex items-center">{item.icon}{item.label}</span>
                  {open === item.label ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                </button>
                {open === item.label && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition hover:bg-blue-50 ${
                            pathname === sub.href ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-600"
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
                  pathname === item.href ? "bg-blue-100 text-blue-700" : "text-gray-600"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
