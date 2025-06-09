"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";

// ✅ Component đổi mật khẩu người dùng
export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "", // Mật khẩu hiện tại
    newPassword: "", // Mật khẩu mới
    confirmNewPassword: "", // Xác nhận mật khẩu mới
  });

  const [popup, setPopup] = useState({ message: "", type: "success" });
  const [showPopup, setShowPopup] = useState(false);
  const [errorField, setErrorField] = useState(""); // ✅ Trường gây lỗi

  // ✅ Tự động ẩn popup sau 2 giây
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // ✅ Xử lý thay đổi dữ liệu form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorField(""); // ✅ Xóa lỗi khi người dùng bắt đầu sửa lại
  };

  // ✅ Hiển thị popup thông báo
  const showAlert = (msg: string, type: "success" | "error") => {
    setPopup({ message: msg, type });
    setShowPopup(true);
  };

  // ✅ Gửi dữ liệu đổi mật khẩu lên server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = formData;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return showAlert("Please fill in all fields.", "error");
    }

    if (newPassword !== confirmNewPassword) {
      return showAlert("New passwords do not match.", "error");
    }

    try {
      const token = Cookies.get("authToken");

      const payload = {
        current_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      };

      const res = await axios.put("http://localhost:8000/api/user", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.message?.toLowerCase().includes("thành công")) {
        showAlert("Password updated successfully!", "success");
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
      const msg = err?.response?.data?.error || "Failed to update password.";
      showAlert(msg, "error");

      if (msg.toLowerCase().includes("mật khẩu hiện tại")) {
        setErrorField("oldPassword");
      }
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-[600px] mx-auto px-4 pt-10 text-black">
          {/* ✅ Form đổi mật khẩu */}
          <form
            onSubmit={handleSubmit}
            className="p-6 bg-white rounded-lg shadow-md space-y-6"
          >
            <h2 className="text-xl font-semibold text-[#DB4444] mb-2">
              Change Password
            </h2>

            {/* ✅ Mật khẩu hiện tại */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className={`w-full bg-gray-100 p-3 rounded-md focus:outline-none ${
                  errorField === "oldPassword" ? "border border-red-500" : ""
                }`}
              />
            </div>

            {/* ✅ Mật khẩu mới */}
            <div>
              <label className="text-sm font-medium block mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
              />
            </div>

            {/* ✅ Nhập lại mật khẩu mới */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="w-full bg-gray-100 p-3 rounded-md focus:outline-none"
              />
            </div>

            {/* ✅ Nút hành động */}
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
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* ✅ Popup thông báo kết quả */}
          {showPopup && (
            <div
              className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${
                popup.type === "success"
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
