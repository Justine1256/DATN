"use client"

import type React from "react"
import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import { MessageCircle, X, Plus, Send, MoreVertical, Bot } from "lucide-react"
import Image from "next/image"
import axios from "axios"
import Cookies from "js-cookie"
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"
import ChatNotification from "./ChatNotification"
import { usePusherChat } from "@/app/hooks/usePusherChat"

// ===== Type fixes & extensions =====
interface User {
  id: number
  name: string
  avatar?: string | null
  role?: string
  online?: boolean
  last_message?: string
  last_time?: string
  isBot?: boolean
  email?: string
  // optional fields that appeared in fallbacks
  phone?: string | null
  address?: string | null
  created_at?: string
  updated_at?: string
}

interface ChatbotResponse {
  message: string
  reply: string
  products?: Array<{
    id: number
    name: string
    price: string
    similarity: number
    slug: string
    image: string[]
    shop: {
      id: number
      name: string
      slug: string
      logo: string
    }
  }>
}

interface Message {
  id: string | number
  sender_id: number
  receiver_id: number
  message: string
  image?: string | null
  created_at: string
  sender: User
  receiver: User
  products?: Array<{
    id: number
    name: string
    price: string
    slug: string
    image: string[]
    similarity: number
    shop: {
      id: number
      name: string
      slug: string
      logo: string
    }
  }>
}

interface NotificationMessage {
  id: number
  sender: User
  message: string
  
  image?: string | null
}

interface ChatSocketData {
  type: "message" | "typing"
  message?: Message
  user_id?: number
  is_typing?: boolean
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const myId = useMemo(() => Number(currentUser?.id ?? -999), [currentUser])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [contactQuery, setContactQuery] = useState("")
  const stickToBottomRef = useRef(true)
  const [isTyping, setIsTyping] = useState(false)
  // gần các useState khác
  const [isBotTyping, setIsBotTyping] = useState(false)

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }

  // remove diacritics + lowercase
  const normalize = (s: string | undefined) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

  const filteredContacts = useMemo(() => {
    const q = normalize(contactQuery)
    if (!q) return recentContacts
    const tokens = q.split(/\s+/).filter(Boolean)
    return recentContacts.filter((u) => {
      const combined = `${normalize(u?.name)} ${normalize(u?.last_message)}`
      return tokens.every((t) => combined.includes(t))
    })
  }, [contactQuery, recentContacts])

  // helper to resolve image URLs consistently
  const resolveImageUrl = (img?: string | null) => {
    if (!img) return null
    if (img.startsWith("blob:") || img.startsWith("data:") || img.startsWith("http") || img.startsWith("/")) return img
    return `${STATIC_BASE_URL}/${img}`
  }

  const getSafeImg = (img?: string | null) => resolveImageUrl(img) || `${STATIC_BASE_URL}/avatars/default-avatar.jpg`

  const getShopLogoUrl = (logo?: string | null) => {
    const fallback = `${STATIC_BASE_URL}/shops/default-shop.jpg`
    if (!logo) return fallback

    let raw = String(logo).trim()

    // Nếu backend đôi khi trả JSON array: '["uploads/shops/a.png"]'
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed[0]) raw = String(parsed[0]).trim()
    } catch {
      // không phải JSON -> bỏ qua
    }

    // Dùng trực tiếp nếu là URL tuyệt đối hoặc data URI
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw

    // Nếu bắt đầu bằng "/" -> nối trực tiếp sau STATIC_BASE_URL
    if (raw.startsWith("/")) return `${STATIC_BASE_URL}${raw}`

    // Còn lại coi là path tương đối từ STATIC_BASE_URL
    return `${STATIC_BASE_URL}/${raw}`
  }


  const chatbotUser: User = {
    id: -1,
    name: "Chat Bot",
    avatar: "/bot-avatar.png",
    role: "assistant",
    online: true,
    last_message: "Xin chào! Tôi có thể giúp gì cho bạn?",
    last_time: new Date().toISOString(),
    isBot: true,
  }

  const guestUser: User = {
    id: 0,
    name: "Khách",
    email: "guest@example.com",
    avatar: null,
  }

  const getStorageKey = (user1Id: number, user2Id: number) => {
    const sortedIds = [user1Id, user2Id].sort()
    return `chat_messages_${sortedIds[0]}_${sortedIds[1]}`
  }

  const getChatbotStorageKey = (userId: number | null) => {
    return `chatbot_messages_${userId || "guest"}`
  }

  const saveMessagesToStorage = (msgs: Message[], storageKey: string) => {
    try {
      const messagesToSave = msgs.slice(-100)
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave))
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error)
    }
  }

  const loadMessagesFromStorage = (storageKey: string): Message[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error)
      return []
    }
  }

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (showList) fetchRecentContacts()
  }, [showList])

  useEffect(() => {
    if (!receiver) return

    let storageKey = ""
    let savedMessages: Message[] = []

    if (receiver.id === -1) {
      storageKey = getChatbotStorageKey(currentUser?.id || null)
      savedMessages = loadMessagesFromStorage(storageKey)
    } else if (currentUser) {
      storageKey = getStorageKey(currentUser.id, receiver.id)
      savedMessages = loadMessagesFromStorage(storageKey)
    }

    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    } else {
      setMessages([])
      if (receiver.id !== -1 && currentUser) {
        fetchMessages(true)
      }
    }
  }, [receiver, currentUser])

  useEffect(() => {
    if (activeChat && mounted && receiver?.id) {
      setIsInitialLoad(true)
      setLastMessageCount(0)
      setCurrentOffset(0)
      setHasMoreMessages(true)
      fetchMessages(true)
    }
  }, [activeChat, mounted, receiver?.id])

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" as any })
        setIsInitialLoad(false)
      } else if (messages.length > lastMessageCount) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
      setLastMessageCount(messages.length)
    }
  }, [messages, isInitialLoad, lastMessageCount])

  useEffect(() => {
    if (showList) setUnreadCount(0)
  }, [showList])

  useEffect(() => {
    if (!receiver || messages.length === 0) return

    let storageKey = ""

    if (receiver.id === -1) {
      storageKey = getChatbotStorageKey(currentUser?.id || null)
    } else if (currentUser) {
      storageKey = getStorageKey(currentUser.id, receiver.id)
    } else {
      return
    }

    saveMessagesToStorage(messages, storageKey)
  }, [messages, receiver, currentUser])

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || loadingMore || !hasMoreMessages) return
    if (container.scrollTop <= 100) {
      fetchMessages(false)  // gọi trực tiếp
    }
  }, [loadingMore, hasMoreMessages, receiver?.id]) // thêm deps cần thiết

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    const tk = localStorage.getItem("token") || Cookies.get("authToken")

    if (tk) {
      setToken(tk)
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${tk}` },
        })
        .then((res) => {
          setCurrentUser(res.data)
        })
        .catch((err) => {
          console.error("❌ Lỗi auth:", err)
          if (axios.isAxiosError(err)) {
            console.error("📊 Auth error status:", err.response?.status)
            console.error("📄 Auth error data:", err.response?.data)
          }
        })
    }
  }, [])

  const fetchRecentContacts = useCallback(async () => {
    const tk = localStorage.getItem("token") || Cookies.get("authToken")
    if (!tk) {
      setRecentContacts([chatbotUser])
      return
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: `Bearer ${tk}` },
      })
      setRecentContacts([chatbotUser, ...res.data])
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đã nhắn:", err)
      setRecentContacts([chatbotUser])
    }
  }, [])
  function TypingIndicator() {
    return (
      <div className="flex items-center gap-1 p-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
      </div>
    )
  }

  const handleSocketData = useCallback(
    (data: ChatSocketData) => {
      if (data.type === "message" && data.message) {
        const message = data.message

        const isCurrentConversation =
          receiver?.id &&
          currentUser?.id &&
          ((Number(message.sender_id) === Number(receiver.id) &&
            Number(message.receiver_id) === Number(currentUser.id)) ||
            (Number(message.sender_id) === Number(currentUser?.id) &&
              Number(message.receiver_id) === Number(receiver.id)))

        if (isCurrentConversation) {
          setMessages((prev) => {
            const messageExists = prev.some((msg) => {
              if (String(msg.id).startsWith("temp-")) return false
              return String(msg.id) === String(message.id)
            })

            if (messageExists) return prev

            if (Number(message.sender_id) === Number(currentUser?.id)) {
              return prev.map((msg) => {
                if (
                  String(msg.id).startsWith("temp-") &&
                  msg.message === message.message &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 5000
                ) {
                  return {
                    ...message,
                    image: resolveImageUrl(message.image ?? null),
                  }
                }
                return msg
              })
            }

            const newMessages = [
              ...prev,
              {
                ...message,
                image: resolveImageUrl(message.image ?? null),
              },
            ]
            return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        }

        if (
          Number(message.sender_id) === Number(currentUser?.id) ||
          Number(message.receiver_id) === Number(currentUser?.id)
        ) {
          setTimeout(() => {
            fetchRecentContacts()
          }, 200)
        }

        if (
          Number(message.receiver_id) === Number(currentUser?.id) &&
          Number(message.sender_id) !== Number(currentUser?.id)
        ) {
          if (!isCurrentConversation || !activeChat) {
            setNotifications((prev) => {
              const notificationExists = prev.some((n) => String(n.id) === String(message.id))
              if (notificationExists) return prev

              return [
                ...prev,
                {
                  id: Number(message.id),
                  sender: message.sender,
                  message: message.message,
                  image: resolveImageUrl(message.image ?? null),
                },
              ]
            })
            setUnreadCount((prev) => prev + 1)
          }
        }
      } else if (data.type === "typing") {
        if (data.user_id && Number(data.user_id) !== Number(currentUser?.id)) {
          const isTyping = data.is_typing ?? false
          setIsReceiverTyping(isTyping)
          if (isTyping) {
            setTimeout(() => setIsReceiverTyping(false), 3000)
          }
        }
      }
    },
    [currentUser?.id, receiver?.id, activeChat, fetchRecentContacts]
  )

  const handleConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status)
  }, [])

  const { sendTypingEvent } = usePusherChat(
    currentUser?.id,
    token || "",
    receiver?.id,
    handleSocketData,
    handleConnectionStatus
  )

  const fetchMessages = async (reset = false) => {
    if (!receiver?.id) return

    if (receiver.isBot) {
      if (reset) {
        setMessages([])
        setLoading(false)
      }
      return
    }

    const tk = localStorage.getItem("token") || Cookies.get("authToken")
    if (!tk) return

    if (reset) {
      setLoading(true)
      setMessages([])
    } else {
      setLoadingMore(true)
    }

    try {
      const offset = reset ? 0 : currentOffset
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: {
          user_id: receiver.id,
          limit: 15,
          offset,
        },
        headers: { Authorization: `Bearer ${tk}` },
      })

      let messagesData = res.data

      if (res.data && typeof res.data === "object" && (res.data as any).data && Array.isArray((res.data as any).data)) {
        messagesData = (res.data as any).data
      } else if (!Array.isArray(res.data)) {
        console.error("❌ Response data is not an array:", res.data)
        messagesData = []
      }

      // Normalize IDs and image once here
      const normalized: Message[] = (messagesData as Message[]).map((m) => ({
        ...m,
        sender_id: Number(m.sender_id),
        receiver_id: Number(m.receiver_id),
        image: resolveImageUrl(m.image ?? null) || undefined,
      }))

      const sortedMessages = normalized.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      if (reset) {
        setMessages(sortedMessages)
        setCurrentOffset(15)
      } else {
        const container = messagesContainerRef.current
        const scrollHeight = container?.scrollHeight || 0

        setMessages((prev) => {
          const newMessages = [...sortedMessages, ...prev]
          const uniqueMessages = newMessages.filter(
            (msg, index, arr) => arr.findIndex((m) => String(m.id) === String(msg.id)) === index
          )
          return uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        })

        setCurrentOffset((prev) => prev + 15)

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - scrollHeight
          }
        }, 50)
      }

      setHasMoreMessages((messagesData as Message[]).length === 15)
    } catch (error) {
      console.error("❌ Lỗi khi lấy tin nhắn:", error)
      if (axios.isAxiosError(error)) {
        console.error("📊 Response status:", error.response?.status)
        console.error("📄 Response data:", error.response?.data)
        console.error("🔗 Request URL:", error.config?.url)
      }
      if (reset) {
        setMessages([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreMessages = useCallback(async () => {
    if (!receiver?.id || loadingMore || !hasMoreMessages) return
    await fetchMessages(false)
  }, [receiver?.id, loadingMore, hasMoreMessages])

  // nhớ khai báo state ở trên cùng file (gần các useState khác):
  // const [isBotTyping, setIsBotTyping] = useState(false);

  const sendChatbotMessage = async () => {
    if (!input.trim()) return;

    // 1) Push tin nhắn của bạn vào UI ngay
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser?.id || -999,
      receiver_id: -1,
      message: input.trim(),
      created_at: new Date().toISOString(),
      sender:
        currentUser || {
          id: -999,
          name: "Khách",
          avatar: null,
          role: "guest",
        },
      receiver: chatbotUser,
    };

    setMessages((prev) => [...prev, userMessage]);

    // 2) Reset input + bật typing cho bot
    const originalInput = input;
    setInput("");
    setIsBotTyping(true);

    try {
      // 3) Gọi API chatbot
      const response = await axios.post(`${API_BASE_URL}/chatbot`, {
        message: originalInput,
      });

      const data = response.data as ChatbotResponse;

      // 4) Push reply của bot
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        sender_id: -1,
        receiver_id: currentUser?.id || -999,
        message: data.reply || data.message || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
        created_at: new Date().toISOString(),
        sender: chatbotUser,
        receiver:
          currentUser || {
            id: -999,
            name: "Khách",
            avatar: null,
            role: "guest",
          },
        products: data.products || [],
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (e) {
      // 5) Lỗi -> báo lỗi như bot
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender_id: -1,
        receiver_id: currentUser?.id || -999,
        message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        created_at: new Date().toISOString(),
        sender: chatbotUser,
        receiver:
          currentUser || {
            id: -999,
            name: "Khách",
            avatar: null,
            role: "guest",
          },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // 6) Tắt typing
      setIsBotTyping(false);
    }
  };



  const sendMessage = async () => {
    // 1) Nếu đang chat với bot → dùng flow chatbot
    if (receiver?.id === -1) return sendChatbotMessage()

    // 2) Phải có token và currentUser
    const tk = localStorage.getItem("token") || Cookies.get("authToken")
    if (!tk || !currentUser) {
      alert("Vui lòng đăng nhập để nhắn tin với người dùng khác.")
      return
    }

    // 3) Validate đầu vào
    const rid = Number(receiver?.id)
    if (!rid || (!input.trim() && images.length === 0)) return

    // Giới hạn 1 ảnh/lần gửi (nếu bạn muốn nhiều ảnh thì bỏ check này)
    if (images.length > 1) {
      alert("Chỉ có thể gửi 1 ảnh mỗi lần.")
      return
    }

    // 4) Chuẩn bị message + ảnh
    let messageText = input.trim()
    if (!messageText && images.length > 0) {
      messageText = "[Image]"
    } else if (!messageText) {
      // vẫn cần có ký tự để backend không coi là rỗng
      messageText = " "
    }

    // Validate file ảnh (nếu có)
    const file = images[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB.")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh hợp lệ.")
        return
      }
    }

    // 5) Tạo optimistic message (hiển thị ngay bên phải)
    const previewUrl = file ? URL.createObjectURL(file) : null
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: Number(currentUser.id), // ép kiểu số để so sánh chuẩn
      receiver_id: rid,
      message: messageText,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver: receiver as User,
      image: previewUrl || undefined,
    }

    setMessages((prev) => [...prev, optimisticMessage])

    // Lưu lại state để rollback nếu lỗi
    const originalInput = input
    const originalImages = [...images]
    const originalPreviews = [...imagePreviews]

    // Reset input/ảnh ngay khi bấm gửi
    setInput("")
    setImages([])
    setImagePreviews([])

    // 6) Gọi API gửi tin nhắn
    try {
      const formData = new FormData()
      formData.append("receiver_id", String(rid))
      formData.append("message", messageText)
      if (file) formData.append("image", file)

      await axios.post(`${API_BASE_URL}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${tk}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      })

      // Server sẽ đẩy message thật qua WebSocket.
      setTimeout(() => {
        fetchRecentContacts()
      }, 400)
    } catch (error) {
      // 7) Rollback nếu lỗi
      console.error("❌ Lỗi khi gửi tin nhắn:", error)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(originalInput)
      setImages(originalImages)
      setImagePreviews(originalPreviews)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          alert("File ảnh quá lớn. Vui lòng chọn file nhỏ hơn.")
        } else if (error.response?.status === 422) {
          alert("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.")
        } else {
          alert("Không thể gửi tin nhắn. Vui lòng thử lại.")
        }
      } else {
        alert("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.")
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      if (files.length + images.length > 1) {
        alert("Chỉ có thể gửi 1 ảnh mỗi lần.")
        return
      }

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (>5MB). Vui lòng chọn file nhỏ hơn.`)
          return
        }
        if (!file.type.startsWith("image/")) {
          alert(`File ${file.name} không phải ảnh. Vui lòng chọn file ảnh hợp lệ.`)
          return
        }
      }

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
      avatar: notification.sender.avatar ?? null,
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

  const handleContactClick = (user: User) => {
    setReceiver(user)
    setActiveChat(true)
    setIsInitialLoad(true)
  }

  return (
    <>
      {/* ========== Notifications ========== */}
      <div className="fixed top-4 right-4 z-[10000] space-y-3">
        {notifications.map((notification) => (
          <ChatNotification
            key={`notification-${notification.id}`}
            message={notification}
            onClose={() => removeNotification(Number(notification.id))}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>

      {/* ========== Floating Chat Button ========== */}
      <div className="fixed right-5 bottom-5 z-[9999] md:right-5 md:bottom-5">
        <button
          onClick={() => {
            if (!showList) {
              setReceiver(chatbotUser)
              setActiveChat(true)
              setShowList(true)
              setUnreadCount(0)
            } else {
              setShowList(false)
              setActiveChat(false)
            }
          }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#e14b4b] to-[#c93434] text-white shadow-2xl shadow-red-200/40 ring-2 ring-white/50 hover:ring-white transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
          {unreadCount > 0 && !showList && (
            <>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-md badge-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 rounded-full bg-red-500/60 badge-ping" />
              <span className="absolute -top-2 -right-2 inline-flex h-7 w-7 rounded-full bg-red-500/40 badge-ping" />
            </>
          )}
        </button>
      </div>

      {/* ========== Chat Window (responsive) ========== */}
      {showList && (
        <div
          className="fixed z-[9998] inset-x-2 bottom-2 md:inset-auto md:bottom-5 md:right-24
                     w-auto md:w-[760px] max-w-[95vw]
                     h-[75vh] md:h-[620px]
                     bg-white/95 backdrop-blur
                     rounded-2xl md:rounded-2xl border border-gray-200/70
                     shadow-[0_10px_40px_-10px_rgba(219,68,68,0.35)] overflow-hidden"
        >
          <div className="flex h-full flex-col md:flex-row">
            {/* ========== Contact List (responsive) ========== */}
            <div className="w-full md:w-[290px] border-b md:border-b-0 md:border-r bg-gray-50/70 flex flex-col max-h-[40%] md:max-h-none">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-[#db4444] to-rose-500 text-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Liên hệ gần đây</span>
                  <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded-full">
                    {contactQuery ? filteredContacts.length : recentContacts.length}
                  </span>
                </div>
                {/* Search */}
                <div className="mt-2 relative">
                  <input
                    type="text"
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc nội dung…"
                    className="w-full h-9 pl-8 pr-7 text-xs rounded-lg bg-white/90 border border-white/50 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent"
                  />

                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    viewBox="0 0 24 24" fill="currentColor"
                  >
                    <path d="M10 18a8 8 0 1 1 5.293-14.293A8 8 0 0 1 10 18Zm8.707 1.293-3.761-3.76A10 10 0 1 0 12 22a9.95 9.95 0 0 0 5.533-1.647l3.761 3.76z" />
                  </svg>

                  {contactQuery && (
                    <button
                      type="button"
                      onClick={() => setContactQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[11px] flex items-center justify-center hover:bg-gray-300"
                      aria-label="Xoá tìm kiếm"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {filteredContacts.map((user) => (
                  <button
                    type="button"
                    key={`contact-${user.id}`}
                    onClick={() => handleContactClick(user)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b transition-colors hover:bg-white ${receiver?.id === user.id ? "bg-white/90 border-l-4 border-l-[#db4444]" : ""}`}
                  >
                    <div className="relative">
                      {user.isBot ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot size={18} className="text-white" />
                        </div>
                      ) : (
                        <Image
                          src={
                            user.avatar?.startsWith("http") || user.avatar?.startsWith("/")
                              ? (user.avatar as string)
                              : user.avatar
                                ? `${STATIC_BASE_URL}/${user.avatar}`
                                : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                          }
                          alt={user.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover w-10 h-10 ring-2 ring-white/70 shadow"
                        />
                      )}
                      {user.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        {user.isBot && <Bot size={12} className="text-blue-500" />}
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">{user.last_message || "Chưa có tin nhắn"}</p>
                      {user.last_time && (
                        <p className="text-[11px] text-gray-400">{formatTime(user.last_time)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ========== Chat Area ========== */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#db4444] to-rose-500 text-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {receiver?.isBot ? (
                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Bot size={18} className="text-white" />
                      </div>
                    ) : (
                      <Image
                        src={
                          receiver?.avatar
                            ? (receiver.avatar.startsWith("http") || receiver.avatar.startsWith("/"))
                              ? receiver.avatar
                              : `${STATIC_BASE_URL}/${receiver.avatar}`
                            : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                        }
                        alt="avatar"
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
                      />
                    )}
                    {receiver?.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {receiver?.name || "Chưa chọn người"}
                      {receiver?.isBot && <Bot size={12} className="text-blue-200" />}
                    </p>
                    <p className="text-[11px] opacity-90">
                      {receiver?.isBot
                        ? "AI Assistant — Luôn sẵn sàng hỗ trợ"
                        : connectionStatus === "connected"
                          ? isReceiverTyping
                            ? `${receiver?.name} đang nhập…`
                            : "Đang hoạt động"
                          : connectionStatus === "connecting"
                            ? "Đang kết nối WebSocket…"
                            : connectionStatus === "error"
                              ? "Lỗi WebSocket — dùng API"
                              : "WebSocket mất kết nối"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!receiver?.isBot && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        title="Gửi ảnh"
                      >
                        <Plus size={16} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </>
                  )}
                  <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
                    <MoreVertical size={16} />
                  </button>
                  <button onClick={() => setShowList(false)} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* WS status (only human) */}
              {!receiver?.isBot && (
                <div className="flex items-center gap-2 text-[12px] text-gray-500 px-4 py-2">
                  <span
                    className={`w-2 h-2 rounded-full ${connectionStatus === "connected"
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
                        ? "Đang kết nối WebSocket…"
                        : connectionStatus === "error"
                          ? "Lỗi WebSocket — chỉ dùng API"
                          : "WebSocket mất kết nối"}
                  </span>
                </div>
              )}

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {!receiver?.id ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle size={48} className="mb-3 opacity-50" />
                    <p>Chọn người để bắt đầu trò chuyện</p>
                  </div>
                ) : loading && !receiver?.isBot ? (   // << chỉ quay khi load hội thoại người thật
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-b-2 border-[#db4444] rounded-full" />
                  </div>
                ) : (

                  <>
                    {!receiver?.isBot && loadingMore && (
                      <div className="flex items-center justify-center py-3 text-sm text-gray-500">
                        <div className="animate-spin w-5 h-5 border-b-2 border-[#db4444] rounded-full mr-2" />
                        Đang tải thêm tin nhắn…
                      </div>
                    )}

                    {!receiver?.isBot && !hasMoreMessages && messages.length > 15 && (
                      <div className="flex items-center justify-center py-1">
                        <span className="text-[11px] text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
                          Đã hiển thị tất cả tin nhắn
                        </span>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            {receiver?.isBot
                              ? (isBotTyping ? "Chat Bot đang nhập…" : "AI Assistant — Luôn sẵn sàng hỗ trợ")
                              : connectionStatus === "connected"
                                ? (isReceiverTyping ? `${receiver?.name} đang nhập…` : "Đang hoạt động")
                                : connectionStatus === "connecting"
                                  ? "Đang kết nối WebSocket…"
                                  : connectionStatus === "error"
                                    ? "Lỗi WebSocket — dùng API"
                                    : "WebSocket mất kết nối"}

                      </div>
                        ) : (
                          <>
                              {messages.map((msg) => {
                                const isCurrentUser = Number(msg.sender_id) === myId;
                                const isBotMessage = Number(msg.sender_id) === -1;

                                let avatarUrl = `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;
                                let userName = "User";
                                if (isCurrentUser) {
                                  avatarUrl = getSafeImg(currentUser?.avatar ?? null);
                                  userName = currentUser?.name || "You";
                                } else if (isBotMessage) {
                                  avatarUrl = "";
                                  userName = "Chat Bot";
                                } else {
                                  avatarUrl = getSafeImg(receiver?.avatar ?? null);
                                  userName = receiver?.name || "User";
                                }

                                return (
                                  <div key={`message-${msg.id}`} className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                    {!isCurrentUser && (
                                      <>
                                        {isBotMessage ? (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Bot size={16} className="text-white" />
                                          </div>
                                        ) : (
                                          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />
                                        )}
                                      </>
                                    )}

                                    <div className={`max-w-[85%] md:max-w-[70%] ${isCurrentUser ? "order-first" : ""}`}>
                                      <div
                                        className={[
                                          "p-3 rounded-2xl shadow-sm",
                                          isCurrentUser
                                            ? "bg-rose-50 text-black border border-rose-200 rounded-br-md"
                                            : isBotMessage
                                              ? "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 rounded-bl-md border border-blue-200/60"
                                              : "bg-white text-gray-900 rounded-bl-md border border-gray-200/70",
                                        ].join(" ")}
                                      >
                                        {!!msg.message && (
                                          <div className="text-sm leading-relaxed break-words space-y-2 whitespace-pre-line">
                                            {msg.message
                                              .replace(/\*\*/g, "")          // bỏ dấu **
                                              .replace(/(\d+\.\s)/g, "\n$1") // xuống dòng trước số thứ tự
                                            }
                                          </div>
                                        )}




                                        {!!msg.products?.length && (
                                          <div className="mt-3 space-y-2">
                                            <div className="text-[12px] font-medium text-gray-600 mb-1">Sản phẩm gợi ý</div>

                                            {msg.products.map((product) => {
                                              const shopSlug = encodeURIComponent(product.shop.slug);
                                              const productSlug = encodeURIComponent(product.slug);
                                              const productUrl = `/shop/${shopSlug}/product/${productSlug}`;
                                              const shopUrl = `/shop/${shopSlug}`;

                                              return (
                                                <div
                                                  key={product.id}
                                                  className="bg-white rounded-xl p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
                                                  onClick={() => window.open(productUrl, "_blank")}
                                                >
                                                  <div className="flex gap-3">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                      {product.image?.length ? (
                                                        <img
                                                          src={`${STATIC_BASE_URL}/${product.image[0]}`}
                                                          alt={product.name}
                                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                          onError={(e) => ((e.target as HTMLImageElement).src = "/modern-tech-product.png")}
                                                        />
                                                      ) : (
                                                        <div className="w-full h-full grid place-items-center text-gray-400">—</div>
                                                      )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                      {/* Tên sản phẩm → /shop/<shopSlug>/product/<productSlug> */}
                                                      <a
                                                        href={productUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors"
                                                      >
                                                        {product.name}
                                                      </a>

                                                      {/* Logo + tên shop → /shop/<shopSlug> */}
                                                      <div className="mt-1 flex items-center gap-2">
                                                        <a
                                                          href={shopUrl}
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="flex items-center gap-2"
                                                          title={product.shop.name}
                                                        >
                                                          <img
                                                            src={getShopLogoUrl(product.shop.logo)}
                                                            alt={product.shop.name}
                                                            className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-200"
                                                            onError={(e) => ((e.target as HTMLImageElement).src = `${STATIC_BASE_URL}/shops/default-shop.jpg`)}
                                                          />

                                                          <span className="text-[12px] text-gray-600 hover:text-gray-800 truncate">
                                                            {product.shop.name}
                                                          </span>
                                                        </a>
                                                      </div>

                                                      <div className="flex items-center justify-between mt-1">
                                                        <span className="text-blue-600 font-semibold text-sm">
                                                          {Number.parseInt(product.price).toLocaleString("vi-VN")} VND
                                                        </span>
                                                        {typeof product.similarity === "number" && (
                                                          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {Math.round(product.similarity * 100)}% phù hợp
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {!!msg.image && (
                                          <img
                                            src={resolveImageUrl(msg.image) || ""}
                                            alt="Sent image"
                                            className="mt-2 max-w-full rounded-lg cursor-pointer"
                                            onClick={() => {
                                              const url = resolveImageUrl(msg.image);
                                              if (url) window.open(url, "_blank");
                                            }}
                                          />
                                        )}
                                      </div>

                                      <p className={`text-[11px] text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                                        {isCurrentUser ? "Bạn" : userName} • {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>

                                    {isCurrentUser && (
                                      <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />
                                    )}
                                  </div>
                                );
                              })}

                          </>
                        )
                      }
                        {receiver?.isBot && isBotTyping && (
                          <div className="flex justify-start">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60">
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              </div>
                            </div>
                          </div>
                        )}

                        {isReceiverTyping && (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            {/* typing indicator cho người thật */}
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </>
                )}
              </div>

              {/* Image previews */}
              {!receiver?.isBot && imagePreviews.length > 0 && (
                <div className="px-4 py-2 bg-gray-100 border-t">
                  <div className="flex gap-2 overflow-x-auto">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0">
                        <Image src={src} alt="preview" width={64} height={64} className="rounded-lg object-cover w-full h-full" />
                        <button
                          onClick={() => handleRemoveImage(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-end gap-3">
                  {!receiver?.isBot && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        title="Đính kèm ảnh"
                      >
                        <Plus size={18} />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                    </>
                  )}

                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value)
                        if (!receiver?.isBot) {
                          setIsUserTyping(true)
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                          if (sendTypingEvent) sendTypingEvent(true, receiver?.id)
                          typingTimeoutRef.current = setTimeout(() => {
                            setIsUserTyping(false)
                            if (sendTypingEvent) sendTypingEvent(false, receiver?.id)
                          }, 1000)
                        }
                      }}
                      placeholder={receiver?.isBot ? "Hỏi chatbot…" : "Nhập tin nhắn…"}
                      rows={1}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={(!input.trim() && images.length === 0) || !receiver?.id}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${(!input.trim() && images.length === 0) || !receiver?.id ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#db4444] text-white hover:bg-[#c93333] hover:scale-105"}`}
                    title="Gửi"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
