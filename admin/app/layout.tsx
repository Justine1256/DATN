import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import { AuthProvider } from "./AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
interface HeaderProps {
  className?: string; // Add className as an optional prop
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`bg-gray-50 text-gray-900 font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          {/* Main container holding Sidebar and Main Content */}
          <div className="flex h-screen overflow-hidden"> {/* full height, no overflow, flex layout */}

            {/* Sidebar: Keeps its height, no need to adjust */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden"> {/* Take remaining space, no overflow */}

              {/* Header: Fixed at the top */}
              <Header className="flex-shrink-0 w-full fixed top-0 left-0 z-10" /> {/* Fixed header */}

              {/* Main Content: Scrolling area for content */}
              <main className="flex-1 mt-20 p-6 overflow-y-auto"> {/* Add margin-top to avoid overlap with fixed header */}
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
