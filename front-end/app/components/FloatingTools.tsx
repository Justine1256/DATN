'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, ImageIcon } from 'lucide-react'; // ImageIcon for the upload button
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

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
  const [images, setImages] = useState<File[]>([]); // To store selected images
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // To store preview URLs of selected images
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      console.warn('Người dùng chưa đăng nhập!');
      return;
    }

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
    if (!input.trim() && images.length === 0) return; // Do not send if there's no input or images

    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      console.warn('Không tìm thấy token, người dùng chưa đăng nhập!');
      return;
    }

    setLoading(true); // Set loading state to true when sending message

    const formData = new FormData();
    formData.append('receiver_id', RECEIVER_ID.toString());
    formData.append('message', input);

    images.forEach((image) => {
      formData.append('images[]', image); // Append each image selected
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
      setImages([]); // Clear images after sending
      setImagePreviews([]); // Clear image previews after sending
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    } finally {
      setLoading(false); // Reset loading state after sending
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
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  const renderAvatar = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    const user = isReceiver ? msg.sender : msg.receiver;
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <Image
          src={'/default-avatar.jpg'}
          alt={user.name}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  const renderName = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    return isReceiver ? msg.sender.name : 'Bạn';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Floating Button Bar */}
      <div className="fixed right-20 bottom-6 z-[9999] flex flex-col items-center">
        <div className="bg-white  ">
          {/* Chat Button with icon only and no border */}
          <button
            onClick={() => {
              setShowList(!showList);
            }}
            className="flex items-center justify-center w-16 h-16 bg-[#db4444] hover:bg-[#c93333] text-white transition-colors rounded-full shadow-md focus:outline-none"
          >
            <MessageCircle size={24} /> {/* Increased icon size for better visibility */}
          </button>
        </div>
      </div>

      {/* Chat Popup */}
      {showList && (
        <div className="fixed bottom-6 right-[150px] z-[9998] flex shadow-xl rounded-xl overflow-hidden bg-white">
          {/* Left: Contact List */}
          <div className="bg-white border-r border-gray-200 flex flex-col text-black w-[320px] h-[580px]">
            {/* Header */}
            <div className="w-full px-4 h-[70px] border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                  SH
                </div>
                <span className="font-semibold text-gray-800">Nhà sách Nam Việt</span>
              </div>
              <button
                onClick={() => {
                  setShowList(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Contact Item */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="flex gap-3 px-4 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                onClick={() => setActiveChat(true)}
              >
                <div className="relative">
                  <Image
                    src="/book.png"
                    alt="book"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate text-sm">
                    Sách Giao Tiếp
                  </div>
                  <div className="text-gray-500 text-xs truncate mt-1">
                    Nhà sách Nam Việt
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button className="text-[#db4444] border border-[#db4444] text-xs px-3 py-1 rounded-full hover:bg-[#db4444] hover:text-white transition-all font-medium">
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Box */}
          {activeChat && (
            <div className="w-[420px] bg-white flex flex-col text-black h-[580px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 h-[70px] border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Image
                    src="/book.png"
                    alt="chat"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Nhà sách Nam Việt</div>
                    <div className="text-xs text-gray-500">
                      Giá chỉ từ 395.000 đ
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowList(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db4444] mx-auto mb-2"></div>
                    <p className="text-sm">Đang tải...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="mx-auto mb-2" size={32} />
                    <p className="text-sm">Chưa có tin nhắn</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${msg.sender_id === RECEIVER_ID ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      {renderAvatar(msg)}
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[75%] ${msg.sender_id === RECEIVER_ID
                          ? 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                          : 'bg-[#db4444] text-white rounded-br-md'
                          }`}
                      >
                        <div className={`font-semibold text-xs mb-1 ${msg.sender_id === RECEIVER_ID ? 'text-gray-600' : 'text-white/80'}`}>
                          {renderName(msg)}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.message}</div>
                        <div className={`text-xs mt-1 ${msg.sender_id === RECEIVER_ID ? 'text-gray-400' : 'text-white/60'}`}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white flex items-center gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập nội dung chat..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] resize-none transition-all"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                />

                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#db4444] hover:text-[#c93333] transition-colors"
                >
                  <ImageIcon size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />

                {/* Display selected images inside input */}
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={preview}
                        alt={`Preview ${index}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-white rounded-full p-1 text-gray-600 hover:bg-gray-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() && images.length === 0 || loading} // Disable if no input or images
                  className={`${loading ? 'bg-gray-300' : 'bg-[#db4444] hover:bg-[#c93333]'}
                    disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all`}
                >
                  Gửi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
