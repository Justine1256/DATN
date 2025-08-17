"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChevronRight } from "react-icons/fa";
import {
    Package,
    Tags,
    Warehouse,
    Truck,
    Users,
    MessageSquare,
    LayoutDashboard,
    PlusCircle,
    Menu, // ⬅️ thêm để dùng trên mobile
} from "lucide-react";
import { UserOutlined } from "@ant-design/icons";

export const menu = [
    {
        label: "Bảng điều khiển",
        href: "/admin/dashboard",
        icon: <LayoutDashboard size={18} />,
    },
    {
        label: "Quản lý người dùng",
        icon: <UserOutlined style={{ fontSize: 18 }} />,
        children: [{ label: "Danh sách người dùng", href: "/admin/client" }],
    },
    {
        label: "Quản lý shop",
        icon: <Warehouse size={18} />,
        children: [{ label: "Danh sách cửa hàng", href: "/admin/shop" }],
    },
    {
        label: "Đơn hàng khiếu nại",
        icon: <Warehouse size={18} />,
        children: [{ label: "Danh sách đơn hàng", href: "/admin/refund-reports" }],
    },
    {
        label: "Mã Giảm Giá",
        icon: <MessageSquare size={18} />,
        children: [
            { label: "Mã giảm giá", href: "/admin/voucher" },
            { label: "Tạo mã giảm giá", href: "/admin/voucher/create" },
        ],
    },
    {
        label: "Quảng cáo",
        icon: <MessageSquare size={18} />,
        children: [{ label: "Quản lý banner", href: "/admin/banner" }],
    },
    // { label: "Tin nhắn", icon: <MessageSquare size={18} />, href: "/admin/chat" },
];

export default function ModernAdminSidebar() {
    const pathname = usePathname();
    const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
    const [mobileOpen, setMobileOpen] = useState(false);

    // Tự mở group khi route nằm trong group đó
    useEffect(() => {
        const opened = new Set<string>();
        menu.forEach((item) => {
            if (item.children?.length) {
                const isChildActive = item.children.some((c) => c.href === pathname);
                if (isChildActive || item.href === pathname) opened.add(item.label);
            }
        });
        setOpenDropdowns(opened);
        setMobileOpen(false); // đóng drawer khi đổi route
    }, [pathname]);

    const toggleDropdown = (label: string) => {
        const next = new Set(openDropdowns);
        next.has(label) ? next.delete(label) : next.add(label);
        setOpenDropdowns(next);
    };

    const SidebarContent = (
        <div className="h-full w-72 bg-[#0f172a] text-[#e2e8f0] border-r border-[#334155]/70 flex flex-col shadow-xl lg:shadow-none">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-[#334155]/70 flex justify-center bg-[#0b1221]">
                <a
                    href={
                        typeof window !== "undefined" && window.location.hostname === "localhost"
                            ? "http://localhost:3000"
                            : "https://marketo.info.vn"
                    }
                    className="inline-flex items-center"
                >
                    <img src="/logo.png" alt="MarketO Logo" className="w-32 h-auto" />
                </a>
            </div>

            {/* Menu (ẩn scrollbar nhưng vẫn cuộn) */}
            <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y">
                <div className="px-4 py-6">
                    <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.08em] mb-4 px-3">
                        Điều hướng
                    </p>
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
                                            className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#db4444]/40
                      ${isOpen || isActive ? "bg-[#db4444] text-white" : "hover:bg-[#1e293b] hover:text-white"}`}
                                            aria-expanded={isOpen}
                                            aria-controls={`group-${item.label}`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`text-lg mr-3 ${isOpen || isActive ? "text-white" : "text-[#9ca3af]"}`}>
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
                                            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#db4444]/40
                      ${isActive ? "bg-[#db4444] text-white" : "hover:bg-[#1e293b] hover:text-white"}`}
                                        >
                                            <span className={`text-lg mr-3 ${isActive ? "text-white" : "text-[#9ca3af]"}`}>{item.icon}</span>
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
                                                        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mt-1
                            ${isChildActive
                                                                ? "bg-[#db4444]/20 text-[#db4444] border-l-2 border-[#db4444]"
                                                                : "hover:bg-[#1e293b] hover:text-white"
                                                            } focus:outline-none focus:ring-2 focus:ring-[#db4444]/40`}
                                                    >
                                                        <div
                                                            className={`w-2 h-2 rounded-full mr-3 ${isChildActive ? "bg-[#db4444]" : "bg-[#94a3b8]"
                                                                }`}
                                                        />
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

            {/* Footer */}
            <div className="px-4 py-3 text-[11px] text-[#94a3b8] border-t border-[#334155]/70 bg-[#0b1221]">
                © {new Date().getFullYear()} MarketO
            </div>
        </div>
    );

    return (
        <>
            {/* Topbar (mobile) */}
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
                    <Link href="/admin/dashboard" className="text-sm font-medium">
                        Bảng điều khiển
                    </Link>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block h-screen sticky top-0 z-[50]">{SidebarContent}</div>

            {/* Mobile drawer + bo góc + shadow */}
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

            {/* Overlay */}
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
