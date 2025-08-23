"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useUser } from "../../context/UserContext";
import Image from "next/image";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { Crown, Gem, Medal, User, RotateCw } from "lucide-react";

// (Optional) Kiểu dữ liệu user từ server
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

  // preview avatar
  const [previewAvatar, setPreviewAvatar] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  // popup
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);

  // ui states
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecalcLoading, setIsRecalcLoading] = useState(false);

  // số liệu thẻ thành viên
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  // rank an toàn
  const rank = user?.rank ?? "bronze";

  // ===== helpers =====
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

  // 🟡 Xác định style nền + chữ theo rank
  const getRankStyle = (r: string) => {
    switch (r) {
      case "bronze":
        return { bg: "bg-[#CD7F32]", text: "text-white" };
      case "silver":
        return { bg: "bg-[#8BA0B7]", text: "text-white" };
      case "gold":
        return { bg: "bg-[#C9A602]", text: "text-white" };
      case "diamond":
        return { bg: "bg-[#FFFFFF]", text: "text-[#4283FF]" }; // nền trắng, chữ xanh
      default:
        return { bg: "bg-[#DDE9FF]", text: "text-[#517191]" };
    }
  };


  const getRankIcon = (r: string) => {
    switch (r) {
      case "bronze":
        return <Medal className="w-3 h-3" />;
      case "silver":
        return <Medal className="w-3 h-3" />;
      case "gold":
        return <Crown className="w-3 h-3" />;
      case "diamond":
        return <Gem className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const colorByRank = (r: string) =>
    r === "diamond"
      ? "#80AAFA"
      : r === "gold"
        ? "#C9A602"
        : r === "silver"
          ? "#8BA0B7"
          : r === "bronze"
            ? "#CD7F32"
            : "#80AAFA";

  // ngưỡng chi tiêu theo logic bạn gửi
  const spendTargetByRank = (r: string) => {
    switch (r) {
      case "diamond":
        return 50_000_000;
      case "gold":
        return 20_000_000;
      case "silver":
        return 10_000_000;
      case "bronze":
        return 5_000_000;
      default:
        // member/khác
        return 0;
    }
  };

  const showPopupMessage = useCallback((msg: string, type: "success" | "error") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  useEffect(() => {
    if (showPopup) {
      const t = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

  // ===== data fetching =====
  const fetchUser = useCallback(async () => {
    const token = Cookies.get("authToken");
    if (!token) return setLoading(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      // nếu /user có trả kèm số liệu thì nạp luôn (không bắt buộc)
      if (res?.data?.delivered_orders != null) {
        setDeliveredOrders(Number(res.data.delivered_orders) || 0);
      }
      if (res?.data?.total_spent != null) {
        setTotalSpent(Number(res.data.total_spent) || 0);
      }
    } catch {
      showPopupMessage("Không thể tải thông tin người dùng.", "error");
    } finally {
      setLoading(false);
    }
  }, [setUser, showPopupMessage]);

  // gọi recalc để có số liệu ngay khi vào
  const fetchRankInfo = useCallback(async () => {
    const token = Cookies.get("authToken");
    if (!token) return;
    try {
      const url = `${API_BASE_URL}/me/recalculate-rank`;
      const res = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });

      const newRank =
        res?.data?.rank ||
        res?.data?.data?.rank ||
        res?.data?.user?.rank ||
        res?.data?.payload?.rank;

      if (newRank) {
        setUser((prev: any) => (prev ? { ...prev, rank: newRank } : prev));
      }

      const delivered =
        res?.data?.delivered_orders ?? res?.data?.data?.delivered_orders ?? 0;
      const spent = res?.data?.total_spent ?? res?.data?.data?.total_spent ?? 0;

      setDeliveredOrders(Number(delivered) || 0);
      setTotalSpent(Number(spent) || 0);
    } catch (err) {
      // silent log
      console.error("recalculate-rank failed:", err);
    }
  }, [setUser]);

  useEffect(() => {
    // load cả user + rank info
    fetchUser();
    fetchRankInfo();
  }, [fetchUser, fetchRankInfo]);

  // ===== avatar handlers =====
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

    if (!user?.name?.trim()) return showPopupMessage("Vui lòng nhập tên.", "error");
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
    if (!user?.phone || !phoneRegex.test(user.phone.trim())) {
      return showPopupMessage("Số điện thoại không hợp lệ.", "error");
    }

    try {
      await axios.put(
        `${API_BASE_URL}/user`,
        { name: user.name, phone: user.phone },
        { headers: { Authorization: `Bearer ${token}` } }
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
      setIsEditing(false);
      fetchUser();
      setPreviewAvatar("");
    } catch (err: any) {
      showPopupMessage(err?.response?.data?.message || "Lỗi cập nhật!", "error");
    }
  };

  const handleRecalculateRank = async () => {
    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Chưa xác thực.", "error");

    try {
      setIsRecalcLoading(true);
      const url = `${API_BASE_URL}/me/recalculate-rank`;
      const res = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });

      const newRank =
        res?.data?.rank ||
        res?.data?.data?.rank ||
        res?.data?.user?.rank ||
        res?.data?.payload?.rank;

      if (newRank) {
        setUser((prev: any) => (prev ? { ...prev, rank: newRank } : prev));
      } else {
        await fetchUser();
      }

      const delivered =
        res?.data?.delivered_orders ?? res?.data?.data?.delivered_orders ?? 0;
      const spent = res?.data?.total_spent ?? res?.data?.data?.total_spent ?? 0;

      setDeliveredOrders(Number(delivered) || 0);
      setTotalSpent(Number(spent) || 0);

      showPopupMessage("Đã cập nhật lại thứ hạng!", "success");
    } catch (err: any) {
      showPopupMessage(
        err?.response?.data?.message || "Không thể cập nhật thứ hạng!",
        "error"
      );
    } finally {
      setIsRecalcLoading(false);
    }
  };

  // avatar url (giữ như cũ)
  const avatarUrl =
    previewAvatar ||
    (user?.avatar
      ? user.avatar.startsWith("http")
        ? user.avatar
        : `${STATIC_BASE_URL}${user.avatar.startsWith("/") ? "" : "/"}${user.avatar}`
      : "/default-avatar.jpg");

  // ===== progress & targets =====
  const ORDER_TARGET = 75; // giữ mốc 75 đơn để tính bar
  const orderPercent = Math.min(
    ORDER_TARGET ? (deliveredOrders / ORDER_TARGET) * 100 : 0,
    100
  );

  const spendTarget = spendTargetByRank(rank);
  const spendPercent = Math.min(
    spendTarget ? (totalSpent / spendTarget) * 100 : 0,
    100
  );

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
                  value={user?.name ?? ""}
                  onChange={(e) =>
                    setUser({ ...(user ?? ({} as any)), name: e.target.value })
                  }
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={user?.phone ?? ""}
                  onChange={(e) =>
                    setUser({ ...(user ?? ({} as any)), phone: e.target.value })
                  }
                  className="p-3 border rounded text-sm"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Email"
                  value={user?.email ?? ""}
                  className="p-3 border rounded text-sm bg-gray-50 text-gray-500"
                />
                <input
                  type="text"
                  disabled
                  placeholder="Tên đăng nhập"
                  value={user?.username ?? ""}
                  className="p-3 border rounded text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#DB4444] text-white px-5 py-2 rounded hover:opacity-80"
                >
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
                  <p className="font-bold text-lg">{user?.name}</p>
                  <p className="text-sm text-[#DB4444]">{user?.username}</p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Số điện thoại:</strong> {user?.phone}
                  </p>
                  <p className="text-sm text-gray-700 capitalize">
                    <strong>Vai trò:</strong> {user?.role}
                  </p>
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
              background:
                rank === "diamond"
                  ? "url(/platinum-card-bg.jpg)"
                  : rank === "gold"
                    ? "url(/gold-card-bg.jpg)"
                    : rank === "silver"
                      ? "url(/silver-card-bg.jpg)"
                      : rank === "bronze"
                        ? "url(/bronze-card-bg.jpg)"
                        : "url(/default-card-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "#CCCCCC",
            }}
          >
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Thẻ thành viên</h3>

              {/* Nhãn rank + Nút cập nhật hạng */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecalculateRank}
                  disabled={isRecalcLoading}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded border ${isRecalcLoading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-white/90 hover:text-[#DB4444]"
                    }`}
                  style={{
                    color: "#ffffff",
                    borderColor: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    transition: "all .15s ease",
                  }}
                  title="Cập nhật lại thứ hạng"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRecalcLoading ? "animate-spin" : ""}`} />
                  {isRecalcLoading ? "Đang cập nhật..." : "Cập nhật hạng"}
                </button>

                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium  text-white ${getRankStyle(
                    rank
                  )}`}
                >
                  {getRankIcon(rank)}
                  <span className="capitalize">{rank}</span>
                </div>
              </div>
            </div>

            {/* Khu hiển thị số + progress bar */}
            <div
              className={`relative z-10 flex divide-x text-center ${rank === "diamond"
                  ? "divide-[#CCCCCC]"
                  : rank === "gold"
                    ? "divide-[#C9A602]"
                    : rank === "silver"
                      ? "divide-[#A9B8C9]"
                      : rank === "bronze"
                        ? "divide-[#CD7F32]"
                        : "divide-[#80AAFA]"
                }`}
            >
              {/* Đơn hàng: chỉ số, KHÔNG có "/" nhưng vẫn có progress */}
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Đơn hàng</p>
                <p className="text-lg font-bold">
                  <span style={{ color: colorByRank(rank) }}>{deliveredOrders}</span>
                </p>
                <div className="mt-2 w-full bg-[#DDDDDD] rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${orderPercent}%`,
                      backgroundColor: colorByRank(rank),
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Chi tiêu: hiển thị "đã chi / ngưỡng theo rank" + progress */}
              <div className="flex-1 px-4">
                <p className="text-xs mb-1">Chi tiêu</p>
                <p className="text-lg font-bold">
                  <span style={{ color: colorByRank(rank) }}>
                    {formatVND(totalSpent)}{" "}
                    {spendTarget > 0 ? ` / ${formatVND(spendTarget)}` : ""}
                  </span>
                </p>
                <div className="mt-2 w-full bg-[#DDDDDD] rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${spendPercent}%`,
                      backgroundColor: colorByRank(rank),
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {showPopup && (
          <div
            className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn ${popupType === "success"
                ? "bg-white text-black border-green-500"
                : "bg-white text-red-600 border-red-500"
              }`}
          >
            {popupMessage}
          </div>
        )}
      </div>
    </div>
  );
}
