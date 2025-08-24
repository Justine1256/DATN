"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  MessageSquare,
  PlusCircle,
  Settings,
  Menu as MenuIcon,
} from "lucide-react";
import { Button, Drawer, Grid, Menu, ConfigProvider, theme as antdTheme } from "antd";
import type { MenuProps } from "antd";

// ================== TYPES ==================
export type MenuChild = { label: string; href: string; icon?: React.ReactNode };
export type MenuRoot =
  | { label: string; icon: React.ReactNode; href: string; children?: undefined }
  | { label: string; icon: React.ReactNode; children: MenuChild[]; href?: undefined };

// ================== DATA ==================
export const menu: readonly MenuRoot[] = [
  { label: "Bảng điều khiển", href: "/shop-admin/dashboard", icon: <LayoutDashboard size={18} /> },
  {
    label: "Sản phẩm",
    icon: <Package size={18} />,
    children: [
      { label: "Danh sách", href: "/shop-admin/product" },
      { label: "Thêm mới", href: "/shop-admin/product/create", icon: <PlusCircle size={14} /> },
      { label: "Nhập hàng", href: "/shop-admin/shop/stock", icon: <PlusCircle size={14} /> },
      { label: "Chương trình khuyến mãi", href: "/shop-admin/sales", icon: <PlusCircle size={14} /> },
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
  { label: "Khách Hàng", icon: <Users size={18} />, href: "/shop-admin/customers" },
  {
    label: "Mã Giảm Giá",
    icon: <MessageSquare size={18} />,
    children: [
      { label: "Mã giảm giá", href: "/shop-admin/voucher" },
      { label: "Tạo mã giảm giá", href: "/shop-admin/voucher/create" },
    ],
  },
  { label: "Tin nhắn", icon: <MessageSquare size={18} />, href: "/shop-admin/chat" },
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
] as const;

// ================== HELPERS ==================
const buildAntdItems = (pathname: string) => {
  const items: MenuProps["items"] = menu.map((item) => {
    if ("children" in item && item.children) {
      return {
        key: item.label,
        icon: <span className="text-[#9ca3af]">{item.icon}</span>,
        label: <span className="text-[13px] font-medium">{item.label}</span>,
        children: item.children.map((c) => ({
          key: c.href,
          icon: c.icon ? (
            <span className="text-[#a3b1c8]">{c.icon}</span>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
          ),
          label: (
            <Link href={c.href} className="text-[13px]">
              {c.label}
            </Link>
          ),
        })),
      };
    }
    return {
      key: (item as Extract<MenuRoot, { href: string }>).href,
      icon: <span className="text-[#9ca3af]">{item.icon}</span>,
      label: (
        <Link href={(item as Extract<MenuRoot, { href: string }>).href} className="text-[13px] font-medium">
          {item.label}
        </Link>
      ),
    };
  });

  const selectedKeys: string[] = [];
  const openKeys: string[] = [];
  menu.forEach((m) => {
    if ("href" in m && m.href === pathname) selectedKeys.push(m.href);
    if ("children" in m && m.children?.some((c) => c.href === pathname)) {
      selectedKeys.push(pathname);
      openKeys.push(m.label);
    }
  });
  return { items, selectedKeys, openKeys };
};

const getDrawerWidth = () => {
  if (typeof window === "undefined") return 260;
  return Math.min(320, Math.round(window.innerWidth * 0.82));
};

// ================== COMPONENT ==================
export default function ModernAdminSidebar() {
  const pathname = usePathname() || "";
  const screens = Grid.useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items, selectedKeys, openKeys } = useMemo(() => buildAntdItems(pathname), [pathname]);
  const [currentOpen, setCurrentOpen] = useState<string[]>(openKeys);

  useEffect(() => {
    setDrawerOpen(false);
    setCurrentOpen(openKeys);
  }, [pathname]);

  const isDesktop = screens.lg;

  // Chủ đạo giống admin
  const palette = {
    bg: "#0f172a",        // slate-900
    bgSoft: "#0b1221",    // darker pane
    text: "#e2e8f0",      // slate-200
    border: "#334155",    // slate-600
    accent: "#DB4444",    // admin red
    hover: "#1e293b",     // slate-800
    selectedSoft: "rgba(219,68,68,0.14)",
  } as const;

  const LogoBar = (
    <div
      className="flex items-center justify-center px-6 py-5"
      style={{ borderBottom: `1px solid ${palette.border}B3`, background: palette.bgSoft }}
    >
      <a
        href={
          typeof window !== "undefined" && window.location.hostname === "localhost"
            ? "http://localhost:3000"
            : "https://marketo.info.vn"
        }
        className="inline-flex items-center gap-2"
      >
        <Image src="/logo.png" alt="MarketO Logo" width={128} height={40} priority />
        <span className="ml-2 text-xs text-[#9ca3af]">Quản trị</span>
      </a>
    </div>
  );

  const Nav = (
    <div className="h-full flex flex-col" style={{ color: palette.text }}>
      {LogoBar}

      {/* NAV */}
      <div className="px-2 flex-1 overflow-y-auto no-scrollbar">
        <Menu
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
          openKeys={currentOpen}
          onOpenChange={(keys) => setCurrentOpen(keys as string[])}
          onClick={() => !isDesktop && setDrawerOpen(false)}
          style={{ background: "transparent", borderRight: 0, padding: "8px 4px" }}
        />
      </div>

      {/* FOOTER */}
      <div
        className="px-4 py-3 text-[11px]"
        style={{ color: "#94a3b8", background: palette.bgSoft, borderTop: `1px solid ${palette.border}B3` }}
      >
        © {new Date().getFullYear()} MarketO
      </div>
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: palette.accent,
          colorBgBase: palette.bg,
          colorTextBase: palette.text,
          colorBorder: palette.border,
          borderRadius: 12,
          controlHeight: 36,
          controlPaddingHorizontal: 10,
        },
        components: {
          Menu: {
            itemBorderRadius: 10,
            itemMarginInline: 6,
            itemMarginBlock: 4,
            itemHeight: 40,
            fontSize: 13,
            itemColor: "#cbd5e1",
            itemHoverColor: "#ffffff",
            itemHoverBg: palette.hover,
            itemSelectedColor: "#ffffff",
            itemSelectedBg: palette.selectedSoft, // mềm hơn, giống admin
            groupTitleColor: "#93a4b8",
            subMenuItemBg: "transparent",
            activeBarBorderWidth: 0,
          },
        },
      }}
    >
      {/* Topbar (mobile) */}
      {!isDesktop && (
        <div
          className="lg:hidden sticky top-0 z-[60]"
          style={{ background: palette.bg, color: palette.text, borderBottom: `1px solid ${palette.border}B3` }}
        >
          <div className="h-12 flex items-center justify-between px-3">
            <Button
              type="text"
              onClick={() => setDrawerOpen(true)}
              icon={<MenuIcon size={18} />}
              style={{ color: palette.text }}
            >
              Menu
            </Button>
            <Link href="/shop-admin/dashboard" className="text-sm font-medium">
              Bảng điều khiển
            </Link>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside className="h-screen sticky top-0 z-[50]" style={{ background: palette.bg, width: 264 }}>
          {Nav}
        </aside>
      )}

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Drawer
          placement="left"
          maskClosable
          destroyOnClose
          width={getDrawerWidth()}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          bodyStyle={{ padding: 0, background: palette.bg }}
          styles={{ mask: { backgroundColor: "rgba(0,0,0,.45)" } }}
        >
          {Nav}
        </Drawer>
      )}

      {/* Ẩn scrollbar cho khối menu (tuỳ tiện ích Tailwind của bạn) */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </ConfigProvider>
  );
}
