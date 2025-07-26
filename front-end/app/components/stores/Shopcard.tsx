"use client"
import { useState } from "react"
import { User, MessageCircle, Star, Phone, Package, Calendar, Users, Mail, Verified } from "lucide-react"
import Image from "next/image"
import { API_BASE_URL } from "@/utils/api"
import ShopProductSlider from "../home/ShopProduct"
import Cookies from "js-cookie"

// Helper function để định dạng thời gian
const formatTimeAgo = (dateString: string): string => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) {
        return "Vừa xong"
    }
    if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`
    }
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours} giờ trước`
    }
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
        return `${diffInDays} ngày trước`
    }
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
        return `${diffInMonths} tháng trước`
    }
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} năm trước`
}

interface Shop {
    id: number
    name: string
    description: string
    logo: string
    phone: string
    rating: string | null
    total_sales: number
    created_at: string
    status: "activated" | "pending" | "suspended"
    email: string
    slug: string
    followers_count: number
}

const ShopCard = ({ shop }: { shop: Shop }) => {
    const [followed, setFollowed] = useState(false)

    const handleFollow = async () => {
        const token = Cookies.get("authToken") || localStorage.getItem("token")
        if (!token) return commonPopup("Vui lòng đăng nhập để theo dõi cửa hàng")
        const url = `${API_BASE_URL}/shops/${shop.id}/${followed ? "unfollow" : "follow"}`
        await fetch(url, {
            method: followed ? "DELETE" : "POST",
            headers: { Authorization: `Bearer ${token}` },
        })
        setFollowed(!followed)
    }

    const commonPopup = (msg: string) => {
        alert(msg) // Simple popup (can be customized)
    }

    return (
        <div className="bg-white py-4">
            {/* Main Shop Card Container - Smaller size */}
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100">
                    {/* Cover photo - Reduced height */}
                    <div className="relative h-36 overflow-hidden">
                        <Image
                            src="/shop_cover.jpg"
                            alt="Shop Cover"
                            width={1200}
                            height={144}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Shop Avatar - Smaller and positioned higher */}
                    <div className="absolute left-6 top-24 z-20">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-white bg-white">
                                <Image
                                    src={`${API_BASE_URL}/image/${shop.logo}`}
                                    alt="Shop Logo"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Verified Badge */}
                            {shop.status === "activated" && (
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                    <Verified className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content - Reduced padding */}
                    <div className="pt-16 pb-6 px-6">
                        {/* Header Section with Shop Name moved right */}
                        <div className="flex items-start justify-between ">
                            <div className="flex-1 ml-32">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-light text-gray-900 tracking-wide">{shop.name}</h1>
                                    <div
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${shop.status === "activated"
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            }`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full ${shop.status === "activated" ? "bg-green-500" : "bg-yellow-500"}`}
                                        ></div>
                                        {shop.status === "activated" ? "Đã kích hoạt" : "Chưa kích hoạt"}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Smaller */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleFollow}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border text-sm ${followed
                                            ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                            : "bg-[#db4444] text-white border-[#db4444] hover:bg-[#c73e3e]"
                                        }`}
                                >
                                    <User className="w-4 h-4" />
                                    <span>{followed ? "Đã theo dõi" : "Theo Dõi"}</span>
                                </button>

                                <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#db4444] border border-[#db4444] rounded-lg hover:bg-[#db4444] hover:text-white transition-all duration-200 font-medium text-sm">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Chat</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid - Smaller cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Phone */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Phone className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Điện thoại</div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">{shop.phone}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Sales */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Đã bán</div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">
                                            {shop.total_sales == null || shop.total_sales === 0
                                                ? "Chưa có"
                                                : shop.total_sales.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                        <Star className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Đánh giá</div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">
                                            {shop.rating == null || shop.rating === "0.0" ? "Chưa có" : `${shop.rating} ⭐`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Join Date */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Tham gia</div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">{formatTimeAgo(shop.created_at)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Followers */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                            Người theo dõi
                                        </div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">
                                            {shop.followers_count == null || shop.followers_count === 0
                                                ? "Chưa có"
                                                : shop.followers_count.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="group">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all duration-300">
                                    <div className="w-10 h-10 bg-[#db4444] rounded-lg flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Email</div>
                                        <div className="font-semibold text-gray-900 text-sm truncate">{shop.email}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Products Section */}
            {shop.slug && (
                <div className="max-w-5xl mx-auto mt-6">
                    <ShopProductSlider shopSlug={shop.slug} />
                </div>
            )}
        </div>
    )
}

export default ShopCard
