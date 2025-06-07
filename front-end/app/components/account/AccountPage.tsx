'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// ✅ Interface định nghĩa kiểu dữ liệu người dùng
interface UserData {
  name: string;
  phone: string;
  email: string;
  role: string;
  currentPassword?: string;
  passwordError?: string;
}

export default function AccountPage({ onProfileUpdated }: { onProfileUpdated?: (user: UserData) => void }) {
  // ✅ Khởi tạo state lưu trữ dữ liệu người dùng
  const [userData, setUserData] = useState<UserData>({
    name: '',
    phone: '',
    email: '',
    role: '',
    currentPassword: '',
    passwordError: '',
  });

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Ẩn popup sau 2 giây
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // ✅ Hàm hiển thị popup
  const showPopupMessage = useCallback((msg: string, type: 'success' | 'error') => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  // ✅ Gọi API lấy thông tin người dùng hiện tại
  const fetchUser = useCallback(async () => {
    const token = Cookies.get('authToken');
    if (!token) return setLoading(false);

    try {
      const res = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setUserData({
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        currentPassword: '',
        passwordError: '',
      });
    } catch {
      showPopupMessage('Failed to load user information.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showPopupMessage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ✅ Cập nhật giá trị input khi người dùng nhập
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value, passwordError: '' }));
  };

  // ✅ Tách riêng logic kiểm tra hợp lệ đầu vào
  const validateForm = () => {
    const { name, phone, email, currentPassword } = userData;

    if (!name || !phone || !email || !currentPassword) {
      showPopupMessage('Please fill in all required fields.', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopupMessage('Invalid email format.', 'error');
      return false;
    }

    const phoneRegex = /^\d{9,12}$/;
    if (!phoneRegex.test(phone)) {
      showPopupMessage('Invalid phone number.', 'error');
      return false;
    }

    return true;
  };

  // ✅ Submit cập nhật thông tin người dùng
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = Cookies.get('authToken');
    if (!token) return showPopupMessage('Not authenticated.', 'error');

    try {
      const res = await axios.put(
        'http://localhost:8000/api/user',
        {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          current_password: userData.currentPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = res.data.user;
      setUserData({
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        currentPassword: '',
        passwordError: '',
      });

      onProfileUpdated?.(updatedUser);
      showPopupMessage('Profile updated successfully!', 'success');
      fetchUser();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || '';
      if (msg.toLowerCase().includes('password')) {
        setUserData((prev) => ({ ...prev, passwordError: 'Incorrect current password!' }));
        return showPopupMessage('Incorrect current password!', 'error');
      }
      return showPopupMessage('Update failed!', 'error');
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-[600px] mx-auto px-4 pt-10 text-black">
          <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-semibold text-[#DB4444] mb-4">Edit Your Profile</h2>

            {/* ✅ Nhập tên và số điện thoại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
                />
              </div>
            </div>

            {/* ✅ Nhập email và role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input
                  type="text"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Role</label>
                <input
                  type="text"
                  name="role"
                  value={userData.role}
                  disabled
                  className="w-full bg-gray-100 p-3 rounded-md text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* ✅ Xác nhận mật khẩu hiện tại */}
            <div>
              <label className="text-sm font-medium block mb-2">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={userData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={`w-full bg-gray-100 p-3 rounded-md focus:outline-none ${
                  userData.passwordError ? 'border border-red-500' : ''
                }`}
              />
              {userData.passwordError && (
                <p className="text-sm text-red-500 mt-1">{userData.passwordError}</p>
              )}
            </div>

            {/* ✅ Buttons hành động */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="reset"
                onClick={() =>
                  setUserData((prev) => ({
                    ...prev,
                    name: '',
                    phone: '',
                    email: '',
                    currentPassword: '',
                    passwordError: '',
                  }))
                }
                className="text-sm text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* ✅ Popup hiển thị kết quả */}
          {showPopup && (
            <div
              className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${
                popupType === 'success'
                  ? 'bg-white text-black border-green-500'
                  : 'bg-white text-red-600 border-red-500'
              }`}
            >
              {popupMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
