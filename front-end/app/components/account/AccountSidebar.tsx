'use client';

import clsx from 'clsx';

export default function AccountSidebar({
  currentSection,
  onChangeSection,
}: {
  currentSection: string;
  onChangeSection: (section: string) => void;
}) {
  return (
    <div className="w-[270px] pr-6 pt-20">
      <div>
        <h3 className="text-[17px] font-bold text-black mb-3">Manage My Account</h3>
        <ul className="space-y-3 text-sm">
          <li className="pl-6">
            <button
              onClick={() => onChangeSection('profile')}
              className={clsx(
                'block text-left w-full',
                currentSection === 'profile'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-500 hover:text-[#DB4444]'
              )}
            >
              My Profile
            </button>
          </li>

          <li className="pl-6">
            <button
              onClick={() => onChangeSection('address')}
              className={clsx(
                'block text-left w-full',
                currentSection === 'address'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-500 hover:text-[#DB4444]'
              )}
            >
              Address
            </button>
          </li>

          <li className="pl-6">
            <button
              onClick={() => onChangeSection('changepassword')}
              className={clsx(
                'block text-left w-full',
                currentSection === 'changepassword'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-500 hover:text-[#DB4444]'
              )}
            >
              Change Password
            </button>
          </li>
        </ul>

        <h3 className="text-[17px] font-bold text-black mt-4 mb-3">My Orders</h3>
        <ul className="space-y-3 text-sm">
          <li className="pl-6">
            <button
              onClick={() => onChangeSection('returns')}
              className={clsx(
                'block text-left w-full',
                currentSection === 'returns'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-500 hover:text-[#DB4444]'
              )}
            >
              My Returns
            </button>
          </li>
          <li className="pl-6">
            <button
              onClick={() => onChangeSection('cancellations')}
              className={clsx(
                'block text-left w-full',
                currentSection === 'cancellations'
                  ? 'text-[#DB4444] font-medium'
                  : 'text-gray-500 hover:text-[#DB4444]'
              )}
            >
              My Cancellations
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
