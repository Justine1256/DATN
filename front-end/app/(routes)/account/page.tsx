'use client';

import Link from 'next/link';
import AccountSidebar from "@/app/components/account/AccountSidebar";
import AccountPage from "@/app/components/account/AccountPage";

export default function AccountRoute() {
  return (
    <div className="bg-white pt-16 pb-16 min-h-screen">
      {/* Breadcrumb full width */}
      <div className="w-full bg-white py-4">
        <div className="container mx-auto px-4 max-w-[1170px]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <Link href="/" className="hover:text-[#DB4444] cursor-pointer">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span>My Account</span>
            </div>
            <div className="text-sm font-medium">
              Welcome! <span className="text-[#DB4444]">Md Bitmel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="grid grid-cols-1 md:grid-cols-[270px,1fr] gap-8 mt-8">
          {/* Sidebar */}
          <div className="md:pr-8">
            <AccountSidebar />
          </div>
          
          {/* Account page content */}
          <div>
            <div className="flex justify-center">
              <div className="w-full max-w-3xl p-6">
                <AccountPage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}