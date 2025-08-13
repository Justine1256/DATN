"use client"

import { useEffect, useState } from "react"
import { X, MessageCircle } from "lucide-react"
import Image from "next/image"
import { STATIC_BASE_URL } from "@/utils/api"

interface User {
  id: number
  name: string
  avatar?: string
  role?: string
}

interface NotificationMessage {
  id: number
  sender: User
  message: string
  image?: string | null
}

interface ChatNotificationProps {
  message: NotificationMessage
  onClose: () => void
  onClick: () => void
}

export default function ChatNotification({ message, onClose, onClick }: ChatNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)

    // Auto close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoCloseTimer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const handleClick = () => {
    onClick()
    handleClose()
  }

  const avatarUrl =
    message.sender.avatar?.startsWith("http") || message.sender.avatar?.startsWith("/")
      ? message.sender.avatar
      : message.sender.avatar
        ? `${STATIC_BASE_URL}/${message.sender.avatar}`
        : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer
        transform transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        hover:shadow-xl hover:scale-105
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Image
            src={avatarUrl || "/placeholder.svg"}
            alt={message.sender.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#db4444] rounded-full flex items-center justify-center">
            <MessageCircle size={10} className="text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{message.sender.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {message.message && <p className="truncate">{message.message}</p>}
            {message.image && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">📷 Đã gửi hình ảnh</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-1">Nhấn để xem tin nhắn</p>
        </div>
      </div>
    </div>
  )
}
