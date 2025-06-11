'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation'; // Sử dụng useRouter để chuyển trang
import { FaUserCircle, FaBoxOpen, FaTicketAlt } from 'react-icons/fa'; // Thêm icon từ React Icons


export default function AccountSidebar({
  currentSection,
  onChangeSection,
}: {
  currentSection: string;
  onChangeSection: (section: string) => void;
}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter(); // Khởi tạo router để chuyển trang

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) return;
    axios
      .get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        Cookies.remove('authToken');
        setUser(null);
      });
  }, []);

  const getActiveClass = (section: string) => {
    return currentSection === section
      ? 'text-[#DB4444] font-medium' // Active class
      : 'text-gray-500 hover:text-[#DB4444]'; // Default class
  };

  return (
    <div className="w-[290px] pr-6 pt-20">
      {user && (
        <div className="flex items-center space-x-3 mb-6">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="User Icon"
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 flex items-center justify-center bg-gray-500 text-white text-xl rounded-full">
              {user.name[0]}
            </div>
          )}
          <span className="text-xl font-semibold text-black">{user.name}</span>
        </div>
      )}

      <div>
        <ul className="space-y-4 text-lg">
          {/* ✅ Mục: My Account */}
          <li>
            <button
              className={clsx(
                'flex items-center space-x-3 block text-left w-full text-black font-semibold',
                'text-[#DB4444]'
              )}
            >
              <FaUserCircle className="w-6 h-6 text-orange-500 hover:text-[#DB4444]" />
              <span>My Account</span>
            </button>
            {/* Luôn hiển thị menu con */}
            <ul className="pl-6 space-y-2 pt-2">
              <li>
                <button
                  onClick={() => onChangeSection('profile')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('profile') // Get the active class dynamically
                  )}
                >
                  Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onChangeSection('changepassword')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('changepassword') // Get the active class dynamically
                  )}
                >
                  Change Password
                </button>
              </li>
              <li>
                <button
                  onClick={() => onChangeSection('address')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('address') // Get the active class dynamically
                  )}
                >
                  Address
                </button>
              </li>
              {/* ✅ Mục: Followed Shops */}
              <li>
                <button
                  onClick={() => onChangeSection('followedshops')} // Chuyển đến trang Followed Shops
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('followedshops') // Get the active class dynamically
                  )}
                >
                  Followed Shops
                </button>
              </li>
            </ul>
          </li>

          {/* ✅ Mục: My Orders */}
          <li>
            <button
              onClick={() => onChangeSection('orders')}
              className={clsx(
                'flex items-center space-x-3 block text-left w-full text-black font-semibold',
                'hover:text-[#DB4444]',
                getActiveClass('orders') // Active class for orders
              )}
            >
              <FaBoxOpen className="w-6 h-6 text-green-500 hover:text-[#DB4444]" />
              <span>My Orders</span>
            </button>
          </li>

          {/* ✅ Mục: My Vouchers */}
          <li>
            <button
              onClick={() => onChangeSection('vouchers')}
              className={clsx(
                'flex items-center space-x-3 block text-left w-full text-black font-semibold',
                'hover:text-[#DB4444]',
                getActiveClass('vouchers') // Active class for vouchers
              )}
            >
              <FaTicketAlt className="w-6 h-6 text-blue-500 hover:text-[#DB4444]" />
              <span>My Vouchers</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
