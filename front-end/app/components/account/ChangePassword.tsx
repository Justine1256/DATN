'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function ChangePassword() {
  // ✅ State quản lý input form
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // ✅ State quản lý thông báo popup
  const [popup, setPopup] = useState({ message: '', type: 'success' });
  const [showPopup, setShowPopup] = useState(false);

  // ✅ Tự động ẩn popup sau 2s
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // ✅ Hàm xử lý thay đổi giá trị input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Hàm hiển thị popup thông báo
  const showAlert = (msg: string, type: 'success' | 'error') => {
    setPopup({ message: msg, type });
    setShowPopup(true);
  };

  // ✅ Hàm xử lý submit form đổi mật khẩu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = formData;

    // ⚠️ Kiểm tra rỗng
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return showAlert('Please fill in all fields.', 'error');
    }

    // ⚠️ Kiểm tra xác nhận mật khẩu mới
    if (newPassword !== confirmNewPassword) {
      return showAlert('New passwords do not match.', 'error');
    }

    try {
      const token = Cookies.get('authToken');
      const res = await axios.put(
        'http://localhost:8000/api/user',
        {
          current_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success || res.status === 200) {
        showAlert('Password updated successfully!', 'success');
        setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update password.';
      showAlert(msg, 'error');
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-[600px] mx-auto px-4 pt-10 text-black">
          {/* ✅ Form đổi mật khẩu */}
          <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-semibold text-[#DB4444] mb-2">Change Password</h2>

            {/* Mật khẩu hiện tại */}
            <div>
              <label className="text-sm font-medium block mb-1">Current Password</label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
              />
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="text-sm font-medium block mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
              />
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="text-sm font-medium block mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
              />
            </div>

            {/* Nút thao tác */}
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="reset"
                onClick={() => setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' })}
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
                popup.type === 'success'
                  ? 'bg-white text-black border-green-500'
                  : 'bg-white text-red-600 border-red-500'
              }`}
            >
              {popup.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
