"use client";

import { usePathname } from "next/navigation";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import ShopSidebar from "./components/common/ShopSidebar";
import ModernAdminSidebar from "./components/common/Adminsiderbar";
import { AuthProvider, useAuth } from "./AuthContext";
import axios from "axios";

axios.defaults.baseURL = "https://marketo.info.vn";
axios.defaults.withCredentials = true;

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// ====== Loading đẹp với chữ Marketo + thanh load ======
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <style jsx global>{`
        @keyframes brandShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="w-full max-w-md text-center">
        {/* Logo text Marketo */}
        <div
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent select-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #db4444, #ef7a7a, #db4444)",
            backgroundSize: "200% 200%",
            animation: "brandShine 2.4s ease-in-out infinite",
          }}
        >
          Marketo
        </div>

        {/* Thông điệp */}
        <p className="text-gray-600 mb-6">
          Đang kiểm tra phiên đăng nhập...
        </p>

        {/* Thanh load */}
        <div className="relative h-2 w-full bg-white/70 rounded-full overflow-hidden shadow-inner border border-gray-200">
          <span
            className="absolute top-0 bottom-0 left-0 w-1/3 rounded-full"
            style={{
              background: "#db4444",
              animation: "loadingBar 1.15s ease-in-out infinite",
            }}
          />
        </div>

        {/* Hint nhỏ */}
        <div className="mt-4 text-xs text-gray-400">
          Vui lòng chờ giây lát…
        </div>
      </div>
    </div>
  );
}

// ====== Màn hình chưa đăng nhập ======
function NotLoggedInScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-xl p-8">
        <div className="text-3xl font-extrabold text-[#db4444] mb-2">
          Marketo
        </div>
        <p className="text-gray-600 mb-6">Bạn chưa đăng nhập.</p>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-white font-semibold shadow-sm transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: "#db4444" }}
        >
          Đăng nhập ngay
        </a>
      </div>
    </div>
  );
}

// ====== Nội dung, phân role & sidebar ======
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthReady } = useAuth();

  const isNotFound = pathname === "/404" || pathname.includes("not-found");
  if (isNotFound) return <div>{children}</div>;

  // Loading kiểm tra đăng nhập (đẹp)
  if (!isAuthReady) return <AuthLoadingScreen />;

  // Chưa đăng nhập
  if (!user) return <NotLoggedInScreen />;

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

// ====== Root Layout ======
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <title>Admin Marketo</title>
        <meta name="theme-color" content="#db4444" />
      </head>
      <body
        className={`bg-[#f9fafb] text-gray-900 font-sans antialiased ${roboto.variable}`}
      >
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
