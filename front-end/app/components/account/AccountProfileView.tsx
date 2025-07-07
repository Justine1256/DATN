"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useUser } from "../../context/UserContext";
import Image from "next/image"; // Thêm import Image
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { Crown, Gem, Medal, User } from "lucide-react";
interface user {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  rank: string;
}

export default function AccountPage() {

  const { user, setUser } = useUser();

  const [previewAvatar, setPreviewAvatar] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);


  const getRankBg = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'bg-[#CD7F32]';
      case 'silver': return 'bg-[#A9B8C9]';
      case 'gold': return 'bg-[#C9A602]';
      case 'diamond': return 'bg-[#FAEAEA] text-[#363738]';
      default: return 'bg-[#DDE9FF] text-[#517191]';
    }
  }
  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'bronze': return <Medal className="w-3 h-3" />;
      case 'silver': return <Medal className="w-3 h-3" />;
      case 'gold': return <Crown className="w-3 h-3" />;
      case 'diamond': return <Gem className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

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
      setUser(res.data); // Update user context
    } catch {
      showPopupMessage("Không thể tải thông tin người dùng.", "error");
    } finally {
      setLoading(false);
    }
  }, [showPopupMessage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      return showPopupMessage("File vượt quá 1MB!", "error");
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewAvatar(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Chưa xác thực.", "error");

    if (!user.name.trim()) return showPopupMessage("Vui lòng nhập tên.", "error");
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(user.phone.trim())) {
      return showPopupMessage("Số điện thoại không hợp lệ.", "error");
    }

    try {
      await axios.put(`${API_BASE_URL}/user`, {
        name: user.name,
        phone: user.phone,
      }, { headers: { Authorization: `Bearer ${token}` } });

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
      setIsEditing(false);
      fetchUser();
      setPreviewAvatar(""); // Reset preview after update
    } catch (err: any) {
      showPopupMessage(err?.response?.data?.message || "Lỗi cập nhật!", "error");
    }
  };

  const avatarUrl =
    previewAvatar ||
    (user?.avatar
      ? user.avatar.startsWith("http")
        ? user.avatar
        : `${STATIC_BASE_URL}${user.avatar.startsWith("/") ? "" : "/"}${user.avatar}`
      : "/default-avatar.jpg");



  return (
    <div className="w-full flex justify-center py-10 text-[15px] text-gray-800">
      <div className="w-full max-w-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-[#DB4444] px-6 py-4 text-center text-red-50 text-xl">
          {isEditing ? "Tùy chỉnh hồ sơ" : "Tài khoản của tôi"}
        </div>

        <div className="p-7 space-y-7">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-1/4 h-1/4 rounded-full object-cover"
                />
                <label className="text-xs text-[#DB4444] cursor-pointer border border-[#DB4444] px-3 py-1 rounded hover:bg-[#DB4444] hover:text-white transition">
                  Đổi ảnh đại diện
                  <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                </label>
                <p className="text-xs text-gray-500">PNG or JPG, 1MB tối đa</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tên"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Email"
                  value={user.email}
                  className="p-3 border rounded text-sm bg-gray-50 text-gray-500"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Tên đăng nhập"
                  value={user.username}
                  className="p-3 border rounded text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-600">
                  Hủy
                </button>
                <button type="submit" className="bg-[#DB4444] text-white px-5 py-2 rounded hover:opacity-80">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex gap-9">
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={150}
                    height={150}
                    className="w-1/4 h-1/4 rounded-full object-cover"
                    unoptimized
                  />

                <div className="flex flex-col justify-between">
                  <p className="font-bold text-lg">{user.name}</p>
                  <p className="text-sm text-[#DB4444]">{user.username}</p>
                  <p className="text-sm text-gray-700"><strong>Email:</strong> {user.email}</p>
                  <p className="text-sm text-gray-700"><strong>Số điện thoại:</strong> {user.phone}</p>
                  <p className="text-sm text-gray-700 capitalize"><strong>Vai trò:</strong> {user.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="whitespace-nowrap border border-gray-300 px-4 py-1.5 rounded hover:bg-[#DB4444] hover:text-white transition"
              >
                Chỉnh sửa
              </button>
            </div>
          )}

          {/* Thẻ thành viên */}
          <div
            className="relative rounded-xl p-5 overflow-hidden"
            style={{
              backgroundColor:
                user.rank === 'diamond'
                  ? "#E0F0FF33"
                  : user.rank === 'gold'
                    ? "#FFD7000A"
                    : user.rank === 'silver'
                      ? "#A9B8C90A"
                      : user.rank === 'bronze'
                        ? "#CD7F320A"
                        : "#80AAFA0A",
            }}
          >
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Thẻ thành viên</h3>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium  text-white ${getRankBg(user.rank)}`}>
                {getRankIcon(user.rank)}
                <span className="capitalize">{user.rank}</span>
              </div>
            </div>

            {/* progress */}
            <div
              className={`relative z-10 flex divide-x text-center ${user.rank === 'diamond'
                  ? 'divide-[#DB4444]'
                  : user.rank === 'gold'
                    ? 'divide-[#C9A602]'
                    : user.rank === 'silver'
                      ? 'divide-[#A9B8C9]'
                      : user.rank === 'bronze'
                        ? 'divide-[#CD7F32]'
                        : 'divide-[#80AAFA]'
                }`}>
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Đơn hàng</p>
                <p className="text-lg font-bold">
                  <span style={{
                    color:
                      user.rank === 'diamond'
                        ? "#DB4444"
                        : user.rank === 'gold'
                          ? "#C9A602"
                          : user.rank === 'silver'
                            ? "#8BA0B7"
                            : user.rank === 'bronze'
                              ? "#CD7F32"
                              : "#80AAFA",
                  }}>0</span><span className="text-sm">/75</span>
                </p>
                <div className="mt-2 w-full bg-[#DDDDDD] rounded-full h-2">
                  <div className="bg-[#d4a94e] h-2 rounded-full"
                    style={{
                      width: "0%",
                      backgroundColor:
                        user.rank === 'diamond'
                          ? "#DB4444"
                          : user.rank === 'gold'
                            ? "#C9A602"
                            : user.rank === 'silver'
                              ? "#A9B8C9"
                              : user.rank === 'bronze'
                                ? "#CD7F32"
                                : "#80AAFA",
                    }}></div>
                </div>
              </div>
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Chi tiêu</p>
                <p className="text-lg font-bold">
                  <span style={{
                    color:
                      user.rank === 'diamond'
                        ? "#DB4444"
                        : user.rank === 'gold'
                          ? "#C9A602"
                          : user.rank === 'silver'
                            ? "#8BA0B7"
                            : user.rank === 'bronze'
                              ? "#CD7F32"
                              : "#80AAFA",
                  }}>0đ</span><span className="text-sm">/15tr</span>
                </p>
                <div className="mt-2 w-full bg-[#DDDDDD] rounded-full h-2">
                  <div className="bg-[#DDDDDD] h-2 rounded-full" style={{
                    width: "0%", backgroundColor:
                      user.rank === 'diamond'
                        ? "#DB4444"
                        : user.rank === 'gold'
                          ? "#C9A602"
                          : user.rank === 'silver'
                            ? "#A9B8C9"
                            : user.rank === 'bronze'
                              ? "#CD7F32"
                              : "#80AAFA",
                  }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-center relative z-10">
              Thứ hạng sẽ được cập nhật lại sau 31/12/2025
            </div>
          </div>




        </div>

        {showPopup && (
          <div
            className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn
              ${popupType === 'success'
                ? 'bg-white text-black border-green-500'
                : 'bg-white text-red-600 border-red-500'
              }`}>
            {popupMessage}
          </div>
        )}
      </div>
    </div>
  );
}
