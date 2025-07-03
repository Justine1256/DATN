'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, Plus, Send } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

interface User {
  id: number;
  name: string;
  avatar: string | null;
  last_message?: string;
  last_time?: string;
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

export default function ModernFloatingTools() {
  const [showList, setShowList] = useState(false);
  const [activeChat, setActiveChat] = useState(false);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
useEffect(() => {
  const token = localStorage.getItem('token') || Cookies.get('authToken');
  if (token) {
    axios
      .get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => console.log('✅ User login:', res.data))
      .catch((err) => console.error('❌ Lỗi auth:', err));
  }
}, []);

  const fetchRecentContacts = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentContacts(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đã nhắn:', err);
    }
  };

  const fetchMessages = async () => {
    if (!receiver?.id) return;
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { user_id: receiver.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(
        res.data.sort(
          (a: Message, b: Message) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
  if (!receiver?.id || (!input.trim() && images.length === 0)) return;

  const token = localStorage.getItem('token') || Cookies.get('authToken');
  if (!token) return;

  setLoading(true);

  const formData = new FormData();
  formData.append('receiver_id', receiver.id.toString());
  formData.append('message', input);
  images.forEach((file, index) => {
  formData.append(`images[${index}]`, file);
});


  try {
    const res = await axios.post(`${API_BASE_URL}/messages`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    setMessages((prev) => [...prev, res.data]);
    setInput('');
    setImages([]);
    setImagePreviews([]);
    fetchRecentContacts(); // cập nhật danh sách gần đây
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
  } finally {
    setLoading(false);
  }
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
      ? new Date(dateStr).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  const renderAvatar = (msg: Message) => {
    const isReceiver = msg.sender_id === receiver?.id;
    const user = isReceiver ? msg.sender : msg.receiver;
    const avatarUrl = user.avatar?.startsWith('http') || user.avatar?.startsWith('/')
      ? user.avatar
      : `${STATIC_BASE_URL}/${user.avatar}`;
    return (
      <Image
        src={avatarUrl || '/default-avatar.jpg'}
        alt={user.name}
        width={24}
        height={24}
        className="w-6 h-6 rounded-full object-cover"
      />
    );
  };
useEffect(() => {
  const handleOpenChatBox = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.receiverId) {
      const { receiverId, receiverName, avatar } = detail;
      setReceiver({
        id: receiverId,
        name: receiverName,
        avatar,
      });
      setShowList(true);
      setActiveChat(true);
    }
  };

  window.addEventListener('open-chat-box', handleOpenChatBox);

  return () => {
    window.removeEventListener('open-chat-box', handleOpenChatBox);
  };
}, []);

  return (
    <>
      <div className="fixed right-4 bottom-4 z-[9999]">
        <button
          onClick={() => {
            setShowList(!showList);
            setActiveChat(false);
          }}
          className="w-12 h-12 bg-[#db4444] hover:bg-[#c93333] text-white rounded-full flex items-center justify-center"
        >
          <MessageCircle size={20} />
        </button>
      </div>

      {showList && (
        <div className="fixed bottom-4 right-20 z-[9998] bg-white border rounded-lg shadow w-[600px] h-[500px] flex">
          {/* Danh sách đã nhắn */}
          <div className="w-[250px] border-r overflow-y-auto">
            <div className="font-bold px-4 py-2 bg-[#db4444] text-white">
              Liên hệ gần đây
            </div>
            {recentContacts.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setReceiver(user);
                  setActiveChat(true);
                }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
              >
                <Image
                  src={
                    user.avatar?.startsWith('http') || user.avatar?.startsWith('/')
                      ? user.avatar
                      : `${STATIC_BASE_URL}/${user.avatar}`
                  }
                  alt={user.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover w-9 h-9"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.last_message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Khung chat */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-[#db4444] text-white">
              <div className="flex items-center gap-2">
                <Image
                  src={
                    receiver?.avatar
                      ? receiver.avatar.startsWith('http') || receiver.avatar.startsWith('/')
                        ? receiver.avatar
                        : `${STATIC_BASE_URL}/${receiver.avatar}`
                      : '/default-avatar.jpg'
                  }
                  alt="avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {receiver?.name || 'Chưa chọn người'}
                  </p>
                  <p className="text-xs">Hỗ trợ khách hàng</p>
                </div>
              </div>
              <button onClick={() => setShowList(false)}>×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {!receiver?.id ? (
                <p className="text-center text-sm text-gray-500">
                  Chọn người để bắt đầu trò chuyện
                </p>
              ) : loading ? (
                <p className="text-center text-sm text-gray-500">
                  Đang tải tin nhắn...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  Chưa có tin nhắn nào
                </p>
              ) : (
                messages.map((msg) => {
                  const isReceiver = msg.sender_id === receiver.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isReceiver ? 'flex-row' : 'flex-row-reverse'
                      } items-start gap-2`}
                    >
                      {renderAvatar(msg)}
                      <div
                        className={`rounded-lg px-3 py-2 max-w-[75%] text-sm ${
                          isReceiver
                            ? 'bg-white border'
                            : 'bg-[#db4444] text-white'
                        }`}
                      >
                        <div>{msg.message}</div>
                        <div className="text-xs mt-1 opacity-60">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreviews.length > 0 && (
              <div className="px-3 py-2 bg-gray-100 flex gap-2 overflow-x-auto">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-12 h-12">
                    <Image
                      src={src}
                      alt="preview"
                      width={48}
                      height={48}
                      className="rounded object-cover w-full h-full"
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 px-3 py-2 text-sm border rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#db4444] resize-none"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
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
                <button
                  onClick={sendMessage}
                  disabled={
                    (!input.trim() && images.length === 0) ||
                    loading ||
                    !receiver?.id
                  }
                  className={`w-8 h-8 rounded flex items-center justify-center ${
                    (!input.trim() && images.length === 0) ||
                    loading ||
                    !receiver?.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#db4444] text-white hover:bg-[#c93333]'
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
  );
}
