"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState<"send" | "verify" | "reset">("send");

  const [error, setError] = useState("");         // lỗi dưới màn chính
  const [modalError, setModalError] = useState(""); // lỗi trên popup
  const [message, setMessage] = useState("");

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (step === "verify" && otpRef.current) otpRef.current.focus();
    if (step === "reset" && newPassRef.current) newPassRef.current.focus();
  }, [step]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidOtp = (otp: string) =>
    /^\d{6}$/.test(otp);

  const isValidPassword = (password: string) =>
    password.length >= 6;

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Email không hợp lệ. Phải chứa '@' và tên miền.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, { email });
      setMessage("Đã gửi mã OTP đến email của bạn.");
      setError("");
      setModalError("");
      setStep("verify");
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!isValidOtp(otpCode)) {
      setModalError("Mã OTP phải gồm đúng 6 chữ số.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/verify-otp`, { email, otp: otpCode });
      setModalError("");
      setStep("reset");
    } catch (err: any) {
      setModalError(err.response?.data?.message || "OTP không hợp lệ.");
    }
  };

  const handleResetPassword = async () => {
    if (!isValidPassword(newPassword)) {
      setModalError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError("Mật khẩu xác nhận không khớp.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/forgot-password/reset`, {
        email,
        otp: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setModalError("");
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Không thể đặt lại mật khẩu.");
    }
  };

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Quên mật khẩu</h2>
      <p className="text-sm text-gray-700 mb-6">
        Nhập email để nhận mã OTP đặt lại mật khẩu
      </p>

      {(message || error) && step === "send" && (
        <p
          className={`mb-4 text-sm ${error ? "text-brand" : "text-green-600"}`}
        >
          {error || message}
        </p>
      )}

      <div className="space-y-6">
        {step === "send" && (
          <>
            <input
              type="text"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setMessage("");
              }}
              className="w-full border-b p-2 placeholder-gray-400 focus:outline-none text-sm"
            />
            <button
              onClick={handleSendOtp}
              className="w-full bg-brand hover:opacity-75 text-white py-2 rounded text-sm font-medium"
            >
              Gửi mã OTP
            </button>

            {/* Hai link bên dưới */}
            <div className="flex justify-between mt-4 text-sm">
              <a href="/login" className="text-brand hover:underline">Đăng nhập</a>
              <a href="/signup" className="text-brand hover:underline">Đăng ký</a>
            </div>
          </>
        )}
      </div>


      {/* Modal nhập OTP */}
      {step === "verify" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative animate-popup-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Xác thực OTP</h3>
              <button
                onClick={() => {
                  setOtpCode("");
                  setModalError("");
                  setStep("send");
                }}
                className="text-2xl font-bold text-gray-600 hover:text-brand"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {modalError && (
              <p className="text-sm text-brand mb-2">{modalError}</p>
            )}
            <input
              ref={otpRef}
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full border p-2 mb-4 text-sm"
              placeholder="Nhập mã OTP gồm 6 số"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-brand text-white py-2 rounded hover:opacity-75 text-sm font-medium"
            >
              Xác minh OTP
            </button>
          </div>
        </div>
      )}

      {/* Modal nhập mật khẩu mới */}
      {step === "reset" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative animate-popup-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Đặt lại mật khẩu</h3>
              <button
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setModalError("");
                  setStep("send");
                }}
                className="text-2xl font-bold text-gray-600 hover:text-brand"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {modalError && (
              <p className="text-sm text-brand mb-2">{modalError}</p>
            )}
            <input
              ref={newPassRef}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 mb-3 text-sm"
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border p-2 mb-4 text-sm"
              placeholder="Xác nhận mật khẩu mới"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-brand text-white py-2 rounded hover:opacity-75 text-sm font-medium"
            >
              Đặt lại mật khẩu
            </button>
          </div>
        </div>
      )}

      {/* Popup thành công */}
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
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-popup-in {
          animation: popup-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
