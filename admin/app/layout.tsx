"use client";

import { usePathname } from "next/navigation";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import { AuthProvider } from "./AuthContext";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Kiểm tra nếu là not-found, thì render không sidebar/header
  const isNotFound = pathname === "/404" || pathname.includes("not-found");

  return (
    <html lang="en">
      <body
        className={`bg-[#f9fafb] text-gray-900 font-sans antialiased ${roboto.variable}`}
      >
        <AuthProvider>
          {isNotFound ? (
            <div>{children}</div>
          ) : (
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto bg-[#f9fafb]">
                  <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
                </main>
              </div>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
