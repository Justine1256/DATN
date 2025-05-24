'use client';

import { useState } from "react";
import axios from "axios";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/register', {
        name: formData.name,
        username: formData.email.split('@')[0],
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setMessage(response.data.message);
      setShowOtpModal(true);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(JSON.stringify(err.response.data.errors));
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/verify-otp', {
        email: formData.email,
        otp: otpCode,
      });
      setMessage(response.data.message);
      setShowOtpModal(false);
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác minh OTP thất bại.');
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-1">Create an account</h2>
      <p className="text-black mb-6">Enter your details below</p>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-10">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-black placeholder-gray-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full border-b p-2 mt-2 focus:outline-none text-black placeholder-gray-400"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
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
        <button
          type="submit"
          className="w-full bg-[#DB4444] mt-3 hover:opacity-75 text-white py-2 rounded"
        >
          Create Account
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-grow border-t" />
        <span className="mx-2 text-black">or</span>
        <div className="flex-grow border-t" />
      </div>

      <button className="w-full mb-2 border flex items-center justify-center py-2 rounded text-black hover:bg-gray-100">
        <img src="/google-logo.png" alt="Google" className="w-8 h-8 mr-2" />
        Sign up with Google
      </button>

      <p className="text-center mt-6 text-sm text-black">
        Already have an account?{' '}
        <a href="/login" className="underline hover:text-blue-600">
          Log in
        </a>
      </p>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Nhập mã OTP</h3>
            <input
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
    </div>
  );
}