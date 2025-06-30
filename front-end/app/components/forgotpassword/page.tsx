'use client';

import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

export default function ResetPasswordForm() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrPhone(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailOrPhone.trim()) {
      return setError('Vui lòng nhập email hoặc số điện thoại.');
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/forgot-password`, {
        emailOrPhone,
      });

      setSuccess('Liên kết đặt lại mật khẩu đã được gửi đến email hoặc số điện thoại của bạn!');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black">
      <h2 className="text-[1.5rem] font-semibold mb-1">Đặt lại mật khẩu</h2>
      <p className="text-sm text-gray-700 mb-6">
        Nhập email hoặc số điện thoại, chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
      </p>

      {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-wrap">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="emailOrPhone"
          placeholder="Email hoặc số điện thoại"
          value={emailOrPhone}
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />

        <button
          type="submit"
          className="w-full h-[48px] bg-[#db4444] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </button>
      </form>
    </div>
  );
}
