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
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true); // Set loading to true when submission starts

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email: formData.email,
        password: formData.password,
      });

      const { token } = response.data;

      Cookies.set('authToken', token, { expires: 7 });

      setMessage('Đăng nhập thành công!');
      router.push('/'); // Uncommented for actual redirection

    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false); // Set loading to false when submission finishes (success or error)
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black">
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
          disabled={isLoading} // Disable input while loading
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
          disabled={isLoading} // Disable input while loading
        />

        <div className="flex items-center justify-between h-[56px] mt-4">
          <button
            type="submit"
            className="bg-[#DB4444] text-white w-[120px] h-full rounded hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Đang đăng nhập...' : 'Log In'} {/* Change button text/add spinner */}
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