'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Typography, notification } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      // ✅ Lưu cookie dùng cho mọi subdomain
      Cookies.set('authToken', token, {
        domain: '.marketo.info.vn',
        path: '/',
        secure: true,
        sameSite: 'None',
        expires: 7,
      });

      setShowPopup(true);
      const redirectTo = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://marketo.info.vn';
      window.location.href = redirectTo;

    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);

      notification.error({
        message: 'Lỗi đăng nhập',
        description: msg,
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   const { email, password } = formData;

  //   if (!email.trim()) return setError('Vui lòng nhập email.');
  //   if (!isValidEmail(email.trim())) return setError('Email không đúng định dạng.');
  //   if (!password.trim()) return setError('Vui lòng nhập mật khẩu.');
  //   if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');

  //   setIsLoading(true);

  //   try {
  //     const res = await axios.post(`${API_BASE_URL}/login`, formData);
  //     const { token } = res.data;

  //     Cookies.set('authToken', token, { expires: 7 });
  //     setShowPopup(true);
  //     window.location.href = 'http://localhost:3000';
  //   } catch (err: any) {
  //     const msg =
  //       err?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
  //     setError(msg);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    }
  }, []);

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Đăng nhập vào MAKETO</h2>
      <p className="text-sm text-gray-700 mb-6">Nhập thông tin của bạn bên dưới</p>

      {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2 w-full focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Mật khẩu"
            onChange={handleChange}
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2 w-full focus:outline-none text-sm text-black placeholder-gray-400 pr-10"
            disabled={isLoading}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-black"
          >
            {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
          </span>
        </div>


        <button
          type="submit"
          className="w-full h-10 bg-[#db4444] hover:bg-[#c03d3d] border-[#db4444] text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="flex justify-between text-sm mt-3">
          <a href="/signup" className="text-[#db4444] hover:underline hover:opacity-80">Đăng ký</a>
          <a href="/forgotpassword" className="text-[#db4444] hover:underline hover:opacity-80">Quên mật khẩu?</a>
        </div>
      </form>

      {showPopup && (
        <div className="fixed top-5 right-5 animate-slide-in z-50 bg-white border-l-4 border-green-500 shadow-lg rounded px-4 py-3 flex items-center gap-3">
          <CheckCircleOutlined className="text-green-600 text-xl" />
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
