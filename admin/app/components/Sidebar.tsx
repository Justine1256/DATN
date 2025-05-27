// components/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaTshirt, FaChevronDown, FaChevronUp } from "react-icons/fa";

const menu = [
  {
    label: "Products",
    icon: <FaTshirt className="inline mr-2" />,
    children: [
      { label: "List", href: "/product" },
      { label: "Grid", href: "/product/grid" },
      { label: "Details", href: "/product/details" },
      { label: "Edit", href: "/product/edit" },
      { label: "Create", href: "/product/create" },
    ],
  },
  { label: "Orders", href: "/orders" },
  { label: "Users", href: "/users" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>("Products");

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r p-4 overflow-y-auto">
      <div className="text-xl font-bold mb-6">Venton</div>
      <ul className="space-y-2">
        {menu.map((item) => (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                  className="flex justify-between w-full p-2 rounded hover:bg-gray-100 text-gray-700 text-left"
                >
                  <span className="flex items-center">{item.icon} {item.label}</span>
                  {open === item.label ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {open === item.label && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.children.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={`block p-2 rounded hover:bg-gray-100 text-sm ${
                            pathname === sub.href ? "bg-gray-100 text-blue-600" : "text-gray-700"
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
                href={item.href}
                className={`block p-2 rounded hover:bg-gray-100 text-sm font-medium ${
                  pathname === item.href ? "bg-gray-100 text-blue-600" : "text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}