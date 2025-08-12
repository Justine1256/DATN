"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { notification } from "antd"
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons"
import Cookies from "js-cookie"

export default function GoogleCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Đang xử lý...")

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")

      const oauthAction = sessionStorage.getItem("oauth_action") || "signup"
      const isLogin = oauthAction === "login"

      setStatus(isLogin ? "Đang xử lý đăng nhập Google..." : "Đang xử lý đăng ký Google...")

      if (error) {
        setStatus("Lỗi: " + error)
        notification.error({
          message: isLogin ? "Đăng nhập thất bại" : "Đăng ký thất bại",
          description: `Có lỗi xảy ra khi ${isLogin ? "đăng nhập" : "đăng ký"} bằng Google: ` + error,
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        })
        setTimeout(() => router.push(isLogin ? "/login" : "/signup"), 3000)
        return
      }

      if (!code || !state) {
        setStatus("Thiếu thông tin xác thực")
        setTimeout(() => router.push(isLogin ? "/login" : "/signup"), 3000)
        return
      }

      const storedState = sessionStorage.getItem("google_oauth_state")
      if (state !== storedState) {
        setStatus("Lỗi xác thực state")
        setTimeout(() => router.push(isLogin ? "/login" : "/signup"), 3000)
        return
      }

      try {
        setStatus("Đang lấy thông tin từ Google...")

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
            client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ?? "",
            redirect_uri: window.location.origin + "/auth/google/callback",
            grant_type: "authorization_code",
          }),
        })

        let tokenData
        const tokenText = await tokenResponse.text()
        console.log("Token response:", tokenText)

        try {
          tokenData = JSON.parse(tokenText)
        } catch (parseError) {
          console.error("Failed to parse token response as JSON:", tokenText)
          throw new Error(`Invalid response from Google: ${tokenText.substring(0, 200)}`)
        }

        if (!tokenResponse.ok) {
          throw new Error(tokenData.error_description || "Token exchange failed")
        }

        // Get user info from Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        let userData
        const userText = await userResponse.text()

        try {
          userData = JSON.parse(userText)
        } catch (parseError) {
          console.error("Failed to parse user response as JSON:", userText)
          throw new Error(`Invalid user info response: ${userText.substring(0, 200)}`)
        }

        if (!userResponse.ok) {
          throw new Error("Failed to get user info")
        }

        setStatus(isLogin ? "Đang đăng nhập..." : "Đang tạo tài khoản...")

        const apiEndpoint = isLogin ? "/google-login" : "/google-signup"
        const authResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}${apiEndpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: tokenData.id_token,
              email: userData.email,
              username: userData.email.split("@")[0],
              name: userData.name,
              picture: userData.picture,
            }),
          },
        )

        let authData
        const authText = await authResponse.text()

        try {
          authData = JSON.parse(authText)
        } catch (parseError) {
          console.error("Failed to parse auth response as JSON:", authText)
          throw new Error(`Invalid auth response: ${authText.substring(0, 200)}`)
        }

        if (!authResponse.ok) {
          throw new Error(authData.message || `${isLogin ? "Login" : "Signup"} failed`)
        }

        console.log("Auth response data:", authData)

        notification.success({
          message: isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!",
          description: isLogin
            ? "Bạn đã đăng nhập thành công bằng Google."
            : "Tài khoản Google của bạn đã được tạo thành công.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        })

        if (authData.token) {
          Cookies.set("authToken", authData.token, { expires: 7 })
          console.log("Cookie set with token:", authData.token)
        } else {
          console.error("No token found in response:", authData)
        }

        if (isLogin) {
          router.push("/")
        } else {
          // For signup, redirect to login page
          router.push("/login")
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error)
        setStatus("Lỗi: " + error.message)
        notification.error({
          message: isLogin ? "Đăng nhập thất bại" : "Đăng ký thất bại",
          description: error.message || `Có lỗi xảy ra khi ${isLogin ? "đăng nhập" : "đăng ký"} bằng Google`,
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        })
        setTimeout(() => router.push(isLogin ? "/login" : "/signup"), 3000)
      } finally {
        sessionStorage.removeItem("google_oauth_state")
        sessionStorage.removeItem("oauth_action")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{status}</p>
        <p className="text-gray-400 text-sm mt-2">Vui lòng đợi...</p>
      </div>
    </div>
  )
}
