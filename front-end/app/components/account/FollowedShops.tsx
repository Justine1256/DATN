"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import FollowedShopLoading from "../loading/loading";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

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

    const shopsPerPage = 6;
    const totalPages = Math.ceil(shops.length / shopsPerPage);
    const paginatedShops = shops.slice(
        (currentPage - 1) * shopsPerPage,
        currentPage * shopsPerPage
    );

    // ✅ Lấy danh sách shop đã theo dõi
    useEffect(() => {
        const fetchFollowedShops = async () => {
            const token = Cookies.get("authToken");
            if (!token) return;

            try {
                const res = await axios.get(`${API_BASE_URL}/my/followed-shops`, {
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

    // ✅ Hủy theo dõi
    const handleUnfollow = async (shopId: number) => {
        const token = Cookies.get("authToken");
        if (!token) return;

        setUnfollowing(shopId);
        try {
            const res = await fetch(`${API_BASE_URL}/shops/${shopId}/unfollow`, {
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
        <div className="w-full max-w-[1200px] mx-auto px-4 mt-20">
            <section className="p-4 bg-white rounded-xl shadow-md">
                <h2 className="text-[1.25rem] font-semibold text-red-500 mb-6">
                    Danh sách shop theo dõi
                </h2>

                {loading ? (
                    <FollowedShopLoading />
                ) : shops.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">
                        Bạn chưa theo dõi shop nào.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paginatedShops.map((shop) => (
                                <div
                                    key={shop.id}
                                    className="flex flex-col justify-between border rounded-xl bg-white shadow hover:shadow-md transition p-4 min-h-[200px]"
                                >
                                    <div
                                        onClick={() => router.push(`/shop/${shop.slug}`)}
                                        className="cursor-pointer flex items-start gap-4"
                                    >
                                        {/* ✅ Avatar nhỏ lại */}
                                        <div className="w-12 h-12 rounded-full overflow-hidden border shrink-0 bg-white">
                                            <img
                                                src={
                                                    shop.logo?.startsWith("http")
                                                        ? shop.logo
                                                        : shop.logo
                                                            ? `${STATIC_BASE_URL}/${shop.logo}`
                                                            : "/default-avatar.png"
                                                }

                                                
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-black truncate max-w-[180px]">
                                                {shop.name}
                                            </h3>
                                            <p
                                                className={`text-xs mt-1 font-medium ${shop.status === "activated"
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
                                            </p>

                                            <div className="text-xs text-yellow-600 flex items-center gap-1 mt-2">
                                                <span>Đánh giá:</span>
                                                <span className="font-semibold">
                                                    {shop.rating ?? "Chưa có"}
                                                </span>
                                                <span>⭐</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUnfollow(shop.id)}
                                        disabled={unfollowing === shop.id}
                                        className="mt-4 text-sm px-4 py-2 rounded-md border border-red-500 text-red-500 transition hover:bg-[#DB4444] hover:text-white disabled:opacity-60"
                                    >
                                        {unfollowing === shop.id ? "Đang hủy..." : "Hủy theo dõi"}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Phân trang */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8 text-sm">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                    (page) => (
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
                                    )
                                )}
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
