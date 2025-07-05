"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { Crown, Gem, Medal, User } from "lucide-react";
interface UserData {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  rank: string;
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    avatar: "",
    rank: "",
  });
  const [previewAvatar, setPreviewAvatar] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);


  const getRankBg = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'bg-[#fff7f0] border-[#e7d4b8] text-[#c27a33]';
      case 'silver': return 'bg-[#f9f9f9] border-[#c0c0c0] text-[#a0a0a0]';
      case 'gold': return 'bg-[#fff9dc] border-[#ffd700] text-[#c59d00]';
      case 'diamond': return 'bg-[#e0f7fa] border-[#00ffff] text-[#00bcd4]';
      default: return 'bg-[#fdf6ec] border-[#e7d4b8] text-gray-700';
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
      setUserData(res.data);
      setPreviewAvatar(res.data.avatar ? `${STATIC_BASE_URL}/${res.data.avatar}` : "");
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

    if (!userData.name.trim()) return showPopupMessage("Vui lòng nhập tên.", "error");
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(userData.phone.trim())) {
      return showPopupMessage("Số điện thoại không hợp lệ.", "error");
    }

    try {
      await axios.put(`${API_BASE_URL}/user`, {
        name: userData.name,
        phone: userData.phone,
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
    } catch (err: any) {
      showPopupMessage(err?.response?.data?.message || "Lỗi cập nhật!", "error");
    }
  };

  const avatarUrl = previewAvatar || "/default-avatar.jpg";

  return (
    <div className="w-full flex justify-center py-10 text-[15px] text-gray-800">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-[#DB4444] px-6 py-4 text-center text-red-50 text-xl">
          {isEditing ? "Tùy chỉnh hồ sơ" : "Tài khoản của tôi"}
        </div>

        <div className="p-6 space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover"
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
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Email"
                  value={userData.email}
                  className="p-3 border rounded text-sm bg-gray-50 text-gray-500"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Tên đăng nhập"
                  value={userData.username}
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
              <div className="flex gap-6">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="space-y-1">
                  <p className="font-bold text-lg">{userData.name}</p>
                  <p className="text-sm text-[#DB4444]">{userData.username}</p>
                  <p className="text-sm text-gray-700">Email: {userData.email}</p>
                  <p className="text-sm text-gray-700">Số điện thoại: {userData.phone}</p>
                  <p className="text-sm text-gray-700 capitalize">Vai trò: {userData.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="border border-gray-300 px-4 py-1.5 rounded hover:bg-[#DB4444] hover:text-white transition"
              >
                Chỉnh sửa
              </button>
            </div>
          )}

          {/* Thẻ thành viên */}
          <div
            className="relative rounded-xl p-5 border shadow-[0_4px_20px_rgba(230,206,172,0.2)] overflow-hidden"
            style={{
              backgroundImage:
                userData.rank === 'diamond'
                  ? "url('/diamond-bg.png')"
                  : userData.rank === 'gold'
                    ? "url('/gold-bg.png')"
                    : userData.rank === 'silver'
                      ? "url('/silver-bg.png')"
                      : userData.rank === 'bronze'
                        ? "url('/bronze-bg.png')"
                        : "url('/member-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/5 rounded-xl"></div> {/* overlay nhẹ */}

            <div className="relative z-10 flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Thẻ thành viên</h3>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${getRankBg(userData.rank)}`}>
                {getRankIcon(userData.rank)}
                <span className="capitalize">{userData.rank}</span>
              </div>
            </div>

            {/* progress */}
            <div className="relative z-10 flex divide-x divide-[#e7d4b8]/50 text-center">
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Đơn hàng</p>
                <p className="text-lg font-bold">
                  0<span className="text-sm">/75</span>
                </p>
                <div className="mt-2 w-full bg-[#f2e8d6] rounded-full h-2">
                  <div className="bg-[#d4a94e] h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Chi tiêu</p>
                <p className="text-lg font-bold">
                  đ0<span className="text-sm">/15tr</span>
                </p>
                <div className="mt-2 w-full bg-[#f2e8d6] rounded-full h-2">
                  <div className="bg-[#d4a94e] h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-center relative z-10">
              Thứ hạng sẽ được cập nhật lại sau 31.12.2025.
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
