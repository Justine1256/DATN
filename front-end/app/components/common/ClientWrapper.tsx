'use client';

import Header from "./Header";
import Footer from "./Footer";
import FloatingTools from "../chat/FloatingTools";
import LoadingBar from "./LoadingBar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <>
            <LoadingBar />
            <div id="layout" className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-grow pt-[98px] px-4 sm:px-6 md:px-8">{children}</main>
                <Footer />
            </div>
            <div className="fixed bottom-6 right-6 z-50">
                <FloatingTools />
            </div>
        </>
    );
}
