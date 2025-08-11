"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { notification } from "antd"
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons"

export default function GoogleCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Đang xử lý đăng ký Google...")

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")

      if (error) {
        setStatus("Lỗi: " + error)
        notification.error({
          message: "Đăng ký thất bại",
          description: "Có lỗi xảy ra khi đăng ký bằng Google: " + error,
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        })
        setTimeout(() => router.push("/signup"), 3000)
        return
      }

      if (!code || !state) {
        setStatus("Thiếu thông tin xác thực")
        setTimeout(() => router.push("/signup"), 3000)
        return
      }

      // Verify state
      const storedState = localStorage.getItem("google_oauth_state")
      if (state !== storedState) {
        setStatus("Lỗi xác thực state")
        setTimeout(() => router.push("/signup"), 3000)
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
            client_id:
              process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
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

        setStatus("Đang tạo tài khoản...")

        const signupResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/google-signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: tokenData.id_token,
              email: userData.email,
              name: userData.name,
              picture: userData.picture,
            }),
          },
        )

        let signupData
        const signupText = await signupResponse.text()

        try {
          signupData = JSON.parse(signupText)
        } catch (parseError) {
          console.error("Failed to parse signup response as JSON:", signupText)
          throw new Error(`Invalid signup response: ${signupText.substring(0, 200)}`)
        }

        if (!signupResponse.ok) {
          throw new Error(signupData.message || "Signup failed")
        }

        notification.success({
          message: "Đăng ký thành công!",
          description: "Tài khoản Google của bạn đã được tạo thành công.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        })
        if (signupData.token) {
          localStorage.setItem("auth_token", signupData.token)
        }
        router.push("/login")
      } catch (error: any) {
        console.error("OAuth callback error:", error)
        setStatus("Lỗi: " + error.message)
        notification.error({
          message: "Đăng ký thất bại",
          description: error.message || "Có lỗi xảy ra khi đăng ký bằng Google",
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        })
        setTimeout(() => router.push("/signup"), 3000)
      } finally {
        localStorage.removeItem("google_oauth_state")
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
