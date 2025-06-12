'use client';

import Link from 'next/link';
import AboutPage from "@/app/components/about/AboutPage";

export default function AboutRouter() {
  return (
    <div className="bg-white pt-16 pb-16 min-h-screen">
      {/* Breadcrumb full width */}
      <div className="w-full bg-white py-4">
        <div className="container mx-auto px-4 max-w-[1170px]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <Link href="/" className="hover:text-[#DB4444] cursor-pointer">
                Trang Chủ
              </Link>
              <span className="mx-2">/</span>
              <span>Giới Thiệu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - centered without sidebar */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="flex justify-center mt-8">
          <div className="w-full max-w-4xl p-6">
            <AboutPage />
          </div>
        </div>
      </div>
    </div>
  );
}