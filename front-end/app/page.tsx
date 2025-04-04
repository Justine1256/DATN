import { ReactNode } from "react";
import "./globals.css";
/* import Header from "./components/Header"; */
import BannerSection from "./components/BannerSection"
/* import Footer from "./components/Footer"; */
/* import HeroSection from "./components/HeroSection";  */

interface LayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
    return (
        <>
            <BannerSection />
            <main>{children}</main>
        </>
    );
}
