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
      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-300 flex items-center justify-center">
        <Image
          src={user.avatar ? `${STATIC_BASE_URL}${user.avatar}` : '/default-avatar.jpg'}
          alt={user.name}
          width={24}
          height={24}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
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
      <div className="fixed right-4 bottom-4 z-[9999] flex flex-col items-center">
        <div className="relative">
          <button
            onClick={() => {
              setShowList(!showList);
              setActiveChat(false);
            }}
            className="flex items-center justify-center w-12 h-12 bg-[#db4444] hover:bg-[#c93333] text-white transition-colors rounded-full focus:outline-none"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      {/* Chat Popup */}
      {showList && (
        <div className="fixed bottom-4 right-[70px] z-[9998] flex rounded-lg overflow-hidden bg-white border border-gray-200">
          {/* Left: Contact List */}
          <div className="bg-white border-r border-gray-200 flex flex-col text-black w-[280px] h-[400px]">
            {/* Header */}
            <div className="w-full px-4 h-[50px] border-b border-gray-200 flex items-center justify-between bg-[#db4444]">
              <div className="flex items-center gap-2">
                <div className="bg-white text-[#db4444] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  SH
                </div>
                <div>
                  <span className="font-medium text-white text-sm">Nhà sách Nam Việt</span>
                  <div className="text-white text-xs">Hỗ trợ khách hàng</div>
                </div>
              </div>
              {!activeChat && (
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-white hover:text-gray-200 text-lg font-bold transition-colors w-6 h-6 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full px-3 py-2 pl-8 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#db4444] focus:border-[#db4444] transition-all"
                />
                <svg className="absolute left-2.5 top-2.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Contact Item */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="flex gap-3 px-4 py-3 items-center hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50"
                onClick={() => setActiveChat(true)}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    <Image
                      src="/book.png"
                      alt="book"
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate text-sm">
                    Tư vấn sách
                  </div>
                  <div className="text-gray-500 text-xs truncate mt-0.5">
                    Sẵn sàng tư vấn cho bạn
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Hoạt động
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <button className="text-[#db4444] border border-[#db4444] text-xs px-3 py-1 rounded-full hover:bg-[#db4444] hover:text-white transition-all font-medium">
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Box */}
          {activeChat && (
            <div className="w-[350px] bg-white flex flex-col text-black h-[500px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src="/book.png"
                      alt="chat"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">Tư vấn sách</div>
                    <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Đang hoạt động
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold transition-colors w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#db4444] mx-auto mb-2"></div>
                    <p className="text-xs">Đang tải...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">Bắt đầu trò chuyện</p>
                    <p className="text-xs text-gray-400 mt-1">Chúng tôi sẵn sàng hỗ trợ</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isReceiver = msg.sender_id === RECEIVER_ID;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${isReceiver ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        {renderAvatar(msg)}
                        <div
                          className={`px-3 py-2 rounded-lg max-w-[75%] ${isReceiver
                            ? 'bg-white border border-gray-200'
                            : 'bg-[#db4444] text-white'
                            }`}
                        >
                          <div className={`font-medium text-xs mb-1 ${isReceiver ? 'text-gray-600' : 'text-white'
                            }`}>
                            {renderName(msg)}
                          </div>
                          <div className="text-xs leading-relaxed">{msg.message}</div>
                          <div className={`text-xs mt-1 ${isReceiver ? 'text-gray-400' : 'text-white'
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
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2 flex-wrap">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-12 h-12 bg-white rounded-md overflow-hidden border">
                        <Image
                          src={preview}
                          alt={`Preview ${index}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="w-full border border-gray-200 rounded-md px-3 py-2 pr-8 text-xs outline-none focus:ring-1 focus:ring-[#db4444] focus:border-[#db4444] resize-none transition-all bg-gray-50 focus:bg-white"
                      rows={1}
                      style={{ minHeight: '36px', maxHeight: '72px' }}
                    />
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
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

                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={(!input.trim() && images.length === 0) || loading}
                    className={`flex items-center justify-center w-8 h-8 rounded-md font-medium transition-all ${loading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : (input.trim() || images.length > 0)
                        ? 'bg-[#db4444] hover:bg-[#c93333] text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Send size={14} />
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