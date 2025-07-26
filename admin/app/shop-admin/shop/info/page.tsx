"use client"
import { useEffect, useState } from "react"
import { Phone, Package, Calendar, Users, MessageCircle, Star, MapPin, Award, TrendingUp } from "lucide-react"
import Image from "next/image"
import { API_BASE_URL } from "@/utils/api"
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

// Định nghĩa kiểu dữ liệu của Shop
interface Shop {
    id: number
    name: string
    description: string
    logo: string
    phone: string
    rating: string
    total_sales: number
    created_at: string
    status: "activated" | "pending" | "suspended"
    email: string
    followers_count: number
}

const ShopCard = () => {
    const [shop, setShop] = useState<Shop | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                const token = Cookies.get("authToken")
                if (!token) {
                    setError("Vui lòng đăng nhập để lấy thông tin cửa hàng")
                    return
                }
                const response = await fetch(`${API_BASE_URL}/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (!response.ok) {
                    setError("Không thể lấy thông tin cửa hàng.")
                    return
                }
                const data = await response.json()
                setShop(data.shop)
            } catch (error) {
                setError("Có lỗi xảy ra khi tải dữ liệu cửa hàng.")
                console.error("Lỗi:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchShopData()
    }, [])

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <div className="text-red-600 font-medium">{error}</div>
            </div>
        )
    }

    if (isLoading || !shop) {
        return (
            <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Loading Cover */}
                <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>

                {/* Loading Content */}
                <div className="p-8">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-8 bg-gray-300 rounded-lg mb-3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-4">
                                <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
            {/* Cover Photo with Gradient Overlay */}
            <div className="relative h-48 overflow-hidden">
                <Image
                    src="/shop_cover.jpg"
                    alt="Shop Cover"
                    width={1200}
                    height={192}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                    <div
                        className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${shop.status === "activated" ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white"
                            }`}
                    >
                        {shop.status === "activated" ? "✓ Đã kích hoạt" : "⏳ Chưa kích hoạt"}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
                {/* Shop Header */}
                <div className="flex items-center gap-6 mb-8">
                    {/* Shop Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Image
                                src={`${API_BASE_URL}/image/${shop.logo}`}
                                alt="Shop Logo"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#db4444] rounded-full flex items-center justify-center shadow-lg">
                            <Award className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Shop Name & Description */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
                        <p className="text-gray-600 leading-relaxed">{shop.description}</p>
                    </div>
                </div>

                {/* Stats Grid - 12 Column Layout */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Phone */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-blue-600 font-medium mb-1">Điện thoại</div>
                                    <div className="text-lg font-bold text-gray-900">{shop.phone}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Sales */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-green-600 font-medium mb-1">Đã bán</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {shop.total_sales == null || shop.total_sales === 0
                                            ? "0 sản phẩm"
                                            : `${shop.total_sales.toLocaleString()} sản phẩm`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Star className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-yellow-600 font-medium mb-1">Đánh giá</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {shop.rating == null || shop.rating === "0.0" ? "Chưa có" : `${shop.rating} ⭐`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Join Date */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-purple-600 font-medium mb-1">Tham gia</div>
                                    <div className="text-lg font-bold text-gray-900">{formatTimeAgo(shop.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Followers */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-pink-600 font-medium mb-1">Người theo dõi</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {shop.followers_count == null || shop.followers_count === 0
                                            ? "0 người"
                                            : `${shop.followers_count.toLocaleString()} người`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="bg-gradient-to-br from-[#db4444]/10 to-[#db4444]/20 rounded-xl p-6 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#db4444] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-[#db4444] font-medium mb-1">Email</div>
                                    <div className="text-lg font-bold text-gray-900 truncate">{shop.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4">
                        <button className="flex-1 min-w-[200px] bg-gradient-to-r from-[#db4444] to-[#c73e3e] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#c73e3e] hover:to-[#b83838] transition-all duration-300 transform hover:scale-105 shadow-lg">
                            <TrendingUp className="w-5 h-5 inline mr-2" />
                            Xem thống kê
                        </button>
                        <button className="flex-1 min-w-[200px] bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-[#db4444] hover:text-[#db4444] transition-all duration-300 transform hover:scale-105">
                            <MapPin className="w-5 h-5 inline mr-2" />
                            Cập nhật thông tin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShopCard
