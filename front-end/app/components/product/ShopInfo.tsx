"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, STATIC_BASE_URL, apiRequest } from "@/utils/api"
import Link from "next/link"
import { User, Loader2 } from "lucide-react"
import Cookies from "js-cookie";

interface Shop {
  id: number
  name: string
  description: string
  logo: string | null
  phone: string
  rating: string
  total_sales: number
  created_at: string
  status: "activated" | "pending" | "suspended"
  email: string
  slug: string
  user_id: number
}

interface ShopInfoProps {
  shop: Shop | undefined
  followed: boolean
  onFollowToggle: () => void
  isCheckingFollow: boolean
}

const formatImageUrl = (img: unknown): string => {
  if (Array.isArray(img)) img = img[0]
  if (typeof img !== "string" || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`
  }
  if (img.startsWith("http")) return img
  return img.startsWith("/") ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`
}

export default function ShopInfo({ shop, followed, onFollowToggle, isCheckingFollow }: ShopInfoProps) {
  const [popupText, setPopupText] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const router = useRouter()


  const handleToggleFollow = useCallback(async () => {
    if (!shop?.id) return
    setFollowLoading(true)
    try {
      await onFollowToggle()
      setPopupText(!followed ? "Đã theo dõi shop" : "Đã bỏ theo dõi shop")
      setShowPopup(true)
    } catch (err) {
      setPopupText("Có lỗi xảy ra, vui lòng thử lại")
      setShowPopup(true)
    } finally {
      setFollowLoading(false)
    }
  }, [followed, onFollowToggle, shop?.id])

  const handleOpenChat = () => {
    if (!shop) return
    window.dispatchEvent(
      new CustomEvent("open-chat-box", {
        detail: {
          receiverId: shop.user_id,
          receiverName: shop.name,
          avatar: shop.logo || "",
        },
      }),
    )
  }

  useEffect(() => {
    if (showPopup) {
      const timeout = setTimeout(() => setShowPopup(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [showPopup])

  if (!shop) return <div className="text-gray-500">Shop không tồn tại</div>

  const joinedTime = (() => {
    const createdAt = new Date(shop.created_at)
    const now = new Date()
    const diff = now.getTime() - createdAt.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    if (days <= 1) return "1 ngày"
    if (years >= 1) return `${years} năm`
    if (months >= 1) return `${months} tháng`
    return `${days} ngày`
  })()

  return (
    <div className="mt-12 border rounded-lg bg-white p-4 sm:p-6 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        {/* Left - desktop*/}
        <div className="hidden md:flex gap-4 flex-shrink-0">
          <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden cursor-pointer">
            <Link href={`/shop/${shop.slug}`}>
              <Image
                src={
                  shop.logo
                    ? shop.logo.startsWith("http") || shop.logo.startsWith("/")
                      ? shop.logo
                      : formatImageUrl(shop.logo)
                    : `${STATIC_BASE_URL}/avatars/default-avatar.png`
                }
                alt="Logo"
                width={60}
                height={60}
                className="object-cover w-full h-full"
              />
            </Link>
          </div>

          {/* Info */}
          <div className="text-black max-w-[200px] sm:max-w-none">
            <h3 className="text-xl font-semibold mb-1 flex items-center gap-2 flex-wrap">
              <Link
                href={`/shop/${shop.slug}`}
                className="relative group text-black hover:text-[#DC4B47] transition-colors duration-300"
              >
                <span>{shop.name}</span>
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#DC4B47] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </h3>

            <p
              className={`font-medium text-sm ${shop.status === "activated"
                ? "text-green-600"
                : shop.status === "pending"
                  ? "text-yellow-500"
                  : "text-gray-500"
                }`}
            >
              {shop.status === "activated" && "Đang hoạt động"}
              {shop.status === "pending" && "Đang chờ duyệt"}
              {shop.status === "suspended" && "Tạm khóa"}
            </p>

            <div className="flex flex-wrap gap-2 mt-2">

              {/* Follow Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFollow()
                }}
                disabled={followLoading || isCheckingFollow}
                className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-sm transition w-full sm:w-auto
                      ${followed
                    ? "bg-[#db4444] text-white border-[#db4444] hover:opacity-90"
                    : "bg-white text-[#db4444] border-[#db4444] hover:bg-[#db4444] hover:text-white"
                  }
                   disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {followLoading || isCheckingFollow ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <User size={16} />
                )}
                <span>
                  {isCheckingFollow
                    ? "Kiểm tra..."
                    : followLoading
                      ? "Đang tải..."
                      : followed
                        ? "Đã theo dõi"
                        : "Theo Dõi"}
                </span>
              </button>

              {/* Chat Button */}
              <button
                onClick={handleOpenChat}
                className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg border border-[#db4444] bg-white text-[#db4444] text-sm transition-colors
                           hover:bg-[#db4444] hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 3v18l4-4h14V3H2zm2 2h14v10H6l-2 2V5z" />
                </svg>
                Chat Ngay
              </button>

              {/* View Shop Button */}
              <button
                onClick={() => router.push(`/shop/${shop.slug}`)}
                className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg border border-[#db4444] bg-white text-[#db4444] text-sm transition-colors
                           hover:bg-[#db4444] hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Xem Shop
              </button>
            </div>
          </div>
        </div>

        {/* Left - mobile */}
        <div className="flex flex-col gap-2">
          <div className="flex md:hidden gap-4 flex-shrink-0">
            <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden cursor-pointer">
              <Link href={`/shop/${shop.slug}`}>
                <Image
                  src={
                    shop.logo
                      ? shop.logo.startsWith("http") || shop.logo.startsWith("/")
                        ? shop.logo
                        : formatImageUrl(shop.logo)
                      : `${STATIC_BASE_URL}/avatars/default-avatar.png`
                  }
                  alt="Logo"
                  width={50}
                  height={50}
                  className="object-cover w-full h-full"
                />
              </Link>
            </div>

            {/* Info */}
            <div className="text-black max-w-[200px] sm:max-w-none">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 flex-wrap">
                <Link
                  href={`/shop/${shop.slug}`}
                  className="relative group text-black hover:text-[#DC4B47] transition-colors duration-300"
                >
                  <span>{shop.name}</span>
                </Link>
              </h3>

              <p
                className={`font-medium text-sm ${shop.status === "activated"
                  ? "text-green-600"
                  : shop.status === "pending"
                    ? "text-yellow-500"
                    : "text-gray-500"
                  }`}
              >
                {shop.status === "activated" && "Đang hoạt động"}
                {shop.status === "pending" && "Đang chờ duyệt"}
                {shop.status === "suspended" && "Tạm khóa"}
              </p>
            </div>
          </div>

          {/* action buttons*/}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Follow Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFollow()
              }}
              disabled={followLoading || isCheckingFollow}
              className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-sm transition w-full sm:w-auto
                      ${followed
                  ? "bg-[#db4444] text-white border-[#db4444] hover:opacity-90"
                  : "bg-white text-[#db4444] border-[#db4444] hover:bg-[#db4444] hover:text-white"
                }
                   disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {followLoading || isCheckingFollow ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <User size={16} />
              )}
              <span>
                {isCheckingFollow
                  ? "Kiểm tra..."
                  : followLoading
                    ? "Đang tải..."
                    : followed
                      ? "Đã theo dõi"
                      : "Theo Dõi"}
              </span>
            </button>

            <div className="w-full flex gap-2">
              {/* Chat Button */}
              <button
                onClick={handleOpenChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-1 rounded border border-[#db4444] bg-white text-[#db4444] text-sm transition-colors
                           hover:bg-[#db4444] hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 3v18l4-4h14V3H2zm2 2h14v10H6l-2 2V5z" />
                </svg>
                Chat Ngay
              </button>

              {/* View Shop Button */}
              <button
                onClick={() => router.push(`/shop/${shop.slug}`)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1 rounded border border-[#db4444] bg-white text-[#db4444] text-sm transition-colors
                           hover:bg-[#db4444] hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Xem Shop
              </button>
            </div>
          </div>
        </div>

        {/* Right info */}
        <div className="flex flex-wrap gap-y-2 gap-x-6 md:mt-0 text-sm text-gray-800">
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Đánh Giá:</span>
            <span className="text-red-500 font-semibold">{Number(shop.rating || 0).toFixed(1)}</span>
            <span className="text-yellow-400 text-base">★</span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Sản Phẩm Đã Bán:</span>
            <span className="text-red-500 font-semibold">{shop.total_sales}</span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Phản Hồi:</span>
            <span className="text-red-500 font-semibold">Trong vài giờ</span>
          </div>
          <div className="flex items-center gap-1 min-w-[130px]">
            <span className="text-gray-500">Tham Gia:</span>
            <span className="text-red-500 font-semibold">{joinedTime}</span>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
          {popupText}
        </div>
      )}
    </div>
  )
}
