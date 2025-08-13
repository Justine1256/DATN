"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { API_BASE_URL } from "@/utils/api"
import { CheckCircleOutlined } from "@ant-design/icons"
import { Typography } from "antd"
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons"

const { Title, Text } = Typography

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scope = "openid email profile"
    const responseType = "code"
    const state = `login_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Store state for verification
    sessionStorage.setItem("google_oauth_state", state)
    sessionStorage.setItem("oauth_action", "login")

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&state=${encodeURIComponent(state)}`

    window.location.href = googleAuthUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  const { email, password } = formData;

  if (!email.trim()) return setError("Vui lòng nhập email hoặc tên đăng nhập.");
  if (!password.trim()) return setError("Vui lòng nhập mật khẩu.");
  if (password.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự.");

  setIsLoading(true);

  try {
    // Gửi đúng key 'login' cho API Laravel
    const res = await axios.post(`${API_BASE_URL}/login`, {
      login: email, // Laravel sẽ tự nhận dạng là email, username hoặc phone
      password: password
    });

    const { token } = res.data;
    Cookies.set("authToken", token, { 
  expires: 7,
  domain: process.env.NODE_ENV === "production" ? ".marketo.info.vn" : undefined,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
});

    setShowPopup(true);
    window.location.href = "/";
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
    setError(msg);
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    const token = Cookies.get("authToken")
    if (token) {
      axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
    }
  }, [])

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Đăng nhập vào MAKETO</h2>
      <p className="text-sm text-gray-700 mb-6">Nhập thông tin của bạn bên dưới</p>

      {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2 w-full focus:outline-none text-sm text-black placeholder-gray-400"
          disabled={isLoading}
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mật khẩu"
            onChange={handleChange}
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2 w-full focus:outline-none text-sm text-black placeholder-gray-400 pr-10"
            disabled={isLoading}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-black"
          >
            {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
          </span>
        </div>

        <button
          type="submit"
          className="w-full h-10 bg-[#db4444] hover:bg-[#c03d3d] border-[#db4444] text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">hoặc</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full h-10 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Đăng nhập bằng Google
        </button>

        <div className="flex justify-between text-sm mt-3">
          <a href="/signup" className="text-[#db4444] hover:underline hover:opacity-80">
            Đăng ký
          </a>
          <a href="/forgotpassword" className="text-[#db4444] hover:underline hover:opacity-80">
            Quên mật khẩu?
          </a>
        </div>
      </form>

      {showPopup && (
        <div className="fixed top-5 right-5 animate-slide-in z-50 bg-white border-l-4 border-green-500 shadow-lg rounded px-4 py-3 flex items-center gap-3">
          <CheckCircleOutlined className="text-green-600 text-xl" />
          <span className="text-green-700 font-medium text-sm">Đăng nhập thành công!</span>
        </div>
      )}

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
  )
}
