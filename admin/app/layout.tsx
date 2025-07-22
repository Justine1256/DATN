"use client";

import { usePathname } from "next/navigation";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import ShopSidebar from "./components/common/ShopSidebar";
import ModernAdminHeader from "./components/common/Header";
import { AuthProvider, useAuth } from "./AuthContext";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// Giao diện nội dung, phân role & sidebar
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isNotFound = pathname === "/404" || pathname.includes("not-found");

  // Trang lỗi → không render layout
  if (isNotFound) return <div>{children}</div>;

  // Chưa load user → tránh nhấp nháy layout
  if (!user) return null;

  // Xác định layout sidebar
  const Sidebar = user.role === "admin" ? AdminSidebar : ShopSidebar;

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
      <body className={`bg-[#f9fafb] text-gray-900 font-sans antialiased ${roboto.variable}`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
