'use client';

import clsx from 'clsx';

// ✅ Component hiển thị sidebar tài khoản người dùng
export default function AccountSidebar({
  currentSection,            // ✅ Section hiện tại đang được hiển thị (ví dụ: 'profile')
  onChangeSection,           // ✅ Hàm callback dùng để thay đổi section khi click menu
}: {
  currentSection: string;
  onChangeSection: (section: string) => void;
}) {
  return (
    <div className="w-[270px] pr-6 pt-20">
      <div>
        {/* ✅ Tiêu đề: Quản lý tài khoản */}
        <h3 className="text-[17px] font-bold text-black mb-3">Manage My Account</h3>
        
        {/* ✅ Danh sách điều hướng các mục tài khoản */}
        <ul className="space-y-3 text-sm">
          {/* ✅ Mục: My Profile */}
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

          {/* ✅ Mục: Address */}
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

          {/* ✅ Mục: Change Password */}
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

        {/* ✅ Tiêu đề: Đơn hàng */}
        <h3 className="text-[17px] font-bold text-black mt-4 mb-3">My Orders</h3>
        
        {/* ✅ Danh sách các mục đơn hàng */}
        <ul className="space-y-3 text-sm">
          {/* ✅ Mục: My Returns */}
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

          {/* ✅ Mục: My Cancellations */}
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
