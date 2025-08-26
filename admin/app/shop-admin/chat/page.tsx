"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Send, MoreVertical, AlignJustify, MessageCircle } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { usePusherChat } from "@/app/hooks/usePusherChat";
import { createPortal } from "react-dom";
import ChatNotification from "./ChatNotification";

/* ========= Types ========= */
interface User {
  id: number;
  name: string;
  avatar?: string | null;
  role?: string;
  online?: boolean;
  last_message?: string;
  last_time?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
  last_conversation_id?: number | null;
}

interface Message {
  id: string | number;
  sender_id: number;
  receiver_id: number;
  message: string;
  image?: string | null;
  created_at: string;
  sender: User;
  receiver: User;
}

const byCreatedAtAsc = (a: Message, b: Message) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

interface NotificationMessage {
  id: number;
  sender: User;
  message: string;
  image?: string | null;
}

interface ChatSocketData {
  type: "message" | "typing";
  message?: Message;
  user_id?: number;
  is_typing?: boolean;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/* ========= Page Component ========= */
export default function HumanChatPage() {
  const PAGE_SIZE = 15;

  // luôn là trang full → showList = true
  const [showList, setShowList] = useState(true);
  const [activeChat, setActiveChat] = useState(true);
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
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isContactListOpen, setIsContactListOpen] = useState(false); // chỉ dùng cho mobile drawer

  const myId = useMemo(() => Number(currentUser?.id ?? -999), [currentUser]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const isFetchingRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const convoKeyRef = useRef<string>("");

  const [contactQuery, setContactQuery] = useState("");

  const makeConvoKey = (rid: number | undefined, page: number) =>
    `u:${myId}-r:${Number(rid)}-p:${page}`;

  const normalize = (s: string | undefined) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filteredContacts = useMemo(() => {
    const q = normalize(contactQuery);
    if (!q) return recentContacts;
    const tokens = q.split(/\s+/).filter(Boolean);
    return recentContacts.filter((u) => {
      const combined = `${normalize(u?.name)} ${normalize(u?.last_message)}`;
      return tokens.every((t) => combined.includes(t));
    });
  }, [contactQuery, recentContacts]);

  const resolveImageUrl = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith("blob:") || img.startsWith("data:") || img.startsWith("http") || img.startsWith("/"))
      return img;
    return `${STATIC_BASE_URL}/${img}`;
  };

  const getSafeImg = (img?: string | null) =>
    resolveImageUrl(img) || `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;

  const lastRxKey = (uid: number | null) => `chat_last_receiver_${uid ?? "guest"}`;
  const setLastReceiver = (rid: number | null) => {
    try {
      localStorage.setItem(lastRxKey(currentUser?.id || null), String(rid ?? ""));
    } catch {}
  };
  const getLastReceiver = (): number | null => {
    try {
      const v = localStorage.getItem(lastRxKey(currentUser?.id || null));
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };

  const rafThrottle = <T extends (...args: any[]) => void>(fn: T) => {
    let ticking = false;
    return (...args: Parameters<T>) => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn(...args);
          ticking = false;
        });
      }
    };
  };

  useEffect(() => setMounted(true), []);

  /* ===== Auth ===== */
  useEffect(() => {
    const tk = localStorage.getItem("token") || Cookies.get("authToken");
    if (tk) {
      setToken(tk);
      axios
        .get(`${API_BASE_URL}/user`, { headers: { Authorization: `Bearer ${tk}` } })
        .then((res) => setCurrentUser(res.data as User))
        .catch((err) => console.error("❌ Auth error:", err));
    }
  }, []);

  /* ===== Contacts ===== */
  const fetchRecentContacts = useCallback(async () => {
    const tk = localStorage.getItem("token") || Cookies.get("authToken");
    if (!tk) {
      setRecentContacts([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: { toString: () => `Bearer ${tk}` } as any },
      });
      const humans: User[] = (res.data || []).filter((u: User) => Number(u.id) > 0);
      setRecentContacts(humans);
    } catch (err) {
      console.error("Lỗi lấy danh sách đã nhắn:", err);
      setRecentContacts([]);
    }
  }, []);

  // trang full: luôn load contacts khi vào
  useEffect(() => {
    fetchRecentContacts();
  }, [fetchRecentContacts]);

  /* ===== Mở cuộc gần nhất (server/local) lần đầu ===== */
  useEffect(() => {
    if (!currentUser || !token || receiver) return;

    (async () => {
      let targetId: number | null =
        (typeof currentUser.last_conversation_id === "number"
          ? currentUser.last_conversation_id
          : null) ?? null;

      if (targetId == null) targetId = getLastReceiver();
      if (targetId == null && recentContacts.length > 0) targetId = recentContacts[0].id;

      if (targetId != null && targetId > 0) {
        const found = recentContacts.find((u) => Number(u.id) === Number(targetId));
        const target: User = found || ({ id: targetId, name: "Người dùng" } as User);

        fetchAbortRef.current?.abort();
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);

        setReceiver(target);
        setLastReceiver(targetId);
        setActiveChat(true);
        setIsInitialLoad(true);
        setMessages([]);
        setHasMoreMessages(true);
        setCurrentPage(1);
      }
    })();
  }, [currentUser, token, receiver, recentContacts]);

  /* ===== Khi đổi receiver, dừng request cũ ===== */
  useEffect(() => {
    fetchAbortRef.current?.abort();
    isFetchingRef.current = false;
    setLoading(false);
    setLoadingMore(false);
  }, [receiver?.id]);

  /* ===== Fetch messages ===== */
  const fetchMessages = useCallback(
    async (reset = false) => {
      if (!receiver?.id) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      const tk = localStorage.getItem("token") || Cookies.get("authToken");
      if (!tk) {
        isFetchingRef.current = false;
        return;
      }

      if (reset) {
        setLoading(true);
        setMessages([]);
        setHasMoreMessages(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }

      try {
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        const pageToFetch = reset ? 1 : currentPage + 1;
        const thisKey = makeConvoKey(receiver?.id, pageToFetch);
        convoKeyRef.current = thisKey;

        const res = await axios.get(`${API_BASE_URL}/messages`, {
          params: { user_id: receiver.id, page: pageToFetch, limit: PAGE_SIZE },
          headers: { Authorization: `Bearer ${tk}` },
          signal: controller.signal,
        });

        if (convoKeyRef.current !== thisKey) return;

        const payload = res.data || {};
        const list = Array.isArray(payload.data) ? payload.data : [];

        const batch: Message[] = list
          .map((m: any) => ({
            ...m,
            sender_id: Number(m.sender_id),
            receiver_id: Number(m.receiver_id),
            image: resolveImageUrl(m.image ?? null) || undefined,
          }))
          .sort(byCreatedAtAsc);

        if (reset) {
          setMessages(batch);
          setCurrentPage(1);
          setIsInitialLoad(true);
        } else {
          const container = messagesContainerRef.current;
          const prevHeight = container?.scrollHeight || 0;

          setMessages((prev) => {
            const merged = [...batch, ...prev];
            const unique = merged.filter(
              (msg, i, arr) => arr.findIndex((m) => String(m.id) === String(msg.id)) === i
            );
            return unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });

          setCurrentPage((p) => p + 1);

          setTimeout(() => {
            if (container) {
              const newH = container.scrollHeight;
              container.scrollTop = newH - prevHeight;
            }
          }, 0);
        }

        const hasMore =
          typeof (payload as any).has_more === "boolean"
            ? (payload as any).has_more
            : ((payload as any).current_page ?? pageToFetch) < ((payload as any).last_page ?? pageToFetch);

        setHasMoreMessages(hasMore);
      } catch (err: unknown) {
        if ((err as any)?.name !== "CanceledError" && (err as any)?.name !== "AbortError") {
          console.error("❌ fetchMessages error:", err);
          if (reset) setMessages([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [receiver?.id, currentPage]
  );

  useEffect(() => {
    if (!receiver?.id) return;
    fetchMessages(true);
  }, [receiver?.id, fetchMessages]);

  /* ===== Cuộn cuối */ 
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" as any });
        setIsInitialLoad(false);
      } else if (messages.length > lastMessageCount) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      setLastMessageCount(messages.length);
    }
  }, [messages, isInitialLoad, lastMessageCount]);

  /* ===== Pusher / typing / notifications ===== */
  const { sendTypingEvent } = usePusherChat(
    currentUser?.id,
    token || "",
    receiver?.id,
    useCallback(
      (data: ChatSocketData) => {
        if (data.type === "message" && data.message) {
          const message = data.message;
          const isCurrentConversation =
            receiver?.id &&
            currentUser?.id &&
            ((Number(message.sender_id) === Number(receiver.id) &&
              Number(message.receiver_id) === Number(currentUser.id)) ||
              (Number(message.sender_id) === Number(currentUser?.id) &&
                Number(message.receiver_id) === Number(receiver.id)));

          if (isCurrentConversation) {
            setMessages((prev) => {
              const exists = prev.some((m) => !String(m.id).startsWith("temp-") && String(m.id) === String(message.id));
              if (exists) return prev;

              if (Number(message.sender_id) === Number(currentUser?.id)) {
                return prev.map((msg) => {
                  if (
                    String(msg.id).startsWith("temp-") &&
                    msg.message === message.message &&
                    Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 5000
                  ) {
                    return { ...message, image: resolveImageUrl(message.image ?? null) };
                  }
                  return msg;
                });
              }

              const newMessages = [...prev, { ...message, image: resolveImageUrl(message.image ?? null) }];
              return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
          }

          if (
            Number(message.sender_id) === Number(currentUser?.id) ||
            Number(message.receiver_id) === Number(currentUser?.id)
          ) {
            setTimeout(() => fetchRecentContacts(), 200);
          }

          if (Number(message.receiver_id) === Number(currentUser?.id) &&
              Number(message.sender_id) !== Number(currentUser?.id)) {
            if (!isCurrentConversation || !activeChat) {
              setNotifications((prev) => {
                const exists = prev.some((n) => String(n.id) === String(message.id));
                if (exists) return prev;
                return [
                  ...prev,
                  { id: Number(message.id), sender: message.sender, message: message.message, image: resolveImageUrl(message.image ?? null) },
                ];
              });
              setUnreadCount((p) => p + 1);
            }
          }
        } else if (data.type === "typing") {
          if (data.user_id && Number(data.user_id) !== Number(currentUser?.id)) {
            const typing = data.is_typing ?? false;
            setIsReceiverTyping(typing);
            if (typing) setTimeout(() => setIsReceiverTyping(false), 3000);
          }
        }
      },
      [currentUser?.id, receiver?.id, activeChat, fetchRecentContacts]
    ),
    useCallback((status: ConnectionStatus) => setConnectionStatus(status), [])
  );

  /* ===== IO cho load-more ===== */
  useEffect(() => {
    const root = messagesContainerRef.current;
    const target = topSentinelRef.current;
    if (!root || !target) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMoreMessages && !isFetchingRef.current) fetchMessages(false);
      },
      { root, threshold: 0, rootMargin: "0px 0px -90% 0px" }
    );

    io.observe(target);
    return () => io.disconnect();
  }, [receiver?.id, hasMoreMessages, fetchMessages]);

  const handleScroll = useMemo(
    () =>
      rafThrottle(() => {
        const root = messagesContainerRef.current;
        if (!root || isFetchingRef.current || !hasMoreMessages) return;
        if (root.scrollTop <= 40) fetchMessages(false);
      }),
    [hasMoreMessages, fetchMessages]
  );

  useEffect(() => {
    const root = messagesContainerRef.current;
    if (!root) return;
    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, [receiver?.id, handleScroll]);

  /* ===== Send message ===== */
  const sendMessage = async () => {
    const tk = localStorage.getItem("token") || Cookies.get("authToken");
    if (!tk || !currentUser) {
      alert("Vui lòng đăng nhập để nhắn tin với người dùng khác.");
      return;
    }
    const rid = Number(receiver?.id);
    if (!rid || (!input.trim() && images.length === 0)) return;
    if (images.length > 1) {
      alert("Chỉ có thể gửi 1 ảnh mỗi lần.");
      return;
    }

    let messageText = input.trim();
    if (!messageText && images.length > 0) messageText = "[Image]";
    else if (!messageText) messageText = " ";

    const file = images[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh hợp lệ.");
        return;
      }
    }

    const previewUrl = file ? URL.createObjectURL(file) : null;
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: Number(currentUser.id),
      receiver_id: rid,
      message: messageText,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver: receiver as User,
      image: previewUrl || undefined,
    };

    setLastReceiver(rid);
    setMessages((prev) => [...prev, optimisticMessage]);

    const originalInput = input;
    const originalImages = [...images];
    const originalPreviews = [...imagePreviews];

    setInput("");
    setImages([]);
    setImagePreviews([]);

    try {
      const formData = new FormData();
      formData.append("receiver_id", String(rid));
      formData.append("message", messageText);
      if (file) formData.append("image", file);

      await axios.post(`${API_BASE_URL}/messages`, formData, {
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      setTimeout(() => fetchRecentContacts(), 400);
    } catch (error: unknown) {
      console.error("❌ sendMessage error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(originalInput);
      setImages(originalImages);
      setImagePreviews(originalPreviews);
      alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fls = e.target.files;
    if (!fls) return;
    const files = Array.from(fls);

    if (files.length + images.length > 1) {
      alert("Chỉ có thể gửi 1 ảnh mỗi lần.");
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn (>5MB).`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} không phải ảnh.`);
        return;
      }
    }
    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const formatTime = (dateStr: string) =>
    mounted
      ? new Date(dateStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      : "";

  const handleNotificationClick = (notification: NotificationMessage) => {
    const next: User = {
      id: notification.sender.id,
      name: notification.sender.name,
      avatar: notification.sender.avatar ?? null,
      role: notification.sender.role,
    };
    setReceiver(next);
    setLastReceiver(notification.sender.id);
    setActiveChat(true);
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleContactClick = (user: User) => {
    setReceiver(user);
    setLastReceiver(user.id);
    setActiveChat(true);
    setIsInitialLoad(true);
  };

  const toggleContactList = () => setIsContactListOpen((v) => !v);

  /* ===== UI (Full page) ===== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notifications (toast) */}
      {mounted &&
        createPortal(
          <div className="fixed top-[72px] right-4 z-[10000] flex flex-col items-end space-y-3">
            {notifications.slice(-3).map((n) => (
              <ChatNotification
                key={`notification-${n.id}`}
                message={n}
                onClose={() => removeNotification(Number(n.id))}
                onClick={() => handleNotificationClick(n)}
              />
            ))}
          </div>,
          document.body
        )}

      {/* Page container */}
      <div className="bg-white"
     style={{ ['--header-h' as any]: '72px', ['--pad-x' as any]: '16px' }}>
  <div className="relative h-[calc(100dvh-var(--header-h))]
                    -mx-[var(--pad-x)] -mt-[var(--pad-x)] -mb-[var(--pad-x)]
                    overflow-hidden">
    <div className="absolute inset-0 grid grid-cols-[360px_minmax(0,1fr)] gap-0">


            {/* Sidebar - Contact list */}
            <aside className="w-full md:w-80 border-r bg-gray-50/70 flex flex-col">
              {/* Sidebar header */}
              <div className="px-4 py-3 bg-gradient-to-r from-[#db4444] to-rose-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlignJustify className="md:hidden opacity-0" /> {/* giữ layout */}
                    <span className="font-semibold">Liên hệ gần đây</span>
                    <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded-full">
                      {contactQuery ? filteredContacts.length : recentContacts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setContactQuery("")}
                    className="hidden md:inline-block text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                  >
                    Làm mới tìm kiếm
                  </button>
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
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
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

              {/* Contacts */}
              <div className="overflow-y-auto flex-1">
                {filteredContacts.map((user) => (
                  <button
                    type="button"
                    key={`contact-${user.id}`}
                    onClick={() => handleContactClick(user)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b transition-colors hover:bg-white ${
                      receiver?.id === user.id ? "bg-white/90 border-l-4 border-l-[#db4444]" : ""
                    }`}
                  >
                    <div className="relative">
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
                      {user.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-[12px] text-gray-500 truncate">{user.last_message || "Chưa có tin nhắn"}</p>
                      {user.last_time && <p className="text-[11px] text-gray-400">{formatTime(user.last_time)}</p>}
                    </div>
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="h-full grid place-items-center text-gray-500 p-6 text-sm">
                    <MessageCircle className="mr-2 opacity-60" /> Chưa có liên hệ nào.
                  </div>
                )}
              </div>
            </aside>

            {/* Chat area */}
            <section className="flex-1 flex flex-col">
              {/* Header of chat */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#db4444] to-rose-500 text-white">
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
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
                    />
                    {receiver?.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />}
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-sm">{receiver?.name || "Chưa chọn người"}</p>
                    <p className="text-[11px] opacity-90">
                      {connectionStatus === "connected"
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    title="Gửi ảnh"
                  >
                    <Plus size={16} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center" title="Tuỳ chọn">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {hasMoreMessages && <div ref={topSentinelRef} className="h-24 w-full" />}

                {!receiver?.id ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle size={48} className="mb-3 opacity-50" />
                    <p>Chọn người để bắt đầu trò chuyện</p>
                  </div>
                ) : loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-b-2 border-[#db4444] rounded-full" />
                  </div>
                ) : (
                  <>
                    {loadingMore && (
                      <div className="flex items-center justify-center py-3 text-sm text-gray-500">
                        <div className="animate-spin w-5 h-5 border-b-2 border-[#db4444] rounded-full mr-2" />
                        Đang tải thêm tin nhắn…
                      </div>
                    )}

                    {!hasMoreMessages && messages.length > PAGE_SIZE && (
                      <div className="flex items-center justify-center py-1">
                        <span className="text-[11px] text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">Đã hiển thị tất cả tin nhắn</span>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        {connectionStatus === "connected"
                          ? isReceiverTyping
                            ? `${receiver?.name} đang nhập…`
                            : "Đang hoạt động"
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
                          const avatarUrl = isCurrentUser ? getSafeImg(currentUser?.avatar ?? null) : getSafeImg(receiver?.avatar ?? null);
                          const userName = isCurrentUser ? currentUser?.name || "Bạn" : receiver?.name || "User";

                          return (
                            <div key={`message-${msg.id}`} className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                              {!isCurrentUser && (
                                <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />
                              )}

                              <div className={`max-w-[85%] md:max-w-[70%] ${isCurrentUser ? "order-first" : ""}`}>
                                <div
                                  className={[
                                    "p-3 rounded-2xl shadow-sm",
                                    isCurrentUser
                                      ? "bg-rose-50 text-black border border-rose-200 rounded-br-md"
                                      : "bg-white text-gray-900 rounded-bl-md border border-gray-200/70",
                                  ].join(" ")}
                                >
                                  {!!msg.message && (
                                    <div className="text-sm leading-relaxed break-words whitespace-pre-line">{msg.message}</div>
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
                                  {isCurrentUser ? "Bạn" : userName} •{" "}
                                  {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>

                              {isCurrentUser && (
                                <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    title="Đính kèm ảnh"
                  >
                    <Plus size={18} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />

                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        if (typeof sendTypingEvent === "function") sendTypingEvent(true, receiver?.id);
                        typingTimeoutRef.current = setTimeout(() => {
                          if (typeof sendTypingEvent === "function") sendTypingEvent(false, receiver?.id);
                        }, 1000);
                      }}
                      placeholder="Nhập tin nhắn…"
                      rows={1}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent resize-none"
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
                    disabled={(!input.trim() && images.length === 0) || !receiver?.id}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      (!input.trim() && images.length === 0) || !receiver?.id
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#db4444] text-white hover:bg-[#c93333] hover:scale-105"
                    }`}
                    title="Gửi"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
