'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaBoxOpen, FaTicketAlt, FaEdit } from 'react-icons/fa';
import Image from 'next/image';
import { STATIC_BASE_URL } from '@/utils/api';

interface UserProps {
  name: string;
  avatar?: string;
}

interface AccountSidebarProps {
  currentSection: string;
  onChangeSection: (section: string) => void;
  user: UserProps | null;
}

export default function AccountSidebar({
  currentSection,
  onChangeSection,
  user,
}: AccountSidebarProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const router = useRouter();

  const getActiveClass = (section: string) => {
    return currentSection === section ? 'text-[#DB4444] font-medium' : 'text-[#6c757d]';
  };

  const handleAccountClick = () => {
    setIsAccountOpen(!isAccountOpen);
  };

  return (
    <div className="w-[290px] pr-6 pt-20">
      {/* ✅ Thông tin người dùng */}
      {user && (
        <div className="flex items-center space-x-3 mb-6">
          {user.avatar ? (
  <div className="w-14 h-14 relative">
    <Image
      src={`${STATIC_BASE_URL}/${user.avatar}`}
      alt="User Icon"
      fill
      className="rounded-full object-cover"
      sizes="56px"
    />
  </div>
) : (
  <div className="w-14 h-14 flex items-center justify-center bg-[#DB4444] text-white text-xl font-semibold rounded-full">
    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
  </div>
)}


          {/* ✅ Tên + chỉnh sửa */}
          <div>
            <span className="text-xl font-semibold text-black block">{user.name}</span>
            <div
              className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer mt-1"
              onClick={() => onChangeSection('profile')}
            >
              <FaEdit className="w-3 h-3" />
              <span>Chỉnh sửa hồ sơ</span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Danh sách menu tài khoản */}
      <ul className="space-y-4 text-lg">
        <li>
          <button
            onClick={handleAccountClick}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full',
              getActiveClass('profile')
            )}
          >
            <FaUserCircle className="w-6 h-6 text-[#DB4444]" />
            <span className="text-xl font-bold">Tài Khoản Của Tôi</span>
          </button>
          {isAccountOpen && (
            <ul className="pl-6 space-y-2 pt-2">
              <li>
                <button
                  onClick={() => onChangeSection('profile')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('profile')
                  )}
                >
                  Hồ Sơ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onChangeSection('changepassword')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('changepassword')
                  )}
                >
                  Đổi Mật Khẩu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onChangeSection('address')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('address')
                  )}
                >
                  Địa chỉ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onChangeSection('followedshops')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('followedshops')
                  )}
                >
                  Shop Theo Dõi
                </button>
              </li>
            </ul>
          )}
        </li>

        <li>
          <button
            onClick={() => onChangeSection('orders')}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full',
              getActiveClass('orders')
            )}
          >
            <FaBoxOpen className="w-6 h-6 text-[#28A745]" />
            <span className="text-xl font-bold">Đơn Hàng</span>
          </button>
        </li>

        <li>
          <button
            onClick={() => onChangeSection('vouchers')}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full',
              getActiveClass('vouchers')
            )}
          >
            <FaTicketAlt className="w-6 h-6 text-[#007BFF]" />
            <span className="text-xl font-bold">Mã Giảm Giá</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
