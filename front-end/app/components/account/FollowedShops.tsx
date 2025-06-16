"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import FollowedShopLoading from "../loading/loading";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import Image from "next/image";

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
                setTimeout(() => setShowPopup(false), 3000);
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
        <div className="w-full max-w-[1400px] mx-auto px-6 mt-24">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-[#DB4444] to-[#ff6b6b] rounded-full"></div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#DB4444] to-[#ff6b6b] bg-clip-text text-transparent">
                        Danh sách shop theo dõi
                    </h2>
                </div>
                <p className="text-gray-600 ml-4">
                    Quản lý và theo dõi các shop yêu thích của bạn
                </p>
            </div>

            <section className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm">
                {loading ? (
                    <FollowedShopLoading />
                ) : shops.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Chưa có shop nào
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                            Bạn chưa theo dõi shop nào. Hãy khám phá và theo dõi những shop yêu thích để cập nhật sản phẩm mới nhất!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Shop Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                            {paginatedShops.map((shop) => (
                                <div
                                    key={shop.id}
                                    className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#DB4444]/20 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 pb-4">
                                        <div
                                            onClick={() => router.push(`/shop/${shop.slug}`)}
                                            className="cursor-pointer flex items-start gap-4 group-hover:transform group-hover:scale-[1.02] transition-transform duration-200"
                                        >
                                            {/* Avatar với border gradient */}
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-200 group-hover:border-[#DB4444]/30 transition-colors duration-300 bg-gradient-to-br from-gray-50 to-gray-100">
                                                    <Image
                                                        src={
                                                            shop.logo?.startsWith("http")
                                                                ? shop.logo
                                                                : shop.logo
                                                                    ? `${STATIC_BASE_URL}/${shop.logo}`
                                                                    : "/default-avatar.png"
                                                        }
                                                        alt={shop.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                </div>
                                                {/* Verified Badge */}
                                                {shop.is_verified && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#DB4444] rounded-full flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 truncate mb-1 group-hover:text-[#DB4444] transition-colors duration-200">
                                                    {shop.name}
                                                </h3>

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${shop.status === "activated"
                                                            ? "bg-green-100 text-green-700 border border-green-200"
                                                            : shop.status === "pending"
                                                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                                : "bg-gray-100 text-gray-600 border border-gray-200"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-1.5 h-1.5 rounded-full mr-2 ${shop.status === "activated"
                                                                ? "bg-green-500"
                                                                : shop.status === "pending"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-gray-400"
                                                                }`}
                                                        ></div>
                                                        {shop.status === "activated"
                                                            ? "Đang hoạt động"
                                                            : shop.status === "pending"
                                                                ? "Chờ duyệt"
                                                                : "Tạm khóa"}
                                                    </span>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                                                        </svg>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {shop.rating !== null && shop.rating !== undefined ? Number(shop.rating).toFixed(1) : "N/A"}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">Đánh giá</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-6 pb-6">
                                        <button
                                            onClick={() => handleUnfollow(shop.id)}
                                            disabled={unfollowing === shop.id}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#DB4444] text-[#DB4444] font-medium transition-all duration-200 hover:bg-[#DB4444] hover:text-white hover:shadow-lg hover:shadow-[#DB4444]/25 disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {unfollowing === shop.id ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Đang hủy...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Hủy theo dõi</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Hover Effect Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#DB4444]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:border-[#DB4444] hover:text-[#DB4444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${page === currentPage
                                            ? "bg-[#DB4444] text-white shadow-lg shadow-[#DB4444]/25"
                                            : "bg-white text-gray-700 border border-gray-300 hover:border-[#DB4444] hover:text-[#DB4444]"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:border-[#DB4444] hover:text-[#DB4444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Success Popup */}
                {showPopup && (
                    <div className="fixed top-8 right-8 z-[9999] max-w-sm">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 transform animate-slideInFade">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{popupText}</p>
                                    <p className="text-sm text-gray-500">Thao tác thành công</p>
                                </div>
                            </div>
                            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#DB4444] to-[#ff6b6b] rounded-t-2xl animate-[shrink_3s_linear]"></div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}