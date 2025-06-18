"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");

  if (tokenFromUrl) {
    Cookies.set("authToken", tokenFromUrl, { expires: 7 });
    params.delete("token");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }

  const token = tokenFromUrl || Cookies.get("authToken");


    if (token) {
      if (tokenFromUrl) {
        Cookies.set("authToken", tokenFromUrl, { expires: 7 });
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState(null, "", url.toString());
      }

      axios
        .get("http://localhost:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data;
          if (!["seller", "admin"].includes(user.role)) {
            showAuthFailed();
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          showAuthFailed();
        });
    } else {
      showAuthFailed();
    }

    function showAuthFailed() {
      Cookies.remove("authToken");

      // Gắn style tùy chỉnh nút đóng
      const style = document.createElement("style");
      style.innerHTML = `
        .swal2-close {
          color: #999 !important;
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .swal2-close:hover {
          color: red !important;
        }
      `;
      document.head.appendChild(style);

      Swal.fire({
        icon: "error",
        title: "Xác thực người dùng thất bại",
        text: "Vui lòng đăng nhập lại để tiếp tục.",
        showCloseButton: true,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      }).then(() => {
        router.push("http://localhost:3000/login");
      });

      // Cleanup style khi popup đóng
      setTimeout(() => {
        document.head.removeChild(style);
      }, 4500);
    }
  }, [router, searchParams]);

  if (loading)
    return (
      <html lang="en">
        <body
          className={`bg-gray-50 text-gray-900 font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}
        >
          <p className="p-6 text-center">Đang kiểm tra đăng nhập...</p>
        </body>
      </html>
    );

  return (
    <html lang="en">
      <body
        className={`bg-gray-50 text-gray-900 font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}
      >
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-h-screen ml-64">
            <Header />
            <main className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
