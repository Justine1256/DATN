'use client';

import { useState , useEffect} from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // ✅ Popup hiệu ứng

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const res = await axios.post('http://localhost:8000/api/login', formData);
      const { token } = res.data;
  
      Cookies.set('authToken', token, { expires: 7 });
  
      // ✅ Hiện popup
      setShowPopup(true);
  
      // ✅ Mở tab mới mà không nhảy focus (dashboard)
      window.open(`http://localhost:3001/dashboard?token=${token}`, '_blank', 'noopener,noreferrer');
  
      // ✅ Giữ tab hiện tại và chuyển về web chính
      window.location.href = 'http://localhost:3000';
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
  const token = Cookies.get('authToken');
  if (token) {
    axios.get('http://localhost:8000/api/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
    .then(res => {
      console.log('User data:', res.data);
    })
    .catch(err => {
      console.error('Token không hợp lệ hoặc hết hạn:', err);
    });
  }
}, []);

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-2xl font-semibold mb-1">Log in to MAKETO</h2>
      <p className="text-black mb-6">Enter your details below</p>

      {error && <p className="text-red-600 mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-10">
        <input
          type="text"
          name="email"
          placeholder="Email or Phone Number"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
          disabled={isLoading}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
          disabled={isLoading}
          required
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

      {/* ✅ Popup đẹp và có hiệu ứng */}
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
          <span className="text-green-700 font-medium">Đăng nhập thành công!</span>
        </div>
      )}

      {/* ✅ CSS animation (bạn có thể đưa vào global.css nếu muốn tái sử dụng) */}
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
