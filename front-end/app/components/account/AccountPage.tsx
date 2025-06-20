"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { User } from 'lucide-react';
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

    // ✅ VALIDATION BẰNG JS
    if (!userData.name.trim()) {
      return showPopupMessage("Vui lòng nhập họ và tên.", "error");
    }

    const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(userData.phone.trim())) {
      return showPopupMessage("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số.", "error");
    }

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
    <div className="w-full flex justify-center text-[15px] text-gray-800 mt-2">
      <div className="w-full max-w-[1880px] mx-auto">
        <div className="w-full max-w-[1200px] mx-auto pt-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-md mx-auto overflow-hidden">
            {/* ✅ Header đỏ với icon + text */}
            <div className="bg-[#DB4444] text-white rounded-t-xl px-5 py-3 flex justify-center items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold text-base">Quản lý hồ sơ</span>
            </div>


            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              

              <div className="space-y-5">
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

            {/* ✅ Popup thông báo */}
            {showPopup && (
              <div
                className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn
                  ${popupType === 'success'
                    ? 'bg-white text-black border-green-500'
                    : 'bg-white text-red-600 border-red-500'
                  }`}
              >
                {popupMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
    
    
    
}
