"use client";

import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passError, setPassError] = useState("");
  const [message, setMessage] = useState("");

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidOtp = (otp: string) =>
    /^\d{6}$/.test(otp);

  const isValidPassword = (password: string) =>
    password.length >= 6;

  const handleSendOtp = async () => {
    setOtpError("");
    setPassError("");
    setMessage("");
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Email không hợp lệ.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, { email });
      setMessage("Đã gửi mã OTP đến email của bạn.");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setPassError("");
    if (!isValidOtp(otpCode)) {
      setOtpError("Mã OTP phải gồm đúng 6 chữ số.");
      return false;
    }
    try {
      await axios.post(`${API_BASE_URL}/verify-otp`, { email, otp: otpCode });
      setOtpError("");
      return true;
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "OTP không hợp lệ.");
      return false;
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setOtpError("");
    setMessage("");

    if (!(await handleVerifyOtp())) return;

    if (!isValidPassword(newPassword)) {
      setPassError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/forgot-password/reset`, {
        email,
        otp: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPassError("");
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setPassError(err.response?.data?.message || "Không thể đặt lại mật khẩu.");
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Quên mật khẩu</h2>
      <p className="text-sm text-gray-700 mb-6">
        Nhập email để nhận mã OTP đặt lại mật khẩu
      </p>

      {message && !error && (
        <p className="mb-4 text-sm text-green-600">{message}</p>
      )}
      {error && (
        <p className="mb-4 text-sm text-brand">{error}</p>
      )}

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setMessage("");
            }}
            className="flex-1 border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
          />
          <button
            onClick={handleSendOtp}
            className="bg-brand hover:opacity-75 text-white px-3 rounded text-sm font-medium"
          >
            Gửi mã
          </button>
        </div>

        <input
          type="text"
          placeholder="Nhập mã OTP gồm 6 số"
          value={otpCode}
          onChange={(e) => {
            setOtpCode(e.target.value);
            setOtpError("");
          }}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        {otpError && <p className="text-sm text-brand">{otpError}</p>}

        <input
          type="password"
          placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPassError("");
          }}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />

        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPassError("");
          }}
          className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
        />
        {passError && <p className="text-sm text-brand">{passError}</p>}

        <button
          onClick={handleResetPassword}
          className="w-full bg-brand hover:opacity-75 text-white py-2 rounded text-sm font-medium"
        >
          Đặt lại mật khẩu
        </button>

        <div className="flex justify-between mt-4 text-sm">
          <a href="/login" className="text-brand hover:underline">Đăng nhập</a>
          <a href="/signup" className="text-brand hover:underline">Đăng ký</a>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 flex flex-col items-center animate-popup-in">
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
            <p className="text-green-700 text-base font-semibold">
              Đặt lại mật khẩu thành công!
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popup-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popup-in { animation: popup-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
