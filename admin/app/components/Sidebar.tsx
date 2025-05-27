"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  FaTshirt,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaUsers,
  FaBoxOpen,
  FaTags,
  FaTruck,
} from "react-icons/fa";

const menu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <FaClipboardList className="mr-2" />,
  },
  {
    label: "Products",
    icon: <FaTshirt className="mr-2" />,
    children: [
      { label: "List", href: "/product" },
      { label: "Grid", href: "/product/grid" },
      { label: "Details", href: "/product/details" },
      { label: "Edit", href: "/product/edit" },
      { label: "Create", href: "/product/create" },
    ],
  },
  {
    label: "Categories",
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
    href: "/orders",
  },
  {
    label: "Users",
    icon: <FaUsers className="mr-2" />,
    href: "/users",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>("Products");

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r p-4 overflow-y-auto">
      {/* Logo */}
      <div className="mb-6">
     

<Link href="/" prefetch>
  <Image
    src="/red-logo.svg"
    alt="Venton Logo"
    width={40}
    height={40}
    className="mx-auto"
    priority
  />
</Link>

      </div>

      {/* Section title */}
      <p className="text-xs font-semibold text-gray-500 uppercase mb-3 px-3">Overview</p>

      <ul className="space-y-1">
        {menu.map((item) => (
          <li key={item.label}>
            {item.children && item.children.length > 0 ? (
              <div>
                <button
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                  className="flex justify-between items-center w-full px-3 py-2 rounded hover:bg-gray-100 text-gray-700 text-sm transition-colors"
                >
                  <span className="flex items-center">{item.icon} {item.label}</span>
                  {open === item.label ? (
                    <FaChevronUp className="text-xs" />
                  ) : (
                    <FaChevronDown className="text-xs" />
                  )}
                </button>
                {open === item.label && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          prefetch
                          className={`block px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors ${
                            pathname === sub.href ? "bg-gray-100 text-blue-600 font-medium" : "text-gray-700"
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
                prefetch
                className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 text-sm font-medium transition-colors ${
                  pathname === item.href ? "bg-gray-100 text-blue-600" : "text-gray-700"
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
