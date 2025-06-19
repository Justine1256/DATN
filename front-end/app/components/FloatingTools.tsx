'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, ImageIcon, Send, Smile, Plus } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

interface User {
  id: number;
  name: string;
  avatar: string | null;
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

const RECEIVER_ID = 1;

export default function ModernFloatingTools() {
  const [showList, setShowList] = useState(false);
  const [activeChat, setActiveChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat && mounted) {
      fetchMessages();
    }
  }, [activeChat, mounted]);

  const fetchMessages = async () => {
    if (!mounted) return;

    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || Cookies.get('authToken');
    if (!token) {
      console.warn('Người dùng chưa đăng nhập!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { user_id: RECEIVER_ID },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setMessages(
        res.data.sort(
          (a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && images.length === 0) return;

    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || Cookies.get('authToken');
    if (!token) {
      console.warn('Không tìm thấy token, người dùng chưa đăng nhập!');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('receiver_id', RECEIVER_ID.toString());
    formData.append('message', input);

    images.forEach((image) => {
      formData.append('images[]', image);
    });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/messages`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      setMessages((prev) => [...prev, res.data]);
      setInput('');
      setImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prevImages) => [...prevImages, ...selectedFiles]);

      const previewUrls = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);

    const updatedPreviews = [...imagePreviews];
    URL.revokeObjectURL(updatedPreviews[index]);
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  const renderAvatar = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    const user = isReceiver ? msg.sender : msg.receiver;

    return (
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <Image
          src={user.avatar ? `${STATIC_BASE_URL}${user.avatar}` : '/default-avatar.jpg'} // Ensure correct path
          alt={user.name}
          width={32}
          height={32}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none'; // Hide the image if it fails to load
          }}
        />
        <span className="text-white text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  const renderName = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    return isReceiver ? msg.sender.name : 'Bạn';
  };

  const formatTime = (dateString: string) => {
    if (!mounted) return '';
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed right-6 bottom-6 z-[9999] flex flex-col items-center">
        <div className="relative">
          <button
            onClick={() => {
              setShowList(!showList);
              setActiveChat(false);
            }}
            className="group flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#db4444] to-[#e85555] hover:from-[#c93333] hover:to-[#ff6b6b] text-white transition-all duration-300 rounded-full focus:outline-none focus:ring-4 focus:ring-[#db4444]/30"

          >
            <MessageCircle size={24} />
          </button>
        </div>
      </div>

      {/* Chat Popup */}
      {showList && (
        <div className="fixed bottom-6 right-[100px] z-[9998] flex shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-100 backdrop-blur-sm">
          {/* Left: Contact List */}
          <div className="bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col text-black w-[340px] h-[600px]">
            {/* Header */}
            <div className="w-full px-6 h-[80px] border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#db4444] to-[#ff6b6b]">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  SH
                </div>
                <div>
                  <span className="font-bold text-white text-lg">Nhà sách Nam Việt</span>
                  <div className="text-white/80 text-sm">Luôn sẵn sàng hỗ trợ bạn</div>
                </div>
              </div>
              {!activeChat && (
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-white/80 hover:text-white text-2xl font-bold transition-colors w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  className="w-full px-4 py-3 pl-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                />
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

           
            {/* Contact Item */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="flex gap-4 px-6 py-4 items-center hover:bg-gradient-to-r hover:from-[#db4444]/5 hover:to-[#ff6b6b]/5 cursor-pointer transition-all duration-300 border-b border-gray-50 group"
                onClick={() => setActiveChat(true)}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                    <Image
                      src="/book.png"
                      alt="book"
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>

                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate text-base">
                    Tư vấn sách
                  </div>
                  <div className="text-gray-500 text-sm truncate mt-1">
                    Chúng tôi sẵn sàng tư vấn cho bạn
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Hoạt động • Phản hồi ngay
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                 
                  <button className="text-[#db4444] border-2 border-[#db4444] text-sm px-4 py-1.5 rounded-full hover:bg-[#db4444] hover:text-white transition-all font-semibold group-hover:scale-105">
                    Chat ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Box */}
          {activeChat && (
            <div className="w-[460px] bg-white flex flex-col text-black h-[600px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 h-[80px] border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/book.png"
                      alt="chat"
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <div className="font-bold text-gray-800 text-lg">Tư vấn sách</div>
                    <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Đang hoạt động
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
                {loading ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db4444] mx-auto mb-4"></div>
                    <p className="text-sm font-medium">Đang tải tin nhắn...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Bắt đầu cuộc trò chuyện</p>
                    <p className="text-xs text-gray-400 mt-1">Chúng tôi sẵn sàng hỗ trợ bạn</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isReceiver = msg.sender_id === RECEIVER_ID;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isReceiver ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        {renderAvatar(msg)}
                        <div
                          className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${isReceiver
                            ? 'bg-white border border-gray-200 rounded-bl-md'
                            : 'bg-gradient-to-r from-[#db4444] to-[#ff6b6b] text-white rounded-br-md'
                            }`}
                        >
                          <div className={`font-semibold text-xs mb-1 ${isReceiver ? 'text-gray-600' : 'text-white/80'
                            }`}>
                            {renderName(msg)}
                          </div>
                          <div className="text-sm leading-relaxed">{msg.message}</div>
                          <div className={`text-xs mt-1.5 ${isReceiver ? 'text-gray-400' : 'text-white/60'
                            }`}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2 flex-wrap">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-16 h-16 bg-white rounded-lg overflow-hidden shadow-md">
                        <Image
                          src={preview}
                          alt={`Preview ${index}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn của bạn..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] resize-none transition-all bg-gray-50 focus:bg-white"
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '96px' }}
                    />
                    <button
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Smile size={18} />
                    </button>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={(!input.trim() && images.length === 0) || loading}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl font-medium transition-all transform hover:scale-105 ${loading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : (input.trim() || images.length > 0)
                        ? 'bg-gradient-to-r from-[#db4444] to-[#ff6b6b] hover:from-[#c93333] hover:to-[#e85555] text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
