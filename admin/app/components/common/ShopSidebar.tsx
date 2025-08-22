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
        label: item.label,
        children: item.children.map((c) => ({
          key: c.href,
          icon: <div className="w-2 h-2 rounded-full bg-[#94a3b8]" />,
          label: <Link href={c.href}>{c.label}</Link>,
        })),
      };
    }
    return {
      key: (item as Extract<MenuRoot, { href: string }>).href,
      icon: <span className="text-[#9ca3af]">{item.icon}</span>,
      label: <Link href={(item as Extract<MenuRoot, { href: string }>).href}>{item.label}</Link>,
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

  const palette = {
    bg: "#0f172a",
    bgSoft: "#0b1221",
    text: "#e2e8f0",
    border: "#334155",
    accent: "#db4444",
  } as const;

  const LogoBar = (
    <div className="flex items-center justify-center px-6 py-5" style={{ borderBottom: `1px solid ${palette.border}B3`, background: palette.bgSoft }}>
      <a href={typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:3000" : "https://marketo.info.vn"} className="inline-flex items-center gap-2">
        <Image src="/logo.png" alt="MarketO Logo" width={128} height={40} priority />
        <span className="ml-2 text-xs text-[#9ca3af]">Quản trị</span>
      </a>
    </div>
  );

  const Nav = (
    <div className="h-full flex flex-col" style={{ color: palette.text }}>
      {LogoBar}
      <div className="px-2 flex-1 overflow-y-auto no-scrollbar">
        <Menu
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
          openKeys={currentOpen}
          onOpenChange={(keys) => setCurrentOpen(keys as string[])}
          onClick={() => !isDesktop && setDrawerOpen(false)}
          style={{ background: "transparent", borderRight: 0 }}
        />
      </div>
      <div className="px-4 py-3 text-[11px]" style={{ color: "#94a3b8", background: palette.bgSoft, borderTop: `1px solid ${palette.border}B3` }}>
        © {new Date().getFullYear()} MarketO
      </div>
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: { colorPrimary: palette.accent, colorBgBase: palette.bg, colorTextBase: palette.text, colorBorder: palette.border, borderRadius: 12 },
        components: { Menu: { itemSelectedColor: "#fff", itemSelectedBg: palette.accent, itemHoverBg: "#1e293b" } },
      }}
    >
      {/* Topbar (mobile) */}
      {!isDesktop && (
        <div className="lg:hidden sticky top-0 z-[60]" style={{ background: palette.bg, color: palette.text, borderBottom: `1px solid ${palette.border}B3` }}>
          <div className="h-12 flex items-center justify-between px-3">
            <Button type="text" onClick={() => setDrawerOpen(true)} icon={<MenuIcon size={18} />} style={{ color: palette.text }}>
              Menu
            </Button>
            <Link href="/shop-admin/dashboard" className="text-sm font-medium">
              Bảng điều khiển
            </Link>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {isDesktop && <div className="h-screen sticky top-0 z-[50]" style={{ background: palette.bg }}>{Nav}</div>}

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Drawer
          placement="left"
          maskClosable
          destroyOnClose
          width={typeof window !== "undefined" ? Math.min(320, Math.round(window.innerWidth * 0.8)) : 260}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          bodyStyle={{ padding: 0, background: palette.bg }}
          styles={{ mask: { backgroundColor: "rgba(0,0,0,.45)" } }}
        >
          {Nav}
        </Drawer>
      )}
    </ConfigProvider>
  );
}
