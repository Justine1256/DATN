import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"; // This is likely the ModernAdminSidebar from your previous code
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
          <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Assuming it has a fixed width like w-72 or w-64 */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col"> 
              {/* Header */}
              <Header />

              {/* Main Content */}
              <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}