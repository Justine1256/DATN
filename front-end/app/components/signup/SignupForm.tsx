"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/utils/api";

export default function RegisterWithOTP() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "" });

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const [resendDisabled, setResendDisabled] = useState(true);

  // Đếm ngược
  useEffect(() => {
    if (!otpModalVisible) return;

    setSeconds(300);
    setResendDisabled(true);

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpModalVisible]);

  const handleChangeOtp = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, { email: form.email });
      if (res.data.message) {
        Swal.fire("Đã gửi lại mã OTP", "", "success");
        setSeconds(300);
        setResendDisabled(true);
      }
    } catch (err) {
      Swal.fire("Lỗi gửi lại OTP", "", "error");
    }
  };

  const handleOTPSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      Swal.fire("Vui lòng nhập đủ 6 số", "", "error");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: form.email,
        otp: otpString,
      });

      Swal.fire("Đăng ký thành công!", "", "success");
      router.push("/");
    } catch (err: any) {
      Swal.fire("OTP không chính xác hoặc hết hạn", "", "error");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, { email: form.email });
      if (res.data.message) {
        setOtpModalVisible(true);
      }
    } catch (err: any) {
      Swal.fire("Lỗi đăng ký", err.response?.data?.message || "", "error");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-md mt-10">
      <h2 className="text-xl font-semibold mb-4">Đăng ký tài khoản</h2>
      <input
        type="email"
        placeholder="Nhập email"
        className="w-full p-2 border rounded mb-4"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <button
        onClick={handleRegister}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Gửi mã OTP
      </button>

      {/* OTP Modal */}
      {otpModalVisible && (
        <div className="mt-6 bg-gray-50 p-4 rounded border">
          <p className="mb-2">Nhập mã OTP đã gửi tới email của bạn:</p>
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                value={digit}
                onChange={(e) => handleChangeOtp(i, e.target.value)}
                maxLength={1}
                className="w-10 h-10 text-center border rounded"
              />
            ))}
          </div>

          <div className="text-sm text-gray-600 mb-2">
            Mã sẽ hết hạn sau {Math.floor(seconds / 60)}:
            {(seconds % 60).toString().padStart(2, "0")}
          </div>

          <button
            onClick={handleOTPSubmit}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition mb-2"
          >
            Xác nhận OTP
          </button>

          <button
            onClick={handleResendOTP}
            className="text-blue-600 text-sm underline disabled:text-gray-400"
            disabled={resendDisabled}
          >
            Gửi lại mã OTP
          </button>
        </div>
      )}
    </div>
  );
}
