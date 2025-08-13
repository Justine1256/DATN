"use client";

import { usePathname } from "next/navigation";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import ShopSidebar from "./components/common/ShopSidebar";
import ModernAdminSidebar from "./components/common/Adminsiderbar";
import { AuthProvider, useAuth } from "./AuthContext";
import axios from 'axios';
axios.defaults.baseURL = 'https://marketo.info.vn';
axios.defaults.withCredentials = true;
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// Giao diện nội dung, phân role & sidebar
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthReady } = useAuth();

  const isNotFound = pathname === "/404" || pathname.includes("not-found");

  if (isNotFound) return <div>{children}</div>;

  if (!isAuthReady) return <div className="p-4">Đang kiểm tra phiên đăng nhập...</div>;

  // Không có user → hiển thị giao diện login hoặc thông báo
  if (!user) return <div className="p-4">Bạn chưa đăng nhập.</div>;

  const Sidebar = user.role === "admin" ? ModernAdminSidebar : ShopSidebar;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#f9fafb]">
          <div className="w-full px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}


// Gốc toàn bộ app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><title>Admin Marketo</title></head>
      <body className={`bg-[#f9fafb] text-gray-900 font-sans antialiased ${roboto.variable}`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
