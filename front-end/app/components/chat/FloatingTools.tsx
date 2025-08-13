"use client"

import type React from "react"
import { useCallback, useEffect, useState, useRef } from "react"
import { MessageCircle, X, Plus, Send, Phone, Video, MoreVertical } from "lucide-react"
import Image from "next/image"
import axios from "axios"
import Cookies from "js-cookie"
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"
import ChatNotification from "./ChatNotification"
import { usePusherChat } from "@/app/hooks/usePusherChat"

interface User {
  id: number
  name: string
  avatar: string | null
  role: string
  last_message?: string
  last_time?: string
  online?: boolean
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string | null
  image: string | null
  created_at: string
  sender: User
  receiver: User
}

interface NotificationMessage {
  id: number
  sender: User
  message: string | null
  image: string | null
}

interface ChatSocketData {
  type: string
  message?: Message
  user_id?: number
  is_typing?: boolean
  shouldRefreshContacts?: boolean
}

export default function EnhancedChatTools() {
  const [showList, setShowList] = useState(false)
  const [activeChat, setActiveChat] = useState(false)
  const [receiver, setReceiver] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [recentContacts, setRecentContacts] = useState<User[]>([])
  const [input, setInput] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationMessage[]>([])
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [isReceiverTyping, setIsReceiverTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "connecting",
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (showList) fetchRecentContacts()
  }, [showList])

  useEffect(() => {
    if (activeChat && mounted && receiver?.id) {
      fetchMessages()
    }
  }, [activeChat, mounted, receiver?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    console.log("🔍 Checking authentication...")
    const token = localStorage.getItem("token") || Cookies.get("authToken")
    console.log("🔑 Token found:", token ? "Yes" : "No")

    if (token) {
      setToken(token)
      console.log("📡 Fetching user data...")
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("✅ User data loaded:", res.data)
          setCurrentUser(res.data)
        })
        .catch((err) => {
          console.error("❌ Lỗi auth:", err)
          if (axios.isAxiosError(err)) {
            console.error("📊 Auth error status:", err.response?.status)
            console.error("📄 Auth error data:", err.response?.data)
          }
        })
    } else {
      console.log("⚠️ No token found - user needs to login")
    }
  }, [])

  const fetchRecentContacts = useCallback(async () => {
    const token = localStorage.getItem("token") || Cookies.get("authToken")
    if (!token) return

    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRecentContacts(res.data)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đã nhắn:", err)
    }
  }, [])

  const handleSocketData = useCallback(
    (data: ChatSocketData) => {
      console.log("📨 Socket data received:", data)

      if (data.type === "message" && data.message) {
        console.log("💬 New message:", data.message)

        // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện hiện tại không
        const isCurrentConversation =
          activeChat &&
          receiver?.id &&
          (data.message.sender_id === receiver.id ||
            data.message.receiver_id === receiver.id ||
            data.message.sender_id === currentUser?.id ||
            data.message.receiver_id === currentUser?.id)

        // Nếu đang trong cuộc trò chuyện liên quan, thêm tin nhắn vào messages
        if (isCurrentConversation) {
          setMessages((prev) => {
            // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
            const messageExists = prev.some((msg) => msg.id === data.message!.id)
            if (messageExists) {
              console.log("📝 Message already exists, skipping...")
              return prev
            }
            console.log("📝 Adding message to current conversation")
            return [...prev, data.message!]
          })
        }

        // Nếu tin nhắn không phải từ user hiện tại và không đang trong chat đó, tạo notification
        if (data.message.sender_id !== currentUser?.id && (!activeChat || receiver?.id !== data.message.sender_id)) {
          setNotifications((prev) => [
            ...prev,
            {
              id: data.message!.id,
              sender: data.message!.sender,
              message: data.message!.message,
              image: data.message!.image,
            },
          ])
          setUnreadCount((prev) => prev + 1)
        }

        // Luôn refresh recent contacts khi có tin nhắn mới
        if (data.shouldRefreshContacts) {
          console.log("🔄 Refreshing recent contacts...")
          fetchRecentContacts()
        }
      } else if (data.type === "typing") {
        console.log("⌨️ Typing event received:", data, "Current user:", currentUser?.id)
        if (data.user_id !== currentUser?.id) {
          setIsReceiverTyping(data.is_typing!)
          if (data.is_typing!) {
            setTimeout(() => setIsReceiverTyping(false), 3000)
          }
        }
      }
    },
    [currentUser?.id, activeChat, receiver?.id, fetchRecentContacts],
  )

  const handleConnectionStatus = useCallback((status: "connecting" | "connected" | "disconnected" | "error") => {
    console.log("🔌 Connection status changed:", status)
    setConnectionStatus(status)
  }, [])

  const { sendTypingEvent } = usePusherChat(
    currentUser?.id,
    token || "",
    receiver?.id,
    handleSocketData,
    handleConnectionStatus,
  )

  const fetchMessages = async () => {
    if (!receiver?.id) return
    const token = localStorage.getItem("token") || Cookies.get("authToken")
    if (!token) return

    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { user_id: receiver.id },
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(
        res.data.sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      )
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    console.log("🚀 sendMessage called")
    console.log("📝 Input:", input)
    console.log("👤 Receiver:", receiver)
    console.log("🖼️ Images:", images.length)

    if (!receiver?.id || (!input.trim() && images.length === 0)) {
      console.log("❌ Validation failed:")
      console.log("  - Receiver ID:", receiver?.id)
      console.log("  - Input trim:", input.trim())
      console.log("  - Images length:", images.length)
      return
    }

    const token = localStorage.getItem("token") || Cookies.get("authToken")
    console.log("🔑 Token:", token ? "Found" : "Not found")
    if (!token) {
      console.log("❌ No authentication token found")
      return
    }

    console.log("📤 Sending message to API...")
    setLoading(true)

    const formData = new FormData()
    formData.append("receiver_id", receiver.id.toString())
    formData.append("message", input)
    if (images.length > 0) {
      formData.append("image", images[0])
    }

    console.log("🌐 API URL:", `${API_BASE_URL}/messages`)
    console.log("📋 FormData contents:")
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value)
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("✅ Message sent successfully:", res.data)

      // Điều này giúp UI phản hồi nhanh hơn
      const newMessage = res.data
      if (newMessage && newMessage.id) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === newMessage.id)
          if (!messageExists) {
            return [...prev, newMessage]
          }
          return prev
        })
      }

      setInput("")
      setImages([])
      setImagePreviews([])

      // Refresh recent contacts sau khi gửi tin nhắn
      fetchRecentContacts()
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error)
      if (axios.isAxiosError(error)) {
        console.error("📊 Response status:", error.response?.status)
        console.error("📄 Response data:", error.response?.data)
        console.error("🔗 Request URL:", error.config?.url)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Handle typing indicator for current user
    setIsUserTyping(true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (sendTypingEvent) {
      console.log("⌨️ Sending typing start event")
      sendTypingEvent(true, receiver?.id)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false)
      // Send stop typing event
      if (sendTypingEvent) {
        console.log("⌨️ Sending typing stop event")
        sendTypingEvent(false, receiver?.id)
      }
    }, 1000)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImages((prev) => [...prev, ...files])
      setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    }
  }

  const handleRemoveImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const formatTime = (dateStr: string) =>
    mounted
      ? new Date(dateStr).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : ""

  const handleNotificationClick = (notification: NotificationMessage) => {
    setReceiver({
      id: notification.sender.id,
      name: notification.sender.name,
      avatar: notification.sender.avatar,
      role: notification.sender.role,
    })
    setShowList(true)
    setActiveChat(true)
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const removeNotification = (notificationId: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  useEffect(() => {
    const handleOpenChatBox = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && detail.receiverId) {
        const { receiverId, receiverName, avatar, role } = detail
        setReceiver({
          id: receiverId,
          name: receiverName,
          avatar,
          role,
        })
        setShowList(true)
        setActiveChat(true)
      }
    }

    window.addEventListener("open-chat-box", handleOpenChatBox)
    return () => {
      window.removeEventListener("open-chat-box", handleOpenChatBox)
    }
  }, [])

  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map((notification) => (
          <ChatNotification
            key={notification.id}
            message={notification}
            onClose={() => removeNotification(notification.id)}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>

      {/* Floating Chat Button */}
      <div className="fixed right-4 bottom-4 z-[9999]">
        <button
          onClick={() => {
            setShowList(!showList)
            setActiveChat(false)
            if (showList) {
              setUnreadCount(0)
            }
          }}
          className="relative w-12 h-12 bg-[#db4444] hover:bg-[#c93333] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {showList && (
        <div className="fixed bottom-4 right-20 z-[9998] bg-white border rounded-lg shadow-xl w-[700px] h-[600px] flex">
          {/* Contact List */}
          <div className="w-[280px] border-r overflow-y-auto bg-gray-50">
            <div className="font-bold px-4 py-3 bg-[#db4444] text-white flex items-center justify-between">
              <span>Liên hệ gần đây</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{recentContacts.length}</span>
            </div>
            {recentContacts.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setReceiver(user)
                  setActiveChat(true)
                }}
                className={`flex items-center gap-3 px-3 py-3 hover:bg-white cursor-pointer border-b transition-colors ${
                  receiver?.id === user.id ? "bg-white border-l-4 border-l-[#db4444]" : ""
                }`}
              >
                <div className="relative">
                  <Image
                    src={
                      user.avatar?.startsWith("http") || user.avatar?.startsWith("/")
                        ? user.avatar
                        : `${STATIC_BASE_URL}/${user.avatar}`
                    }
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10"
                  />
                  {user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.last_message || "Chưa có tin nhắn"}</p>
                  {user.last_time && <p className="text-xs text-gray-400">{formatTime(user.last_time)}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-[#db4444] text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={
                      receiver?.avatar
                        ? receiver.avatar.startsWith("http") || receiver.avatar.startsWith("/")
                          ? receiver.avatar
                          : `${STATIC_BASE_URL}/${receiver.avatar}`
                        : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                    }
                    alt="avatar"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  {receiver?.online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{receiver?.name || "Chưa chọn người"}</p>
                  <p className="text-xs opacity-90">
                    {connectionStatus === "connected"
                      ? isReceiverTyping
                        ? `${receiver?.name} đang nhập...`
                        : "Đang hoạt động"
                      : connectionStatus === "connecting"
                        ? "Đang kết nối WebSocket..."
                        : connectionStatus === "error"
                          ? "Lỗi WebSocket - chỉ dùng API"
                          : "WebSocket mất kết nối"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-white/10 rounded">
                  <Phone size={16} />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded">
                  <Video size={16} />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded">
                  <MoreVertical size={16} />
                </button>
                <button onClick={() => setShowList(false)} className="p-1.5 hover:bg-white/10 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Connection Status Display */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 px-4 py-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                }`}
              />
              <span>
                {connectionStatus === "connected"
                  ? "WebSocket đã kết nối"
                  : connectionStatus === "connecting"
                    ? "Đang kết nối WebSocket..."
                    : connectionStatus === "error"
                      ? "Lỗi WebSocket - chỉ dùng API"
                      : "WebSocket mất kết nối"}
              </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {!receiver?.id ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle size={48} className="mb-4 opacity-50" />
                  <p className="text-center">Chọn người để bắt đầu trò chuyện</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-b-2 border-[#db4444] rounded-full"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle size={48} className="mb-4 opacity-50" />
                  <p className="text-center">Chưa có tin nhắn nào</p>
                  <p className="text-xs text-center mt-2">Hãy gửi tin nhắn đầu tiên!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.sender_id === currentUser?.id

                  let avatarUrl = "/placeholder.svg?height=32&width=32"
                  let userName = "User"

                  if (isCurrentUser) {
                    if (currentUser?.avatar) {
                      avatarUrl =
                        currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/")
                          ? currentUser.avatar
                          : `${STATIC_BASE_URL}/${currentUser.avatar}`
                    }
                    userName = currentUser?.name || "You"
                  } else {
                    if (receiver?.avatar) {
                      avatarUrl =
                        receiver.avatar.startsWith("http") || receiver.avatar.startsWith("/")
                          ? receiver.avatar
                          : `${STATIC_BASE_URL}/${receiver.avatar}`
                    }
                    userName = receiver?.name || "User"
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && (
                        <img
                          src={avatarUrl || "/placeholder.svg"}
                          alt={userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className={`max-w-[70%] ${isCurrentUser ? "order-first" : ""}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentUser
                              ? "bg-blue-500 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          {msg.message && <p className="text-sm break-words">{msg.message}</p>}
                          {msg.image && (
                            <img
                              src={`${STATIC_BASE_URL}/${msg.image}`}
                              alt="Sent image"
                              className="mt-2 max-w-full rounded-lg cursor-pointer"
                              onClick={() => window.open(`${STATIC_BASE_URL}/${msg.image}`, "_blank")}
                            />
                          )}
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                          {isCurrentUser ? "Bạn" : userName} •{" "}
                          {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {isCurrentUser && (
                        <img
                          src={avatarUrl || "/placeholder.svg"}
                          alt={userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                    </div>
                  )
                })
              )}
              {isReceiverTyping && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span>{receiver?.name} đang nhập...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreviews.length > 0 && (
              <div className="px-4 py-2 bg-gray-100 border-t">
                <div className="flex gap-2 overflow-x-auto">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={src || "/placeholder.svg"}
                        alt="preview"
                        width={64}
                        height={64}
                        className="rounded-lg object-cover w-full h-full"
                      />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent resize-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && images.length === 0) || loading || !receiver?.id}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    (!input.trim() && images.length === 0) || loading || !receiver?.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#db4444] text-white hover:bg-[#c93333] hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-b-2 border-white rounded-full" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
