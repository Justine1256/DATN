'use client';
import AccountPage from "@/app/components/account/AccountPage";

export default function AccountRoute() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white pt-16 pb-16">
      {/* Left Sidebar Section */}
      <div className="hidden md:block md:w-1/4 border-r px-6">
        <h3 className="text-lg font-semibold mt-10">Manage My Account</h3>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="text-[#DB4444] font-medium">My Profile</li>
          <li className="text-gray-700">Address Book</li>
          <li className="text-gray-700">My Payment Options</li>
        </ul>

        <h3 className="text-lg font-semibold mt-10">My Orders</h3>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="text-gray-700">My Returns</li>
          <li className="text-gray-700">My Cancellations</li>
        </ul>

        <h3 className="text-lg font-semibold mt-10">My Wishlist</h3>
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-3/4 flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-3xl p-6">
          <AccountPage />
        </div>
      </div>
    </div>
  );
}