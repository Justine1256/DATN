"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from '@/utils/api'; 
// ✅ Interface dữ liệu người dùng
interface UserData {
  name: string;
  phone: string;
  email: string;
  role: string;
  currentPassword?: string;
  passwordError?: string;
  profilePicture?: string;
}

// ✅ Props từ cha (nếu cần refresh lại bên ngoài)
interface Props {
  onProfileUpdated?: () => void;
}

export default function AccountPage({ onProfileUpdated }: Props) {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    email: "",
    role: "",
    currentPassword: "",
    passwordError: "",
    profilePicture: "",
  });
  const [previewAvatar, setPreviewAvatar] = useState<string>("");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const showPopupMessage = useCallback((msg: string, type: "success" | "error") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  // ✅ Chọn ảnh (chưa upload ngay)
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      return showPopupMessage("File vượt quá 1MB!", "error");
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("avatar", file);
    setUserData((prev) => ({ ...prev, avatarFormData: formData } as any));
  };

  const fetchUser = useCallback(async () => {
    const token = Cookies.get("authToken");
    if (!token) return setLoading(false);

    try {
      const res = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setUserData({
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        currentPassword: "",
        passwordError: "",
        profilePicture: user.profilePicture || "",
      });
      setPreviewAvatar(user.profilePicture || "");
    } catch {
      showPopupMessage("Failed to load user information.", "error");
    } finally {
      setLoading(false);
    }
  }, [showPopupMessage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value, passwordError: "" }));
  };

  const validateForm = () => {
    const { name, phone, email, currentPassword } = userData;

    if (!name || !phone || !email || !currentPassword) {
      showPopupMessage("Vui lòng nhập đầy đủ thông tin.", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopupMessage("Email không hợp lệ.", "error");
      return false;
    }

    const phoneRegex = /^\d{9,12}$/;
    if (!phoneRegex.test(phone)) {
      showPopupMessage("Số điện thoại không hợp lệ.", "error");
      return false;
    }

    return true;
  };

  // ✅ Cập nhật toàn bộ thông tin (gồm avatar nếu có)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Chưa xác thực.", "error");

    try {
      // Cập nhật thông tin cơ bản
      const res = await axios.put(
        `${API_BASE_URL}/user`,
        {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          current_password: userData.currentPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Nếu có ảnh avatar mới
      const formData = (userData as any).avatarFormData;
      if (formData) {
        await axios.post(`${API_BASE_URL}/user/avatar`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      showPopupMessage("Đã cập nhật thành công!", "success");
      onProfileUpdated?.();
      fetchUser();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "";
      if (msg.toLowerCase().includes("password")) {
        setUserData((prev) => ({ ...prev, passwordError: "Sai mật khẩu hiện tại!" }));
        return showPopupMessage("Sai mật khẩu hiện tại!", "error");
      }
      return showPopupMessage("Lỗi cập nhật!", "error");
    }
  };

  return (
    <div className="w-full flex justify-center text-[15px] text-gray-800">
      <div className="w-full max-w-[1880px] mx-auto ">

        <div className="w-full max-w-[1800px] mx-auto  pt-16">
          <form
            onSubmit={handleSubmit}
            className="p-8 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-[#DB4444] mb-4">Quản Lý Hồ Sơ</h2>

            {/* ✅ Giao diện chia 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium block mb-1">Họ và tên</label>
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={userData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium block mb-1">Email</label>
                    <input
                      type="text"
                      name="email"
                      value={userData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Vai trò</label>
                    <input
                      type="text"
                      name="role"
                      value={userData.role}
                      disabled
                      className="w-full bg-gray-100 p-3 text-sm rounded-md text-gray-500 border border-gray-200 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={userData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className={`w-full bg-gray-100 p-3 text-sm rounded-md border focus:outline-none ${userData.passwordError ? "border-red-500" : "border-gray-300"
                      }`}
                  />
                  {userData.passwordError && (
                    <p className="text-sm text-red-500 mt-1">{userData.passwordError}</p>
                  )}
                </div>
              </div>

              {/* ✅ BÊN PHẢI: avatar preview & upload */}
              <div className="flex flex-col items-center border-l border-gray-200 pl-4">
                <img
                  src={previewAvatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-28 h-28 rounded-full object-cover mb-3 border border-gray-300"
                />

                <label className="text-[11px] text-gray-500 text-center leading-tight max-w-[120px] text-wrap break-words mb-2">
                  Dung lượng tối đa 1MB<br />Định dạng: JPG, PNG
                </label>

                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatarUpload"
                />
                <label
                  htmlFor="avatarUpload"
                  className="cursor-pointer bg-[#DB4444] hover:opacity-90 transition text-white px-4 py-2 rounded text-sm"
                >
                  Chọn ảnh
                </label>
              </div>
            </div>

            {/* ✅ Nút hành động */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="reset"
                onClick={() =>
                  setUserData((prev) => ({
                    ...prev,
                    name: "",
                    phone: "",
                    email: "",
                    currentPassword: "",
                    passwordError: "",
                  }))
                }
                className="text-sm text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
              >
                Lưu thông tin
              </button>
            </div>
          </form>

          {/* ✅ Popup */}
          {showPopup && (
            <div
              className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${popupType === "success"
                  ? "bg-white text-black border-green-500"
                  : "bg-white text-red-600 border-red-500"
                }`}
            >
              {popupMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
