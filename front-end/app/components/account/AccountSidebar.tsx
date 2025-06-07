'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[270px] pr-8 pt-10">
      <div>
        <h3 className="text-[17px] font-semibold mb-4">Manage My Account</h3>
        <ul className="space-y-3 text-sm">
          <li className="pl-6">
            <Link
              href="/account/profile"
              className={clsx(
                'block',
                pathname === '/account/profile'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-700 hover:text-[#DB4444]'
              )}
            >
              My Profile
            </Link>
          </li>
          <li className="pl-6"> 
            <Link
              href="/account/payment"
              className={clsx(
                'block',
                pathname === '/account/payment'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-700 hover:text-[#DB4444]'
              )}
            >
              My Payment Options
            </Link>
          </li>
        </ul>

        <h3 className="text-[17px] font-semibold mt-10 mb-4">My Orders</h3>
        <ul className="space-y-3 text-sm">
          <li className="pl-6">
            <Link
              href="/account/returns"
              className={clsx(
                'block',
                pathname === '/account/returns'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-700 hover:text-[#DB4444]'
              )}
            >
              My Returns
            </Link>
          </li>
          <li className="pl-6">
            <Link
              href="/account/cancellations"
              className={clsx(
                'block',
                pathname === '/account/cancellations'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-700 hover:text-[#DB4444]'
              )}
            >
              My Cancellations
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}