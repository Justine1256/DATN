import type { Metadata } from "next";
import "@/app/globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import LoadingBar from "./components/common/LoadingBar";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import FloatingTools from "./components/chat/FloatingTools";
import { UserProvider } from "./context/UserContext";

export const metadata: Metadata = {
  title: "Marketo",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* Thêm Google Font Roboto */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-roboto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <UserProvider> {/* Cung cấp context người dùng cho toàn bộ ứng dụng */}
          {/* ✅ Thanh loading bar cố định (trên cùng) */}
          <LoadingBar />
          {/* ✅ Layout chính gồm Header, nội dung, Footer */}
          <div id="layout" className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow pt-[98px] px-4 sm:px-6 md:px-8">
              {children}
            </main>
            <Footer />
          </div>
          {/* ✅ Nút nổi cố định cuối cùng */}
          <div className="fixed bottom-6 right-6 z-50">
            {/* Adjust the z-index and positioning to ensure it's always visible */}
            <FloatingTools />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
