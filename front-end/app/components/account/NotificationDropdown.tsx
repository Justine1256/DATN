'use client'
import { useState, useEffect } from "react";
import { Bell, ExternalLink, Clock } from "lucide-react";
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
    // Khởi tạo các state cần thiết cho component
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

        if (!token) {
            setErrorMessage("Bạn cần đăng nhập để xem thông báo.");
            setLoading(false);
            return;
        }

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

    // Định nghĩa chiều cao cố định cho mỗi thẻ thông báo để đảm bảo căn chỉnh đồng đều
    const CARD_HEIGHT_PX = 200; // Bạn có thể điều chỉnh giá trị này tùy theo thiết kế của mình

    return (
        <div className="w-full max-w-[1280px] mx-auto py-8 px-4">
            {/* Phần hiển thị tiêu đề và số lượng thông báo */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#DB4444] rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Thông Báo</h1>
                    {notifications.filter((note) => note.is_read === 0).length > 0 && (
                        <span className="bg-[#DB4444] text-white text-xs px-2 py-1 rounded-full font-medium">
                            {notifications.filter((note) => note.is_read === 0).length}
                        </span>
                    )}
                </div>
                <p className="text-gray-600 text-sm">
                    {loading ? "Đang tải..." : `${notifications.length} thông báo`}
                </p>
            </div>

            {/* Hiển thị thông báo lỗi nếu có */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
            )}

            {/* Trạng thái tải (hiển thị skeleton loading) */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ height: `${CARD_HEIGHT_PX}px` }} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col">
                            <div className="animate-pulse flex-grow flex flex-col justify-between">
                                <div className="w-14 h-14 bg-gray-200 rounded-lg mb-3 flex-shrink-0"></div>
                                <div>
                                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                                </div>
                                <div className="h-3 bg-gray-200 rounded w-1/3 mt-auto"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lưới hiển thị các thông báo thực tế */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={notification.link}
                                className="block group"
                                onClick={() => handleNotificationClick(notification.id)}
                            >
                                <div
                                    style={{ height: `${CARD_HEIGHT_PX}px` }} // Áp dụng chiều cao cố định cho mỗi thẻ
                                    className={`bg-white rounded-lg p-4 shadow-sm border flex flex-col transition-all duration-200 hover:shadow-md hover:border-[#DB4444] hover:-translate-y-0.5 ${notification.is_read === 0 ? "border-[#DB4444] border-l-4" : "border-gray-200"}`}
                                >
                                    {/* Hình ảnh thông báo */}
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 mb-3 flex-shrink-0">
                                        <img
                                            src={notification.image_url ? `${STATIC_BASE_URL}${notification.image_url}` : '/images/default-image.png'}
                                            alt={notification.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/default-image.png';
                                            }}
                                        />
                                    </div>

                                    {/* Khu vực nội dung thông báo (tiêu đề, mô tả, thời gian) */}
                                    <div className="flex-grow flex flex-col justify-between overflow-hidden">
                                        {/* Tiêu đề và dấu chấm "chưa đọc" */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`text-sm font-semibold line-clamp-2 ${notification.is_read === 0 ? "text-gray-900" : "text-gray-700"}`}>
                                                {notification.title}
                                            </h3>
                                            {notification.is_read === 0 && (
                                                <div className="w-2 h-2 bg-[#DB4444] rounded-full mt-1 flex-shrink-0"></div>
                                            )}
                                        </div>

                                        {/* Đoạn nội dung thông báo */}
                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-grow mb-1">
                                            {notification.content}
                                        </p>

                                        {/* Thời gian và biểu tượng liên kết ngoài */}
                                        <div className="flex items-center justify-between pt-1 mt-auto">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(notification.created_at)}
                                            </span>
                                            <ExternalLink className="w-3 h-3 text-[#DB4444] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        // Hiển thị trạng thái không có thông báo
                        <div className="col-span-full">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center" style={{ height: `${CARD_HEIGHT_PX}px` }}>
                                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Bell className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Không có thông báo
                                </h3>
                                <p className="text-gray-600">
                                    Hiện tại bạn chưa có thông báo nào
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;