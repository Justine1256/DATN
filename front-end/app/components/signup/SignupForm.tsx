'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
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

    try {
      const res = await axios.post('http://localhost:8000/api/register', {
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
      await axios.post('http://localhost:8000/api/verify-otp', {
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
      <h2 className="text-2xl font-semibold mb-1">Create an account</h2>
      <p className="mb-6">Enter your details below</p>

      {(message || error) && (
        <p className={`mb-4 text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
          {error || message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none"
        />
       <input
  type="email"
  name="email"
  placeholder="Email"
  value={formData.email}
  onChange={handleChange}
  onBlur={(e) => {
    const email = e.target.value;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setError("Email không hợp lệ.");
    } else {
      setError(""); // ✅ Xóa lỗi nếu đúng
    }
  }}
  className="w-full border-b p-2 placeholder-gray-400 focus:outline-none"
/>

        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full bg-[#DB4444] hover:opacity-75 text-white py-2 rounded"
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
        className="w-full mb-2 border flex items-center justify-center py-2 rounded text-black hover:bg-gray-100"
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
              <h3 className="text-lg font-bold">Nhập mã OTP</h3>
              <button
                onClick={() => {
                  setOtpCode('');
                  setShowOtpModal(false);
                }}
                className="text-2xl font-bold text-gray-600 hover:text-red-500"
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
              className="w-full border p-2 mb-4"
              placeholder="OTP"
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-[#DB4444] text-white py-2 rounded hover:opacity-75"
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
            <p className="text-green-700 text-lg font-semibold">Đăng ký thành công!</p>
          </div>
        </div>
      )}
    </div>
  );
}
