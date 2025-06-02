
import Header from "@/app/components/common/Header";
import { Geist } from "next/font/google";
import FlashSaleSection from "@/app/components/home/FlashSaleSection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
      

  return (
    <html lang="en">
      <body className={geistSans.className}>
        <Header />
       
        {children}
        <div className="bg-white">
        <div className="container mx-auto min-h-screen bg-white">
      <FlashSaleSection />
    </div>
    </div>
      </body>
    </html>
  );
}
// pages/index.tsx




