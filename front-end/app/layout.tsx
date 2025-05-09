

import { ReactNode } from "react";
import "./globals.css";
import Header from "./components/Header";
import ImageSlider from "./components/Banner";
import Footer from "./components/Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <Header />
        <ImageSlider/>
        <main>{children}</main>
       {/*  <Footer /> */}
      </body>
    </html>
  );
}