"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from '@/utils/api';   
// ✅ Component đổi mật khẩu người dùng

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [popup, setPopup] = useState({ message: "", type: "success" });
  const [showPopup, setShowPopup] = useState(false);
  const [errorField, setErrorField] = useState("");

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorField("");
  };

  const showAlert = (msg: string, type: "success" | "error") => {
    setPopup({ message: msg, type });
    setShowPopup(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = formData;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return showAlert("Vui lòng điền đầy đủ các trường.", "error");
    }

    if (newPassword !== confirmNewPassword) {
      return showAlert("Mật khẩu mới không khớp.", "error");
    }

    try {
      const token = Cookies.get("authToken");

      const payload = {
        current_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      };

      const res = await axios.put(`${API_BASE_URL}/user`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.message?.toLowerCase().includes("thành công")) {
        showAlert("Đổi mật khẩu thành công!", "success");
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setErrorField("");
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Đổi mật khẩu thất bại.";
      showAlert(msg, "error");

      if (msg.toLowerCase().includes("mật khẩu hiện tại")) {
        setErrorField("oldPassword");
      }
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container mx-auto px-4 mt-8">
        <div className="w-full max-w-[400px] mx-auto pt-10 text-black">
          <form className="rounded-lg shadow-md overflow-hidden bg-white" onSubmit={handleSubmit}>
            {/* 🔴 Header đỏ chữ trắng căn giữa */}
            <div className="bg-[#DB4444] text-white text-center py-3 px-4">
              <h2 className="text-xl font-semibold">Thay đổi mật khẩu</h2>
            </div>

            {/* 🔐 Nội dung form */}
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium block mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={`w-full bg-gray-100 p-3 rounded-md focus:outline-none ${errorField === "oldPassword" ? "border border-red-500" : ""}`}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
                />
              </div>

              {/* ✅ Hành động */}
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="reset"
                  onClick={() => {
                    setFormData({
                      oldPassword: "",
                      newPassword: "",
                      confirmNewPassword: "",
                    });
                    setErrorField("");
                  }}
                  className="text-sm text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
                >
                  Lưu mật khẩu
                </button>
              </div>
            </div>
          </form>

          {/* ✅ Thông báo */}
          {showPopup && (
            <div
              className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${popup.type === "success"
                  ? "bg-white text-black border-green-500"
                  : "bg-white text-red-600 border-red-500"
                }`}
            >
              {popup.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
}

