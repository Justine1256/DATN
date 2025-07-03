'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { ShieldCheck, User, Mail, Phone, Award } from 'lucide-react';

interface UserInfo {
  name: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  rank: string;
}

export default function AccountProfileView() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false); // 👈 dùng state để xử lý avatar fallback

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const avatarUrl = user?.avatar
    ? `${STATIC_BASE_URL}/${user.avatar}`
    : '';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 mt-20">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#DB4444] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="text-center text-gray-600">
          Không thể tải thông tin người dùng
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-lg mx-auto mt-10">
      {/* Header */}
      <div className="bg-[#DB4444] px-6 py-6">
        <div className="text-center">
          <h2 className="text-red-50 text-xl">Hồ sơ của tôi</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Loyalty Points Card */}
        <div className="bg-gradient-to-br from-[#fdf6ec] via-[#fef9f4] to-[#fffaf0] 
    border border-[#e7d4b8] rounded-xl p-5 
    shadow-[0_4px_20px_rgba(230,206,172,0.2)]">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Thẻ thành viên</h3>
            <div className={`inline-flex items-center gap-1 
        ${user.rank === 'member' ? 'bg-blue-100 text-blue-600' :
                user.rank === 'seller' ? 'bg-orange-100 text-orange-600' :
                  user.rank === 'admin' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'}
        px-3 py-1 rounded-full text-xs font-medium`}>
              <User className="w-3 h-3" />
              <span className="capitalize">{user.rank}</span>
            </div>
          </div>

          <div className="flex divide-x divide-[#e7d4b8]/50 text-center">
            <div className="flex-1 px-4">
              <p className="text-xs text-gray-500 mb-1">Đơn hàng</p>
              <p className="text-lg font-bold text-[#d4a94e]">
                0<span className="text-sm text-gray-500">/75</span>
              </p>
              <div className="mt-2 w-full bg-[#f2e8d6] rounded-full h-2">
                <div className="bg-[#d4a94e] h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
            <div className="flex-1 px-4">
              <p className="text-xs text-gray-500 mb-1">Chi tiêu</p>
              <p className="text-lg font-bold text-[#d4a94e]">
                đ0<span className="text-sm text-gray-500">/15tr</span>
              </p>
              <div className="mt-2 w-full bg-[#f2e8d6] rounded-full h-2">
                <div className="bg-[#d4a94e] h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            Thứ hạng sẽ được cập nhật lại sau 31.12.2025.
          </div>
        </div>


        {/* User Details in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-[#DB4444]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Tên đăng nhập</p>
              <p className="font-medium text-gray-800">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-[#DB4444]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-[#DB4444]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Số điện thoại</p>
              <p className="font-medium text-gray-800">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-[#DB4444]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Vai trò</p>
              <p className="font-medium text-gray-800 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
}