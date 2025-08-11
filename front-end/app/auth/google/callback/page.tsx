"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notification } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Đang xử lý Google OAuth...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const mode = searchParams.get("mode") || "signup";
      const error = searchParams.get("error");

      if (error) {
        setStatus("Lỗi: " + error);
        notification.error({
          message: "Google OAuth thất bại",
          description: error,
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        });
        setTimeout(() => router.push(mode === "login" ? "/login" : "/signup"), 3000);
        return;
      }

      if (!code || !state) {
        setStatus("Thiếu thông tin xác thực");
        setTimeout(() => router.push(mode === "login" ? "/login" : "/signup"), 3000);
        return;
      }

      const storedState = localStorage.getItem("google_oauth_state");
      if (state !== storedState) {
        setStatus("Lỗi xác thực state");
        setTimeout(() => router.push(mode === "login" ? "/login" : "/signup"), 3000);
        return;
      }

      try {
        setStatus("Đang lấy thông tin từ Google...");

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
            client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ?? "",
            redirect_uri: window.location.origin + "/auth/google/callback",
            grant_type: "authorization_code",
          }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || "Token exchange failed");

        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();
        if (!userResponse.ok) throw new Error("Failed to get user info");

        setStatus(mode === "login" ? "Đang đăng nhập..." : "Đang tạo tài khoản...");

        const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/google-${mode}`;
        const apiResponse = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: tokenData.id_token,
            email: userData.email,
            username: userData.email.split("@")[0],
            name: userData.name,
            picture: userData.picture,
          }),
        });

        const apiData = await apiResponse.json();
        if (!apiResponse.ok) throw new Error(apiData.message || `${mode} failed`);

        notification.success({
          message: mode === "login" ? "Đăng nhập thành công" : "Đăng ký thành công",
          description: `Tài khoản Google của bạn đã ${mode === "login" ? "đăng nhập" : "được tạo"} thành công.`,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        });

        if (apiData.token) localStorage.setItem("auth_token", apiData.token);
        router.push("/");
      } catch (err: any) {
        setStatus("Lỗi: " + err.message);
        notification.error({
          message: "Google OAuth thất bại",
          description: err.message,
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
        });
        setTimeout(() => router.push(mode === "login" ? "/login" : "/signup"), 3000);
      } finally {
        localStorage.removeItem("google_oauth_state");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{status}</p>
        <p className="text-gray-400 text-sm mt-2">Vui lòng đợi...</p>
      </div>
    </div>
  );
}
