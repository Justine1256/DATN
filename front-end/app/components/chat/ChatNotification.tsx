"use client"

import { useEffect, useState } from "react"
import { MessageCircle, X } from "lucide-react"
import Image from "next/image"

interface ChatNotificationProps {
  message: {
    id: number
    sender: {
      id: number
      name: string
      avatar: string | null
    }
    message: string | null
    image: string | null
  }
  onClose: () => void
  onClick: () => void
}

export default function ChatNotification({ message, onClose, onClick }: ChatNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-[10000] bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm transition-all duration-300 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      <div className="flex items-start gap-3">
        <Image
          src={message.sender.avatar || "/avatars/default-avatar.jpg"}
          alt={message.sender.name}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 truncate">{message.sender.name}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {message.message || (message.image ? "📷 Đã gửi một hình ảnh" : "Tin nhắn mới")}
          </p>
          <button
            onClick={onClick}
            className="text-xs text-[#db4444] hover:text-[#c93333] mt-2 flex items-center gap-1"
          >
            <MessageCircle size={12} />
            Trả lời
          </button>
        </div>
      </div>
    </div>
  )
}
