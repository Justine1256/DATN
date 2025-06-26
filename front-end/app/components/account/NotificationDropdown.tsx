'use client';
import { useState, useEffect } from "react";
import { Bell, ExternalLink, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

// Định nghĩa kiểu dữ liệu cho một đối tượng thông báo
interface Notification {
    id: number;
    image_url: string;
    title: string;
    content: string;
    is_read: number; // 0: chưa đọc, 1: đã đọc
    link: string;
    created_at: string;
}

const NotificationDropdown: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Hàm định dạng thời gian hiển thị thông báo
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Vừa xong";
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
        return `${Math.floor(diffInHours / 168)} tuần trước`;
    };

    // useEffect để gọi API lấy thông báo khi component được mount
    useEffect(() => {
        const token = Cookies.get("authToken");

        // Nếu không có token (người dùng chưa đăng nhập), không làm gì cả
        if (!token) {
            setErrorMessage("Bạn cần đăng nhập để xem thông báo.");
            setLoading(false); // Dừng loading
            return; // Không gọi API
        }

        // Nếu có token, gọi API lấy thông báo
        axios
            .get(`${API_BASE_URL}/notification`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setNotifications(res.data);
                    setErrorMessage(null);
                } else {
                    setErrorMessage("Không có thông báo nào.");
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi khi lấy thông báo", err);
                setErrorMessage("Lỗi khi tải thông báo. Vui lòng thử lại.");
                setLoading(false);
            });
    }, []);

    // Hàm xử lý khi người dùng nhấp vào một thông báo để đánh dấu là đã đọc
    const handleNotificationClick = (id: number) => {
        setNotifications((prevNotifications) =>
            prevNotifications.map((notification) =>
                notification.id === id
                    ? { ...notification, is_read: 1 }
                    : notification
            )
        );

        axios
            .put(
                `${API_BASE_URL}/notification/${id}`,
                { is_read: 1 },
                {
                    headers: { Authorization: `Bearer ${Cookies.get("authToken")}` },
                }
            )
            .catch((err) => console.error("Lỗi khi cập nhật trạng thái thông báo", err));
    };

    return (
        <div className="w-full max-w-[1280px] mx-auto py-8 px-4">
            {/* Header với gradient background */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-8">
                {errorMessage ? (
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
                        <p className="text-rose-700 text-sm font-medium">{errorMessage}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#DB4444] to-red-500 rounded-2xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Thông Báo
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                {notifications.length > 0 ? `${notifications.length} thông báo` : 'Chưa có thông báo'}
                            </p>
                        </div>
                        {notifications.filter((note) => note.is_read === 0).length > 0 && (
                            <div className="ml-auto">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#DB4444] to-red-500 text-white">
                                    {notifications.filter((note) => note.is_read === 0).length} mới
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
                                <div className="flex-grow space-y-3">
                                    <div className="w-3/4 h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                                    <div className="w-2/3 h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                                    <div className="w-1/2 h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Danh sách thông báo */}
            {!loading && (
                <div className="space-y-4 max-h-[445px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={notification.link}
                                className="block group"
                                onClick={() => handleNotificationClick(notification.id)}
                            >
                                <div className={`relative rounded-2xl p-6 transition-all duration-300 ${notification.is_read === 0
                                        ? "bg-gradient-to-r from-blue-50 via-white to-indigo-50"
                                        : "bg-gradient-to-r from-gray-50 to-slate-50"
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        {/* Avatar với gradient border */}
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 p-0.5">
                                                <div className="w-full h-full rounded-2xl overflow-hidden">
                                                    <img
                                                        src={notification.image_url ? `${STATIC_BASE_URL}${notification.image_url}` : "/images/default-image.png"}
                                                        alt={notification.title}
                                                        className="w-full h-full object-cover transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "/images/default-image.png";
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {notification.is_read === 0 && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#DB4444] to-red-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        {/* Nội dung thông báo */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className={`text-base font-semibold leading-snug ${notification.is_read === 0 ? "text-gray-900" : "text-gray-600"
                                                    }`}>
                                                    {notification.title}
                                                </h3>
                                                {notification.is_read === 1 && (
                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                                {notification.content}
                                            </p>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTime(notification.created_at)}</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có thông báo</h3>
                            <p className="text-gray-600">Hiện tại bạn chưa có thông báo nào để hiển thị</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;