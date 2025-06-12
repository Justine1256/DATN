'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function LoginForm() {
  // ✅ State quản lý form và trạng thái
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // Hiện popup sau khi login

  // ✅ Cập nhật dữ liệu khi người dùng nhập
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Gửi form login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/login', formData);
      const { token } = res.data;

      // ✅ Lưu token vào cookie
      Cookies.set('authToken', token, { expires: 7 });

      // ✅ Hiện popup đăng nhập thành công
      setShowPopup(true);

      // ✅ Trang hiện tại chuyển về homepage
      window.location.href = 'http://localhost:3000';
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Kiểm tra token có sẵn trong cookie khi component mount
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios
        .get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((res) => console.log('User data:', res.data))
        .catch((err) => console.error('Token không hợp lệ hoặc hết hạn:', err));
    }
  }, []);

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      {/* ✅ Tiêu đề và hướng dẫn */}
      <h2 className="text-[1.5rem] font-semibold mb-1">Log in to MAKETO</h2>
      <p className="text-sm text-gray-700 mb-6">Enter your details below</p>

      {/* ✅ Hiển thị lỗi nếu có */}
      {error && <p className="text-brand text-sm mb-4 whitespace-pre-wrap">{error}</p>}

      {/* ✅ Form login */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="text"
          name="email"
          placeholder="Email or Phone Number"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
          required
        />

        {/* ✅ Nút login và link forgot password */}
        <div className="flex items-center justify-between h-[56px] mt-4">
          <button
            type="submit"
            className="bg-brand text-white w-[120px] h-full text-sm rounded hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Log In'}
          </button>
          <a
            href="/signup"
            className="text-brand text-sm hover:underline hover:opacity-80"
          >
            Forget Password?
          </a>
        </div>
      </form>

      {/* ✅ Popup đăng nhập thành công */}
      {showPopup && (
        <div className="fixed top-5 right-5 animate-slide-in z-50 bg-white border-l-4 border-green-500 shadow-lg rounded px-4 py-3 flex items-center gap-3">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 font-medium text-sm">Đăng nhập thành công!</span>
        </div>
      )}

      {/* ✅ CSS animation cho popup */}
      <style jsx>{`
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
