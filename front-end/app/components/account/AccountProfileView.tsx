'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { ShieldCheck,User, Mail, Phone, Award } from 'lucide-react';

interface UserInfo {
  name: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
  role:string;
  rank: string;
}

export default function AccountProfileView() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
    : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-20">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#DB4444] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-600">
          Không thể tải thông tin người dùng
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  };
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto mt-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#DB4444] to-[#E85A5A] px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <User className="w-5 h-5 text-white" />
          <h2 className="text-lg font-semibold text-white">Hồ sơ của tôi</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Avatar + Name + Rank */}
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Avatar */}
          <div className="mb-3 relative">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-[#DB4444] hidden items-center justify-center absolute top-0 left-0">
              <span className="text-white text-lg font-bold">
                {getInitials(user.name)}
              </span>
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
         

          {/* Rank */}
          <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium mt-2">
            <Award className="w-3 h-3" />
            <span className="capitalize">{user.rank}</span>
          </div>
        </div>

        {/* Information Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-[#DB4444] rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs">Vai trò</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{user.role}</p>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-[#DB4444] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs">Tên đăng nhập</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{user.username}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-[#DB4444] rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs">Email</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{user.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-[#DB4444] rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs">Số điện thoại</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{user.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
