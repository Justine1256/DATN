"use client"

import { X } from "lucide-react"
import Image from "next/image"

interface User {
  id: number
  name: string
  avatar: string | null
  role: string
}

interface NotificationMessage {
  id: number
  sender: User
  message: string | null
  image: string | null
}

interface ChatNotificationProps {
  message: NotificationMessage
  onClose: () => void
  onClick: () => void
}

export default function ChatNotification({ message, onClose, onClick }: ChatNotificationProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow">
      <div className="flex items-start gap-3" onClick={onClick}>
        <Image
          src={message.sender.avatar || "/placeholder.svg?height=40&width=40"}
          alt={message.sender.name}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{message.sender.name}</p>
          <p className="text-sm text-gray-600 truncate">
            {message.message || (message.image ? "Đã gửi một hình ảnh" : "Tin nhắn mới")}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
