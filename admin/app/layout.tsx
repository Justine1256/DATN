"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

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
    const tokenFromUrl = searchParams.get("token");
    const tokenFromCookie = Cookies.get("authToken");

    const token = tokenFromUrl || tokenFromCookie;

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
        .then(() => {
          setLoading(false);
        })
        .catch(() => {
          Cookies.remove("authToken");
          router.push("/login");
        });
    } else {
      router.push("/login");
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
            <main className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
