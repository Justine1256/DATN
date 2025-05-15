import { ReactNode } from "react";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';


/* import Footer from "./components/Footer"; */
/* import HeroSection from "./components/HeroSection";  */

interface LayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
    return (
        <>
          
            <main>{children}</main>
        </>
    );
}
