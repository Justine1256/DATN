"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

interface UserData {
  name: string;
  phone: string;
  role: string;
  profilePicture?: string;
}

interface Props {
  onProfileUpdated?: () => void;
}

export default function AccountPage({ onProfileUpdated }: Props) {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    role: "",
    profilePicture: "",
  });

  const [previewAvatar, setPreviewAvatar] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const showPopupMessage = useCallback((msg: string, type: "success" | "error") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

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
        role: user.role,
        profilePicture: user.profilePicture || "",
      });
      setPreviewAvatar(user.profilePicture || "");
    } catch {
      showPopupMessage("Không thể tải thông tin người dùng.", "error");
    } finally {
      setLoading(false);
    }
  }, [showPopupMessage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const avatarUrl =
    previewAvatar ||
    (userData.profilePicture
      ? `${STATIC_BASE_URL}/${userData.profilePicture}`
      : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

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
    setSelectedAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Chưa xác thực.", "error");

    try {
      await axios.put(
        `${API_BASE_URL}/user`,
        {
          name: userData.name,
          phone: userData.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append("avatar", selectedAvatarFile);

        await axios.post(`${API_BASE_URL}/user/avatar`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setSelectedAvatarFile(null);
      }

      showPopupMessage("Đã cập nhật thành công!", "success");
      onProfileUpdated?.();
      setIsEditing(false);
      fetchUser();
    } catch (error: any) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      const message = error?.response?.data?.message || "Lỗi cập nhật thông tin!";
      showPopupMessage(message, "error");
    }
  };

  const getInputClass = (enabled: boolean) =>
    `w-full p-3 text-sm rounded-md ${enabled
      ? "bg-gray-100 border border-gray-300 text-black"
      : "bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed"
    }`;

  return (
    <div className="w-full flex justify-center text-[15px] text-gray-800">
      <div className="w-full max-w-[1880px] mx-auto">
        <div className="w-full max-w-[1800px] mx-auto pt-16">
          <form
            onSubmit={handleSubmit}
            className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-semibold text-[#DB4444] mb-1">Quản lý hồ sơ</h2>
            <p className="text-sm text-gray-500 mb-6">Xem và chỉnh sửa thông tin cá nhân</p>

            {/* ✅ Luôn giữ 2 cột để ảnh luôn hiển thị bên phải */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Cột trái: thông tin */}
              <div className="space-y-6 w-full">
                <div>
                  <label className="text-sm font-medium block mb-1">Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={getInputClass(isEditing)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={getInputClass(isEditing)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Vai trò</label>
                  <input
                    type="text"
                    name="role"
                    value={userData.role}
                    disabled
                    className="w-full p-3 text-sm rounded-md bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cột phải: ảnh avatar luôn hiển thị */}
              <div className="flex flex-col items-center justify-start pt-2">
                <div className="w-24 h-24 mb-2 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
                    }}
                  />
                </div>
                <label className="text-[11px] text-gray-500 text-center leading-tight mb-1">
                 
                </label>

                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatarUpload"
                    />
                    <label
                      htmlFor="avatarUpload"
                      className="cursor-pointer bg-[#DB4444] hover:opacity-90 transition text-white px-4 py-1.5 rounded text-xs"
                    >
                      Chọn ảnh
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-center gap-4 mt-6">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedAvatarFile(null);
                      fetchUser();
                    }}
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
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
                >
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </form>

          {/* Thông báo popup */}
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
