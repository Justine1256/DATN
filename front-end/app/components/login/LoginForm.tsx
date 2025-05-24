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
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email: formData.email,
        password: formData.password,
      });

      const { token } = response.data;

      Cookies.set('authToken', token, { expires: 7 });

      setMessage('Đăng nhập thành công!');
      // router.push('/');

    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 text-black">
      <h2 className="text-2xl font-semibold mb-1">Log in to Exclusive</h2>
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
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
        />

        <div className="flex items-center justify-between h-[56px] mt-4">
          <button
            type="submit"
            className="bg-[#DB4444] text-white w-[143px] h-full rounded hover:opacity-75"
          >
            Log In
          </button>
          <a
            href="/forgot-password"
            className="!text-[#DB4444] text-sm self-center !no-underline hover:opacity-75"
          >
            Forget Password?
          </a>
        </div>
      </form>
    </div>
  );
}
