'use client';
import { Medal, Crown, Gem } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  User,
  Package,
  Bell,
  Tag,
  Edit3,
  ChevronDown,
  ChevronRight,
  Settings,
  Lock,
  MapPin,
  Heart,
  Eye,
} from 'lucide-react';
import { STATIC_BASE_URL, API_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';
import axios from 'axios';
import Image from 'next/image';
import { useUser } from "../../context/UserContext";

interface UserProps {
  name: string;
  username: string;
  profilePicture?: string;
  avatar?: string;
  status: string;
  rank: string;
}

interface AccountSidebarProps {
  currentSection: string;
  onChangeSection: (section: string) => void;
  user: UserProps | null;
}

const getRankBg = (rank: string) => {
  switch (rank) {
    case 'bronze': return 'bg-[#CD7F32] text-[#FFFFFF]';
    case 'silver': return 'bg-[#8BA0B7] text-[#FFFFFF]';
    case 'gold': return 'bg-[#C9A602] text-[#FFFFFF]';
    case 'diamond': return 'bg-[#ebf9ff] text-[#4283FF]';
    default: return 'bg-[#DDE9FF] text-[#517191]';
  }
}

const getRankIcon = (rank: string) => {
  switch (rank) {
    case 'bronze': return <Medal className="w-3 h-3" />;
    case 'silver': return <Medal className="w-3 h-3" />;
    case 'gold': return <Crown className="w-3 h-3" />;
    case 'diamond': return <Gem className="w-3 h-3" />;
    default: return <User className="w-3 h-3" />;
  }
};
export default function AccountSidebar({
  currentSection,
  onChangeSection,
}: AccountSidebarProps) {
  const { user, setUser } = useUser();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [popup, setPopup] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (currentSection === 'profile') {
      setIsAccountOpen(true);
    }
  }, [currentSection]);

  const getActiveClass = (section: string) =>
    currentSection === section ? 'text-brand bg-[#DB4444]/5' : 'text-gray-600 hover:text-brand hover:bg-gray-50';

  const handleAccountClick = () => {
    setIsAccountOpen(!isAccountOpen);
  };

  const avatarUrl =
    user?.avatar
      ? `${STATIC_BASE_URL}/${user.avatar}`
      : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`

  // ✅ Hàm upload ảnh
  const handleUploadAvatar = async (file: File) => {
    const token = Cookies.get('authToken');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await axios.post(`${API_BASE_URL}/user/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch updated user info and update context
      const res = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);

      setPopup({
        message: 'Thay đổi ảnh đại diện thành công!',
        visible: true,
        type: 'success',
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading avatar:', error); // Log the error for debugging
      setPopup({
        message: 'Thay đổi ảnh đại diện thất bại!',
        visible: true,
        type: 'error',
      });
    }
  };

  // ✅ Hàm kiểm tra và xử lý thay ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setPopup({
        message: 'Ảnh vượt quá 1MB!',
        visible: true,
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(file);
      handleUploadAvatar(file); // Gọi hàm upload ảnh ngay sau khi chọn ảnh
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-[253px] ">


      {/* 🔹 Thông tin người dùng + ảnh đại diện */}
      {user && (
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            {/* Ảnh đại diện */}
            <div className="relative group">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).onerror = null;
                    e.currentTarget.src = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
                  }}
                />
              </div>

              {/* Nút chọn ảnh */}
              <label
                htmlFor="avatarUpload"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#DB4444] rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                title="Chọn ảnh đại diện"
              >
                <Edit3 className="w-3 h-3 text-white" />
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Tên người dùng + Rank + Trạng thái */}
            <div className="flex-1 space-y-1">
              {/* Tên */}
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>

              {/* Rank badge */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRankBg(user.rank)}`}>
                {getRankIcon(user.rank)}
                <span className="capitalize text white">{user.rank}</span>
              </div>


              {/* Trạng thái */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <div
                  className={`w-3 h-3 rounded-full ${user.status === 'activated' ? 'bg-green-500' :
                    user.status === 'deactivated' ? 'bg-yellow-500' :
                      user.status === 'locked' ? 'bg-red-500' :
                        user.status === 'hidden' ? 'bg-gray-500' : 'bg-blue-500'
                    }`}
                  title={
                    user.status === 'activated' ? 'Đang hoạt động' :
                      user.status === 'deactivated' ? 'Đã hủy kích hoạt' :
                        user.status === 'locked' ? 'Đã khóa' :
                          user.status === 'hidden' ? 'Ẩn' : 'Trạng thái khác'
                  }
                ></div>
                <span>
                  {user.status === 'activated' ? 'Đang hoạt động' :
                    user.status === 'deactivated' ? 'Đã hủy kích hoạt' :
                      user.status === 'locked' ? 'Đã khóa' :
                        user.status === 'hidden' ? 'Ẩn' : 'Trạng thái khác'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 🔹 Menu chính */}
      <nav className="space-y-2">
        {/* ▶️ Tài khoản của tôi - có submenu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={handleAccountClick}
            className={clsx(
              'w-full flex items-center justify-between p-4 transition-colors',
              isAccountOpen ? 'bg-[#DB4444]/5 text-brand' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                isAccountOpen ? 'bg-[#DB4444] text-white' : 'bg-gray-100 text-gray-600'
              )}>
                <User className="w-5 h-5" />
              </div>
              <span className="font-medium">Tài khoản của tôi</span>
            </div>
            {isAccountOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* 🔽 Submenu when opened */}
          {isAccountOpen && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => onChangeSection('profileView')}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    getActiveClass('profileView')
                  )}
                >
                  <Eye className="w-4 h-4" />
                  <span>Hồ Sơ Của Tôi</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSection('profile')}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    getActiveClass('profile')
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span>Quản Lý Hồ Sơ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSection('changepassword')}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    getActiveClass('changepassword')
                  )}
                >
                  <Lock className="w-4 h-4" />
                  <span>Đổi Mật Khẩu</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSection('address')}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    getActiveClass('address')
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Địa Chỉ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSection('followedshops')}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    getActiveClass('followedshops')
                  )}
                >
                  <Heart className="w-4 h-4" />
                  <span>Shop Đã Theo Dõi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ▶️ Đơn hàng */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => onChangeSection('orders')}
            className={clsx(
              'w-full flex items-center gap-3 p-4 text-left transition-colors',
              getActiveClass('orders')
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              currentSection === 'orders' ? 'bg-[#DB4444] text-white' : 'bg-gray-100 text-gray-600'
            )}>
              <Package className="w-5 h-5" />
            </div>
            <span className="font-medium">Đơn hàng</span>
          </button>
        </div>

        {/* ▶️ Thông báo */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => onChangeSection('NotificationDropdown')}
            className={clsx(
              'w-full flex items-center gap-3 p-4 text-left transition-colors',
              getActiveClass('NotificationDropdown')
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              currentSection === 'NotificationDropdown' ? 'bg-[#DB4444] text-white' : 'bg-gray-100 text-gray-600'
            )}>
              <Bell className="w-5 h-5" />
            </div>
            <span className="font-medium">Thông Báo</span>
          </button>
        </div>

        {/* ▶️ Mã giảm giá */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => onChangeSection('vouchers')}
            className={clsx(
              'w-full flex items-center gap-3 p-4 text-left transition-colors',
              getActiveClass('vouchers')
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              currentSection === 'vouchers' ? 'bg-[#DB4444] text-white' : 'bg-gray-100 text-gray-600'
            )}>
              <Tag className="w-5 h-5" />
            </div>
            <span className="font-medium">Mã giảm giá</span>
          </button>
        </div>
      </nav>

      {/* ✅ Popup */}
      {popup.visible && (
        <div
          className={`fixed top-20 right-5 z-[9999] text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade ${popup.type === 'success'
            ? 'bg-white text-green-600 border-green-500'
            : 'bg-white text-red-600 border-red-500'
            }`}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}
