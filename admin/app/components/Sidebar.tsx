"use client";

import { useState, useEffect } from "react";
import {
  FaTshirt,
  FaClipboardList,
  FaTags,
  FaBoxOpen,
  FaTruck,
  FaUsers,
  FaChevronDown,
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

export default function ModernAdminSidebar() {
  const [activeItem, setActiveItem] = useState(window.location.pathname); // Keep track of the active path
  const [openDropdowns, setOpenDropdowns] = useState(new Set());

  const toggleDropdown = (label: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(label)) {
      newOpenDropdowns.delete(label);
    } else {
      newOpenDropdowns.add(label);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const handleItemClick = (href: string) => {
    setActiveItem(href); // Update the active item
    window.location.href = href; // Navigate to the clicked page
  };

  useEffect(() => {
    // If the page is loaded or refreshed, make sure the correct item is highlighted
    setActiveItem(window.location.pathname);
  }, []);

  return (
    <div className="h-screen w-72 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo" className="w-32 h-auto" />
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Navigation
          </p>

          <nav className="space-y-1">
            {menu.map((item) => {
              const isActive = activeItem === item.href;
              const isOpen = openDropdowns.has(item.label);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.label} className="relative">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isOpen
                        ? "bg-[#db4444] text-white"  // Red background and white text when active
                        : "text-gray-700 hover:bg-[#db4444] hover:text-white"
                        }`}
                    >
                      <div className="flex items-center">
                        <span className={`text-lg mr-3 ${isOpen ? "text-white" : "text-gray-500"}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                        <FaChevronRight className="text-xs" />
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleItemClick(item.href)}
                      className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                        ? "bg-[#db4444] text-white"  // Red background and white text when active
                        : "text-gray-700 hover:bg-[#db4444] hover:text-white"
                        }`}
                    >
                      <span className={`text-lg mr-3 ${isActive ? "text-white" : "text-gray-500"}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {hasChildren && isOpen && (
                    <div className="mt-1 ml-4 pl-6 border-l-2 border-gray-100">
                      {item.children.map((child) => {
                        const isChildActive = activeItem === child.href;
                        return (
                          <button
                            key={child.href}
                            onClick={() => handleItemClick(child.href)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mt-1 ${isChildActive
                              ? "bg-[#db4444]/10 text-[#db4444] border-l-2 border-[#db4444]"  // Slightly darker red for active child
                              : "text-gray-600 hover:bg-[#db4444] hover:text-white"
                              }`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-3 ${isChildActive ? "bg-[#db4444]" : "bg-gray-300"}`}></div>
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-50 pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Quick Actions
          </p>
          <div className="space-y-2">
            <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#db4444] transition-all duration-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Add Product
            </button>
            <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#db4444] transition-all duration-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
