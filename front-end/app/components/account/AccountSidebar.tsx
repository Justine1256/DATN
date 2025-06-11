'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation'; 
import { FaUserCircle, FaBoxOpen, FaTicketAlt } from 'react-icons/fa'; 

export default function AccountSidebar({
  currentSection,
  onChangeSection,
}: {
  currentSection: string;
  onChangeSection: (section: string) => void;
}) {
  const [user, setUser] = useState<any>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false); // Điều khiển việc mở/đóng menu con "My Account"
  const router = useRouter();

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
    return currentSection === section ? 'text-[#DB4444] font-medium' : 'text-[#6c757d]';
  };

  const handleAccountClick = () => {
    setIsAccountOpen(!isAccountOpen); // Đảo ngược trạng thái mở/đóng của menu con
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
            <div className="w-14 h-14 flex items-center justify-center bg-[#DB4444] text-white text-xl font-semibold rounded-full">
              {user.name ? user.name[0] : 'U'} {/* Nền tròn màu đỏ với chữ cái đầu tiên */}
            </div>
          )}
          <span className="text-xl font-semibold text-black">{user.name}</span> {/* Tên vẫn là màu đen */}
        </div>
      )}


      <div>
        <ul className="space-y-4 text-lg">
          {/* ✅ Mục: My Account */}
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
            {/* Hiển thị menu con khi "My Account" được nhấn */}
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
                {/* ✅ Mục: Followed Shops */}
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

          {/* ✅ Mục: My Orders */}
          <li>
            <button
              onClick={() => onChangeSection('orders')}
              className={clsx('flex items-center space-x-3 block text-left w-full', getActiveClass('orders'))}
            >
              <FaBoxOpen className="w-6 h-6 text-[#28A745]" />
              <span className="text-xl font-bold">Đơn Hàng</span> 
            </button>
          </li>

          {/* ✅ Mục: My Vouchers */}
          <li>
            <button
              onClick={() => onChangeSection('vouchers')}
              className={clsx('flex items-center space-x-3 block text-left w-full', getActiveClass('vouchers'))}
            >
              <FaTicketAlt className="w-6 h-6 text-[#007BFF]" />
              <span className="text-xl font-bold">Mã Giảm Giá</span> 
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
