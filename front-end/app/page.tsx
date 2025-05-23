import CategoryMenuWithBanner from "@/app/components/common/Banner";
import Header from "@/app/components/common/Header";
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const headerTopHeight = 38;
  const headerBottomHeight = 60;
  const headerHeight = headerTopHeight + headerBottomHeight;

  return (
    <html lang="en">
      <body className={geistSans.className}>
        <Header />
        <CategoryMenuWithBanner headerHeight={headerHeight} />
        {children}
      </body>
    </html>
  );
}
