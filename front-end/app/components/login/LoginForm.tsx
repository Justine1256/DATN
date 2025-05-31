'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // ✅ Popup state

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email: formData.email,
        password: formData.password,
      });

      const { token } = response.data;
      Cookies.set('authToken', token, { expires: 7 });

      // ✅ Hiện popup và chờ chuyển trang
      setShowSuccessPopup(true);
      setTimeout(() => {
        router.push(`http://localhost:3001/dashboard?token=${token}`);
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-2xl font-semibold mb-1">Log in to MAKETO</h2>
      <p className="text-black mb-6">Enter your details below</p>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-10">
        <input
          type="text"
          name="email"
          placeholder="Email or Phone Number"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between h-[56px] mt-4">
          <button
            type="submit"
            className="bg-[#DB4444] text-white w-[120px] h-full rounded hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Log In'}
          </button>
          <a
            href="/forgot-password"
            className="!text-[#DB4444] text-sm self-center !no-underline hover:opacity-75"
          >
            Forget Password?
          </a>
        </div>
      </form>

      {/* ✅ Success popup */}
      {showSuccessPopup && (
        <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Đăng nhập thành công!</span>
        </div>
      )}
    </div>
  );
}
