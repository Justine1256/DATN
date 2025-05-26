'use client';

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // popup thành công

  const router = useRouter();

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

      // Hiện popup thành công
      setShowSuccessPopup(true);

      // 2s sau tự động chuyển về /login
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác minh OTP thất bại.');
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
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
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Nhập mã OTP</h3>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-2xl font-bold text-gray-600 hover:text-red-500 transition duration-200 relative top-[-4px]"
                aria-label="Đóng modal"
              >
                X
              </button>
            </div>

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

      {/* Popup đăng ký thành công */}
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
