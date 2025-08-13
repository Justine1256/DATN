"use client";

import type React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import { MessageCircle, X, Plus, Send, Phone, Video, MoreVertical } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { useChatSocket } from "../../hooks/useChatSocket";
import ChatNotification from "./ChatNotification";

interface User {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
  last_message?: string;
  last_time?: string;
  online?: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string | null;
  image: string | null;
  created_at: string;
  sender: User;
  receiver: User;
}

interface NotificationMessage {
  id: number;
  sender: User;
  message: string | null;
  image: string | null;
}

interface ChatSocketData {
  type: string;
  message?: Message;
  user_id?: number;
  is_typing?: boolean;
}

export default function EnhancedChatTools() {
  const [showList, setShowList] = useState(false);
  const [activeChat, setActiveChat] = useState(false);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] =
    useState<"connecting" | "connected" | "disconnected" | "error">("connecting");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null); // NEW: container scroll ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (showList) fetchRecentContacts();
  }, [showList]);

  useEffect(() => {
    if (activeChat && mounted && receiver?.id) {
      fetchMessages();
    }
  }, [activeChat, mounted, receiver?.id]);

  useEffect(() => {
    // auto-scroll mỗi khi messages đổi
    requestAnimationFrame(scrollToBottom);
  }, [messages]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const tokenLocal = localStorage.getItem("token") || Cookies.get("authToken");
    if (tokenLocal) {
      setToken(tokenLocal);
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        })
        .then((res) => setCurrentUser(res.data))
        .catch((err) => {
          console.error("Auth error:", err);
        });
    }
  }, []);

  const handleSocketData = useCallback(
    (data: ChatSocketData) => {
      if (data.type === "message" && data.message) {
        // tránh trùng: nếu đã có id thì bỏ qua
        setMessages((prev) => (prev.some((m) => m.id === data.message!.id) ? prev : [...prev, data.message!]));
      } else if (data.type === "typing") {
        if (data.user_id !== currentUser?.id) {
          setIsReceiverTyping(!!data.is_typing);
          if (data.is_typing) {
            setTimeout(() => setIsReceiverTyping(false), 3000);
          }
        }
      }
    },
    [currentUser?.id]
  );

  const handleConnectionStatus = useCallback(
    (status: "connecting" | "connected" | "disconnected" | "error") => {
      setConnectionStatus(status);
    },
    []
  );

  const { sendTypingEvent } = useChatSocket(
    currentUser?.id,
    token || "",
    receiver?.id,
    handleSocketData,
    handleConnectionStatus
  );

  useEffect(() => {
    const checkConnection = () => {
      if (typeof window !== "undefined" && window.navigator.onLine) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    };

    checkConnection();
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  const fetchRecentContacts = async () => {
    const tokenLocal = localStorage.getItem("token") || Cookies.get("authToken");
    if (!tokenLocal) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });
      setRecentContacts(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đã nhắn:", err);
    }
  };

  const fetchMessages = async () => {
    if (!receiver?.id) return;
    const tokenLocal = localStorage.getItem("token") || Cookies.get("authToken");
    if (!tokenLocal) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { user_id: receiver.id },
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });
      setMessages(
        res.data.sort(
          (a: Message, b: Message) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
    } finally {
      setLoading(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  // ===== OPTIMISTIC SEND =====
  const sendMessage = async () => {
    if (!receiver?.id || (!input.trim() && images.length === 0) || !currentUser) return;

    const tokenLocal = localStorage.getItem("token") || Cookies.get("authToken");
    if (!tokenLocal) return;

    // Tạo tin nhắn tạm để hiển thị ngay
    const tempId = Date.now();
    const tempMsg: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: receiver.id,
      message: input || null,
      image: images[0] ? URL.createObjectURL(images[0]) : null,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver: receiver,
    };
    setMessages((prev) => [...prev, tempMsg]);

    // reset input ui & scroll xuống
    setInput("");
    setImages([]);
    setImagePreviews([]);
    requestAnimationFrame(scrollToBottom);

    // gọi API thật
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("receiver_id", receiver.id.toString());
      formData.append("message", tempMsg.message ?? "");
      if (images[0]) formData.append("image", images[0]);

      const res = await axios.post(`${API_BASE_URL}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${tokenLocal}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Nếu WS không hoạt động, cập nhật lại tin nhắn tạm = tin nhắn thật từ server (có id thật)
      const real = res?.data;
      if (real && typeof real === "object" && real.id) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
      }

      fetchRecentContacts();
    } catch (error) {
      console.error("Gửi tin nhắn lỗi:", error);
      // Nếu lỗi: rollback xoá tin nhắn tạm
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setLoading(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    setIsUserTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (sendTypingEvent) sendTypingEvent(true);

    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      if (sendTypingEvent) sendTypingEvent(false);
    }, 1000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages((prev) => [...prev, ...files]);
      setImagePreviews((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const handleRemoveImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const formatTime = (dateStr: string) =>
    mounted
      ? new Date(dateStr).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "";

  /* =================== UI (POPUP NHỎ) =================== */
  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map((notification) => (
          <ChatNotification
            key={notification.id}
            message={notification}
            onClose={() => {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }}
            onClick={() => {
              setReceiver({
                id: notification.sender.id,
                name: notification.sender.name,
                avatar: notification.sender.avatar,
                role: notification.sender.role,
              });
              setShowList(true);
              setActiveChat(true);
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }}
          />
        ))}
      </div>

      {/* Floating Button */}
      <div className="fixed right-4 bottom-4 z-[9999]">
        <button
          onClick={() => {
            setShowList((v) => !v);
            setActiveChat(false);
            if (showList) setUnreadCount(0);
          }}
          className="relative w-12 h-12 bg-[#db4444] hover:bg-[#c93333] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Popup (small) */}
      {showList && (
        <div className="fixed bottom-20 right-6 z-[9998] w-[700px] h-[520px] bg-white border rounded-xl shadow-2xl overflow-hidden flex">
          {/* Sidebar contacts */}
          <div className="w-[280px] border-r bg-gray-50 flex flex-col">
            <div className="px-3 py-2 bg-[#db4444] text-white text-[13px] font-semibold flex items-center justify-between">
              <span>Liên hệ</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                {recentContacts.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {recentContacts.map((user) => {
                const isActive = receiver?.id === user.id;
                const avatarSrc =
                  user.avatar?.startsWith("http") || user.avatar?.startsWith("/")
                    ? user.avatar
                    : `${STATIC_BASE_URL}/${user.avatar}`;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setReceiver(user);
                      setActiveChat(true);
                    }}
                    className={`w-full text-left px-2 py-2 border-b flex items-center gap-2 hover:bg-white ${isActive ? "bg-white border-l-4 border-l-[#db4444] pl-1.5" : ""
                      }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={avatarSrc || `${STATIC_BASE_URL}/avatars/default-avatar.jpg`}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {user.online && (
                        <span className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {user.last_message || "—"}
                      </p>
                      {user.last_time && (
                        <p className="text-[10px] text-gray-400">{formatTime(user.last_time)}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-3 py-2 bg-[#db4444] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative">
                  <img
                    src={
                      receiver?.avatar
                        ? receiver.avatar.startsWith("http") || receiver.avatar.startsWith("/")
                          ? receiver.avatar
                          : `${STATIC_BASE_URL}/${receiver.avatar}`
                        : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`
                    }
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  {receiver?.online && (
                    <span className="absolute -bottom-0 -right-0 w-2 h-2 rounded-full bg-green-400 border border-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate">
                    {receiver?.name || "Chưa chọn người"}
                  </p>
                  <p className="text-[11px] opacity-90 truncate">
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
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-white/10 rounded" title="Gọi thoại">
                  <Phone size={14} />
                </button>
                <button className="p-1 hover:bg-white/10 rounded" title="Gọi video">
                  <Video size={14} />
                </button>
                <button className="p-1 hover:bg-white/10 rounded" title="Thêm">
                  <MoreVertical size={14} />
                </button>
                <button
                  onClick={() => setShowList(false)}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Đóng"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Connection line */}
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-gray-600">
              <span
                className={`w-2 h-2 rounded-full ${connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
              />
              <span className="truncate">
                {connectionStatus === "connected"
                  ? "WebSocket đã kết nối"
                  : connectionStatus === "connecting"
                    ? "Đang kết nối WebSocket..."
                    : connectionStatus === "error"
                      ? "Lỗi WebSocket - chỉ dùng API"
                      : "WebSocket mất kết nối"}
              </span>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3"
            >
              {!receiver?.id ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={40} className="mx-auto opacity-50 mb-2" />
                    <p className="text-sm">Chọn người để bắt đầu trò chuyện</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-b-2 border-[#db4444] rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={40} className="mx-auto opacity-50 mb-2" />
                    <p className="text-sm">Chưa có tin nhắn nào</p>
                    <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === currentUser?.id;

                    let avatarUrl = "/placeholder.svg";
                    let userName = "User";
                    if (isCurrentUser) {
                      if (currentUser?.avatar) {
                        avatarUrl =
                          currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/")
                            ? currentUser.avatar
                            : `${STATIC_BASE_URL}/${currentUser.avatar}`;
                      }
                      userName = currentUser?.name || "You";
                    } else {
                      if (receiver?.avatar) {
                        avatarUrl =
                          receiver.avatar.startsWith("http") || receiver.avatar.startsWith("/")
                            ? receiver.avatar
                            : `${STATIC_BASE_URL}/${receiver.avatar}`;
                      }
                      userName = receiver?.name || "User";
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isCurrentUser && (
                          <img
                            src={avatarUrl}
                            alt={userName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        )}

                        <div className={`max-w-[78%] ${isCurrentUser ? "order-first" : ""}`}>
                          <div
                            className={`px-3 py-2 rounded-lg text-[13px] ${isCurrentUser
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "bg-white text-gray-900 rounded-bl-sm border"
                              }`}
                          >
                            {msg.message && <p className="break-words">{msg.message}</p>}
                            {msg.image && (
                              <img
                                src={`${STATIC_BASE_URL}/${msg.image}`}
                                alt="Sent"
                                className="mt-2 max-w-full rounded-md cursor-pointer"
                                onClick={() =>
                                  window.open(`${STATIC_BASE_URL}/${msg.image}`, "_blank")
                                }
                              />
                            )}
                          </div>
                          <p
                            className={`text-[11px] text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"
                              }`}
                          >
                            {isCurrentUser ? "Bạn" : userName} •{" "}
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {isCurrentUser && (
                          <img
                            src={avatarUrl}
                            alt={userName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        )}
                      </div>
                    );
                  })}

                  {isReceiverTyping && (
                    <div className="flex items-center gap-2 text-gray-500 text-[12px]">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span>{receiver?.name} đang nhập...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="px-3 py-2 bg-gray-100 border-t">
                <div className="flex gap-2 overflow-x-auto">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={src || "/placeholder.svg"}
                        alt="preview"
                        width={48}
                        height={48}
                        className="rounded-md object-cover w-full h-full"
                      />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-2.5 border-t bg-white">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                  title="Đính kèm ảnh"
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

                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && images.length === 0) || loading || !receiver?.id}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${(!input.trim() && images.length === 0) || loading || !receiver?.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#db4444] text-white hover:bg-[#c93333] hover:scale-105"
                    }`}
                  title="Gửi"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-b-2 border-white rounded-full" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
