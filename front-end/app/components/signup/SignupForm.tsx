'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import Image from 'next/image';

export default function SignupForm() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (showOtpModal && otpRef.current) otpRef.current.focus();
  }, [showOtpModal]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) =>
    /^(03|05|07|08|09)[0-9]{8}$/.test(phone);
  

  const isValidPassword = (password: string) =>
    password.length >= 6;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, password } = formData;

    if (!name || !email || !phone || !password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Số điện thoại không hợp lệ (9–11 chữ số).');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        name,
        username: email.split('@')[0],
        email,
        phone,
        password,
      });

      setMessage(res.data.message || 'Gửi mã OTP thành công.');
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại.');
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: formData.email,
        otp: otpCode,
      });

      setShowOtpModal(false);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push('/login');
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ.');
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Create an account</h2>
      <p className="text-sm text-gray-700 mb-6">Enter your details below</p>

      {(message || error) && (
        <p className={`mb-4 text-sm ${error ? 'text-brand' : 'text-green-600'}`}>
          {error || message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        <input
          type="text"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="w-full bg-brand hover:opacity-75 text-white py-2 rounded text-sm font-medium"
        >
          Create Account
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t" />
        <span className="mx-2 text-black text-sm">or</span>
        <div className="flex-grow border-t" />
      </div>

      <button
        className="w-full mb-2 border flex items-center justify-center py-2 rounded text-black hover:bg-gray-100 text-sm"
        onClick={() => alert('Google signup coming soon!')}
      >
        <img src="/google-logo.png" alt="Google" className="w-5 h-5 mr-2" />
        Sign up with Google
      </button>

      <p className="text-center mt-6 text-sm">
        Already have an account?{' '}
        <a href="/login" className="underline hover:text-blue-600">
          Log in
        </a>
      </p>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Nhập mã OTP</h3>
              <button
                onClick={() => {
                  setOtpCode('');
                  setShowOtpModal(false);
                }}
                className="text-2xl font-bold text-gray-600 hover:text-brand"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <input
              ref={otpRef}
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full border p-2 mb-4 text-sm"
              placeholder="OTP"
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-brand text-white py-2 rounded hover:opacity-75 text-sm font-medium"
            >
              Xác minh
            </button>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 text-base font-semibold">Đăng ký thành công!</p>
          </div>
        </div>
      )}
    </div>
  );
}
