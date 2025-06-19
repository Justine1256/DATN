'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FaUserCircle, FaBoxOpen, FaTicketAlt, FaEdit, FaBell } from 'react-icons/fa'; // Import FaBell cho thông báo
import { STATIC_BASE_URL, API_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';
import axios from 'axios';
import Image from 'next/image';
import NotificationDropdown from './NotificationDropdown'; // Import NotificationDropdown

interface UserProps {
  name: string;
  profilePicture?: string;
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    message: string;
    visible: boolean;
    type: 'confirm' | 'success';
  }>({
    message: '',
    visible: false,
    type: 'confirm',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (currentSection === 'profile') {
      setIsAccountOpen(true);
    }
  }, [currentSection]);

  const getActiveClass = (section: string) =>
    currentSection === section ? 'text-[#DB4444] font-medium' : 'text-[#6c757d]';

  const handleAccountClick = () => {
    setIsAccountOpen(!isAccountOpen);
    if (currentSection !== 'profileView') {
      onChangeSection('profileView'); // Set section to profileView when clicking on the profile section
    }
  };

  const avatarUrl =
    previewImage ||
    (user?.avatar
      ? `${STATIC_BASE_URL}/${user.avatar}`
      : user?.profilePicture || `${STATIC_BASE_URL}/avatars/default-avatar.jpg`);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('Ảnh vượt quá 1MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setPopup({
        message: 'Bạn có muốn thay ảnh đại diện không?',
        visible: true,
        type: 'confirm',
      });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    const token = Cookies.get('authToken');
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      await axios.post(`${API_BASE_URL}/user/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setPopup({
        message: 'Thay đổi ảnh đại diện thành công!',
        visible: true,
        type: 'success',
      });
      setSelectedFile(null);
    } catch (err) {
      alert('Lỗi khi tải ảnh lên!');
    }
  };

  const handlePopupConfirm = () => {
    if (popup.type === 'confirm') {
      setPopup({ ...popup, visible: false });
      handleUploadAvatar();
    } else {
      setPopup({ ...popup, visible: false });
    }
  };

  return (
    <div className="w-[290px] pr-6 pt-20">
      {/* ✅ Thông tin người dùng */}
      {user && (
        <div className="flex items-center space-x-3 mb-6">
          {/* ✅ Avatar + chỉnh sửa */}
          <div className="relative w-14 h-14 group">
            <Image
              src={avatarUrl}
              alt="Avatar"
              id="avatarPreview"
              width={56} // Đặt chiều rộng của hình ảnh
              height={56} // Đặt chiều cao của hình ảnh
              className="w-full h-full object-cover rounded-full border border-gray-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).onerror = null;
                e.currentTarget.src = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
              }}
            />

            <label
              htmlFor="avatarUpload"
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer group-hover:opacity-100 opacity-0 transition"
              title="Chọn ảnh đại diện"
            >
              <FaEdit className="text-[#DB4444] w-4 h-4" />
            </label>
            <input
              id="avatarUpload"
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ✅ Tên người dùng */}
          <div>
            <span className="text-xl font-semibold text-black block">{user.name}</span>
            <div
              className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer mt-1"
              onClick={() => onChangeSection('profileView')} // Click takes you to profileView
            >
              <FaEdit className="w-3 h-3" />
              <span>Chỉnh sửa hồ sơ</span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Danh sách menu */}
      <ul className="space-y-4 text-lg">
        <li>
          <button
            onClick={handleAccountClick}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full hover:text-[#DB4444]',
              getActiveClass('profile')
            )}
          >
            <FaUserCircle className="w-6 h-6 text-[#DB4444]" />
            <span className="text-xl font-bold">Tài khoản của tôi</span>
          </button>
          {isAccountOpen && (
            <ul className="pl-6 space-y-2 pt-2">
              <li>
                <button
                  onClick={() => onChangeSection('profileView')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('profileView')
                  )}
                >
                  Hồ Sơ Của Tôi
                </button>
              </li>

              <li>
                <button
                  onClick={() => onChangeSection('profile')}
                  className={clsx(
                    'block text-left w-full hover:text-[#DB4444]',
                    getActiveClass('profile')
                  )}
                >
                  Quản Lý Hồ Sơ
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
                  Địa Chỉ
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
                  Shop Đã Theo Dõi
                </button>
              </li>
            </ul>
          )}
        </li>

        <li>
          <button
            onClick={() => onChangeSection('orders')}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full hover:text-[#DB4444]',
              getActiveClass('orders')
            )}
          >
            <FaBoxOpen className="w-6 h-6 text-[#28A745]" />
            <span className="text-xl font-bold">Đơn hàng</span>
          </button>
        </li>

        <li>
          <button
            onClick={() => onChangeSection('NotificationDropdown')}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full hover:text-[#DB4444]',
              getActiveClass('NotificationDropdown')
            )}
          >
            <FaBell className="w-6 h-6 text-[#007BFF]" /> {/* Thêm biểu tượng chuông */}
            <span className="text-xl font-bold">Thông Báo</span>
          </button>
        </li>

        <li>
          <button
            onClick={() => onChangeSection('vouchers')}
            className={clsx(
              'flex items-center space-x-3 block text-left w-full hover:text-[#DB4444]',
              getActiveClass('vouchers')
            )}
          >
            <FaTicketAlt className="w-6 h-6 text-[#007BFF]" />
            <span className="text-xl font-bold">Mã giảm giá</span>
          </button>
        </li>
      </ul>

      {/* ✅ Popup xác nhận hoặc thông báo */}
      {popup.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white text-center p-6 rounded-xl shadow-xl w-[320px] animate-fadeIn">
            {/* Dấu tick khi thành công */}
            {popup.type === 'success' && (
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center animate-bounce">
                  ✓
                </div>
              </div>
            )}

            <p className="text-base text-black">{popup.message}</p>

            <div className="mt-4 flex justify-center gap-3">
              {popup.type === 'confirm' && (
                <>
                  <button
                    onClick={() => setPopup({ ...popup, visible: false })}
                    className="px-4 py-1.5 text-sm rounded border border-black hover:bg-gray-100 text-black"
                  >
                    Hủy
                  </button>

                  <button
                    onClick={handlePopupConfirm}
                    className="px-4 py-1.5 text-sm rounded bg-[#DB4444] text-white hover:opacity-90"
                  >
                    Xác nhận
                  </button>
                </>
              )}
              {popup.type === 'success' && (
                <button
                  onClick={handlePopupConfirm}
                  className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:opacity-90"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
