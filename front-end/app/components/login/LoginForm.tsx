'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  const { email, password } = formData;

  if (!email.trim()) return setError('Vui lòng nhập email.');
  if (!isValidEmail(email.trim())) return setError('Email không đúng định dạng.');
  if (!password.trim()) return setError('Vui lòng nhập mật khẩu.');
  if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');

  setIsLoading(true);

  try {
    const res = await axios.post(`${API_BASE_URL}/login`, formData);
    const { token } = res.data;

    const domain = window.location.hostname === 'localhost' 
  ? undefined // Không set domain ở local
  : '.marketo.info.vn';

Cookies.set('authToken', token, {
  domain, // undefined nếu local -> cookie sẽ thuộc localhost
  path: '/',
  secure: window.location.protocol === 'https:',
  sameSite: 'None',
  expires: 7,
});


    setShowPopup(true);
const redirectTo = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://marketo.info.vn';

window.location.href = redirectTo;
  } catch (err: any) {
    const msg =
      err?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
    setError(msg);
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
    }
  }, []);

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Đăng nhập vào MAKETO</h2>
      <p className="text-sm text-gray-700 mb-6">Nhập thông tin của bạn bên dưới</p>

      {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />

        <button
          type="submit"
          className="bg-brand text-white w-full h-[48px] text-sm rounded hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {/* 2 link tách ra 2 bên */}
        <div className="flex justify-between mt-4 text-sm">
          <a href="/signup" className="text-brand hover:underline hover:opacity-80">
            Đăng ký
          </a>
          <a href="/forgotpassword" className="text-brand hover:underline hover:opacity-80">
            Quên mật khẩu?
          </a>
        </div>
      </form>

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
