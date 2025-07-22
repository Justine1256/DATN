'use client';

import { FaRegBell } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { STATIC_BASE_URL } from "@/utils/api";

interface Notification {
    id: number;
    image_url: string;
    title: string;
    content: string;
    is_read: number;
    link: string;
    created_at: string;
}

interface Props {
    notifications: Notification[];
    unreadCount: number;
    onNotificationClick: (id: number, link: string) => void;
}

export default function NotificationDropdown({ notifications, unreadCount, onNotificationClick }: Props) {
    const router = useRouter();

    const formatImageUrl = (img: string | string[]): string => {
        if (Array.isArray(img)) img = img[0];
        if (typeof img !== 'string' || !img.trim()) {
            return `${STATIC_BASE_URL}/products/default-product.png`;
        }
        return img.startsWith("http") ? img : `${STATIC_BASE_URL}/${img.startsWith("/") ? img.slice(1) : img}`;
    };

    return (
        <div className="relative group">
            <div className="relative w-5 h-5 flex items-center justify-center cursor-pointer scale-[0.9]">
                <FaRegBell className="text-black group-hover:text-brand w-5 h-5 transition duration-200" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#DB4444] text-white text-[11px] font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-center leading-none shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </div>

            <div className="absolute top-full mt-2 right-0 w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-300 z-50">
                <div className="px-4 py-2 border-b text-base font-semibold text-black">Thông báo mới nhận</div>

                <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {notifications.map(note => (
                        <li
                            key={note.id}
                            className="relative flex gap-3 p-3 hover:bg-gray-100 transition cursor-pointer"
                            onClick={() => onNotificationClick(note.id, note.link)}
                        >
                            {note.is_read === 0 && (
                                <span className="absolute top-2 left-2 w-2 h-2 bg-[#DB4444] rounded-full"></span>
                            )}
                            <div className="flex justify-center items-center w-[56px] h-[56px] overflow-hidden rounded-md border border-gray-200">
                                <Image
                                    src={formatImageUrl(note.image_url)}
                                    alt={note.title}
                                    width={56}
                                    height={56}
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold ${note.is_read === 0 ? "text-black" : "text-gray-700"}`}>
                                    {note.title}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2">{note.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(note.created_at).toLocaleString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </li>
                    ))}
                    {notifications.length === 0 && (
                        <li className="p-3 text-center text-gray-500">Không có thông báo nào.</li>
                    )}
                </ul>

                <div className="text-center p-2">
                    <button
                        onClick={() => router.push("/account")}
                        className="text-sm text-brand font-medium hover:underline transition"
                    >
                        Xem tất cả
                    </button>
                </div>
            </div>
        </div>
    );
}
