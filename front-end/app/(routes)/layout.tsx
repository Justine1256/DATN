import { Geist } from "next/font/google";
import "@/app/styles/globals.css";
import Header from "@/app/components/common/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
