import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`bg-gray-50 text-gray-900 font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 min-h-screen ml-64">
              <Header />
              <main className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
