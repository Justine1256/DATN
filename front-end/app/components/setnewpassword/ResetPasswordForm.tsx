'use client';

import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      return setError('Vui lòng nhập đầy đủ mật khẩu.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/reset-password`, {
        newPassword,
      });

      setSuccess('Mật khẩu của bạn đã được đặt lại thành công!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black">
      <h2 className="text-[1.5rem] font-semibold mb-1">Đặt mật khẩu mới</h2>
      <p className="text-sm text-gray-700 mb-6">
        Chọn một mật khẩu mạnh mà bạn chưa từng sử dụng trước đây.
      </p>

      {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-wrap">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border-b p-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />

        <input
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border-b p-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />

        <button
          type="submit"
          className="w-full h-[48px] bg-[#db4444] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  );
}
