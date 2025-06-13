"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

// ✅ Interface dữ liệu người dùng
interface UserData {
  name: string;
  phone: string;
  email: string;
  role: string;
  profilePicture?: string;
}

// ✅ Props nhận từ cha nếu muốn callback sau khi cập nhật
interface Props {
  onProfileUpdated?: () => void;
}

export default function AccountPage({ onProfileUpdated }: Props) {
  // ✅ State chính
  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    email: "",
    role: "",
    profilePicture: "",
  });

  const [previewAvatar, setPreviewAvatar] = useState<string>("");            // ✅ Ảnh avatar hiển thị
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null); // ✅ File ảnh lưu tạm

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // ✅ Trạng thái chỉnh sửa

  // ✅ Hàm hiện thông báo
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

  // ✅ Lấy thông tin người dùng
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

  // ✅ Đường dẫn ảnh avatar
  const avatarUrl =
    previewAvatar ||
    (userData.profilePicture
      ? `${STATIC_BASE_URL}/${userData.profilePicture}`
      : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`);

  // ✅ Khi thay đổi ô input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Khi chọn ảnh avatar (chỉ preview và lưu file, KHÔNG upload ngay)
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

    setSelectedAvatarFile(file); // ✅ Lưu file để upload sau
  };

  // ✅ Gửi form cập nhật thông tin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Chưa xác thực.", "error");

    try {
      // ✅ Cập nhật thông tin người dùng
      await axios.put(
        `${API_BASE_URL}/user`,
        {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Nếu có file avatar mới, thì upload sau
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
      console.error("Lỗi cập nhật hồ sơ:", error); // ✅ In ra console
      const message = error?.response?.data?.message || "Lỗi cập nhật thông tin!";
      showPopupMessage(message, "error");
    }
    
  };

  // ✅ Class cho input khi disabled hoặc editable
  const getInputClass = (enabled: boolean) =>
    `w-full p-3 text-sm rounded-md ${enabled
      ? "bg-gray-100 border border-gray-300 text-black"
      : "bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed"
    }`;

  return (
    <div className="w-full flex justify-center text-[15px] text-gray-800">
      <div className="w-full max-w-[1880px] mx-auto">
        <div className="w-full max-w-[1800px] mx-auto pt-16">
          {/* ✅ FORM QUẢN LÝ HỒ SƠ */}
          <form
            onSubmit={handleSubmit}
            className="p-8 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-[#DB4444] mb-1">Quản lý hồ sơ</h2>
            <p className="text-sm text-gray-500 mb-6">Xem và chỉnh sửa thông tin cá nhân</p>

            {/* ✅ KHUNG 2 CỘT THÔNG TIN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ✅ CỘT TRÁI: thông tin người dùng */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium block mb-1">Email</label>
                    <input
                      type="text"
                      name="email"
                      value={userData.email}
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
              </div>

              {/* ✅ CỘT PHẢI: ảnh avatar */}
              {isEditing && (
                <div className="flex flex-col items-center border-l border-gray-200 pl-4">
                  <div className="w-20 h-20 mb-3 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
                      }}
                    />
                  </div>
                  <label className="text-[11px] text-gray-500 text-center leading-tight max-w-[120px] mb-2">
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
              )}
            </div>

            {/* ✅ NÚT HÀNH ĐỘNG */}
            <div className="flex justify-end gap-4 mt-6">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedAvatarFile(null);
                      fetchUser(); // Reset lại nếu bấm hủy
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

          {/* ✅ POPUP THÔNG BÁO */}
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
