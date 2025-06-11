"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import FollowedShopLoading from "../loading/loading";
// ✅ Interface cho đối tượng Shop
interface Shop {
    id: number;
    name: string;
    description: string;
    logo?: string;
    slug: string;
    rating?: number;
    is_verified?: boolean;
    status: "activated" | "pending" | "suspended";
}

export default function FollowedShopsSection() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [unfollowing, setUnfollowing] = useState<number | null>(null);
    const [popupText, setPopupText] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const router = useRouter();

    // ✅ Phân trang - chia mỗi trang 6 shop
    const shopsPerPage = 6;
    const totalPages = Math.ceil(shops.length / shopsPerPage);
    const paginatedShops = shops.slice(
        (currentPage - 1) * shopsPerPage,
        currentPage * shopsPerPage
    );

    // ✅ Gọi API lấy danh sách shop đã theo dõi
    useEffect(() => {
        const fetchFollowedShops = async () => {
            const token = Cookies.get("authToken");
            if (!token) return;

            try {
                const res = await axios.get("http://localhost:8000/api/my/followed-shops", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setShops(res.data.shops || []);
            } catch (err) {
                console.error("❌ Lỗi khi lấy danh sách shop:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowedShops();
    }, []);

    // ✅ Hủy theo dõi shop
    const handleUnfollow = async (shopId: number) => {
        const token = Cookies.get("authToken");
        if (!token) return;

        setUnfollowing(shopId);
        try {
            const res = await fetch(`http://localhost:8000/api/shops/${shopId}/unfollow`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                setShops((prev) => prev.filter((s) => s.id !== shopId));
                setPopupText("Đã hủy theo dõi shop");
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 2000);
            } else {
                console.error("❌ Hủy theo dõi thất bại");
            }
        } catch (err) {
            console.error("❌ Lỗi gửi yêu cầu hủy theo dõi:", err);
        } finally {
            setUnfollowing(null);
        }
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto mt-10 px-4">
            <section className="p-4 bg-white rounded-xl shadow-md">
                <h2 className="text-[1.25rem] font-semibold text-red-500 text-center mb-6">
                    My Followed Shops
                </h2>

                {loading ? (
                    <FollowedShopLoading />
                ) : shops.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">
                        Bạn chưa theo dõi shop nào.
                    </p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-4 justify-start">
                            {paginatedShops.map((shop) => (
                                <div
                                    key={shop.id}
                                    className="w-full sm:w-[calc(50%-0.5rem)] border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[180px]"
                                >
                                    <div
                                        onClick={() => router.push(`/shop/${shop.slug}`)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={shop.logo || "/default-avatar.png"}
                                                alt={shop.name}
                                                className="w-14 h-14 rounded-full object-cover border"
                                            />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col">
                                                    <h3 className="text-base font-semibold text-black truncate whitespace-nowrap">
                                                        {shop.name}
                                                    </h3>
                                                    <span
                                                        className={`text-xs mt-1 ${shop.status === "activated"
                                                            ? "text-green-600"
                                                            : shop.status === "pending"
                                                                ? "text-yellow-500"
                                                                : "text-gray-400"
                                                            }`}
                                                    >
                                                        {shop.status === "activated"
                                                            ? "Đang hoạt động"
                                                            : shop.status === "pending"
                                                                ? "Chờ duyệt"
                                                                : "Tạm khóa"}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-yellow-600 flex items-center gap-1 whitespace-nowrap mt-[2px]">
                                                    <span>Đánh giá:</span>
                                                    <span className="font-medium">
                                                        {shop.rating ?? "Chưa có"}
                                                    </span>
                                                    <span>⭐</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {shop.description}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleUnfollow(shop.id)}
                                        disabled={unfollowing === shop.id}
                                        className="mt-4 text-sm px-4 py-1 rounded border border-red-500 text-red-500 transition hover:bg-[#DB4444] hover:text-white disabled:opacity-60"
                                    >
                                        {unfollowing === shop.id ? "Đang hủy..." : "Hủy theo dõi"}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Phân trang */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8 text-sm">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded border ${page === currentPage
                                            ? "bg-red-500 text-white border-red-500"
                                            : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ✅ Popup thông báo */}
                {showPopup && (
                    <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#DB4444] animate-slideInFade">
                        {popupText}
                    </div>
                )}
            </section>
        </div>
    );
}
