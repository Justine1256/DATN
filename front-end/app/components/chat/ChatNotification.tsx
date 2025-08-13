"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { STATIC_BASE_URL } from "@/utils/api"

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
        <div className="flex-shrink-0">
          <Image
            src={
              message.sender.avatar?.startsWith("http") || message.sender.avatar?.startsWith("/")
                ? message.sender.avatar
                : `${STATIC_BASE_URL}/${message.sender.avatar}`
            }
            alt={message.sender.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 truncate">{message.sender.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-1">
            {message.message && <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>}
            {message.image && (
              <div className="mt-2">
                <img
                  src={`${STATIC_BASE_URL}/${message.image}`}
                  alt="Notification image"
                  className="w-full h-20 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Nhấn để xem tin nhắn</p>
        </div>
      </div>
    </div>
  )
}
