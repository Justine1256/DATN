'use client';

import { useEffect, useState } from 'react';
import { FaRobot, FaRegCommentDots } from 'react-icons/fa';
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

export default function FloatingTools() {
  const [showList, setShowList] = useState(false);
  const [activeChat, setActiveChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!input.trim()) return;

    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      console.warn('Không tìm thấy token, người dùng chưa đăng nhập!');
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/messages`,
        { receiver_id: RECEIVER_ID, message: input },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setMessages((prev) => [...prev, res.data]);
      setInput('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  useEffect(() => {
    if (activeChat) fetchMessages();
  }, [activeChat]);

  const renderAvatar = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    const user = isReceiver ? msg.sender : msg.receiver;
    return (
      <Image
        src={'/default-avatar.png'}
        alt={user.name}
        width={30}
        height={30}
        className="rounded-full"
      />
    );
  };

  const renderName = (msg: Message) => {
    const isReceiver = msg.sender_id === RECEIVER_ID;
    return isReceiver ? msg.sender.name : 'Bạn';
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed right-20 bottom-6 z-[9999] flex flex-col items-center">
        <div className="bg-[#db4444] text-white rounded-[1rem] overflow-hidden w-14">
          <button
            onClick={() => {
              setShowList(false);
              setActiveChat(false);
            }}
            className="flex flex-col items-center justify-center h-16 hover:bg-[#c93333] transition w-full"
          >
            <FaRobot size={18} />
            <span className="text-xs mt-1">Trợ lý</span>
          </button>
          <button
            onClick={() => {
              setShowList(!showList);
              setActiveChat(false);
            }}
            className="flex flex-col items-center justify-center h-16 hover:bg-[#c93333] transition w-full"
          >
            <FaRegCommentDots size={18} />
            <span className="text-xs mt-1">Tin mới</span>
          </button>
        </div>
      </div>

      {/* Chat Popup */}
      {showList && (
        <div className="fixed bottom-6 right-[150px] z-[9998] flex shadow-xl rounded-xl overflow-hidden">
          {/* Left: Danh sách */}
          <div className="bg-white border-r flex flex-col text-black w-[320px] h-[580px]">
            <div className="w-full px-4 h-[70px] border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-200 text-green-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  SH
                </div>
                <span className="font-semibold text-sm">Nhà sách Nam Việt</span>
              </div>
              {!activeChat && (
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-gray-500 hover:text-[#db4444] text-[26px] font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Tìm theo người dùng..."
                className="w-full px-3 py-3 text-sm border rounded bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="px-4 py-2 text-sm font-semibold text-gray-700">
              Gợi ý
            </div>
            <div className="flex gap-2 px-4 py-3 items-center bg-blue-50 cursor-pointer">
              <Image
                src="/book.png"
                alt="book"
                width={40}
                height={40}
                className="rounded"
              />
              <div className="flex-1 text-sm">
                <div className="font-semibold truncate max-w-[140px]">
                  Sách Giao Tiếp
                </div>
                <div className="text-gray-500 text-xs truncate">
                  Nhà sách Nam Việt
                </div>
              </div>
              <button
                onClick={() => setActiveChat(true)}
                className="text-[#db4444] border border-[#db4444] text-xs px-3 py-1 rounded hover:bg-[#db4444] hover:text-white transition"
              >
                Chat
              </button>
            </div>
          </div>

          {/* Right: Chat Box */}
          {activeChat && (
            <div className="w-[420px] bg-white flex flex-col text-black h-[580px]">
              <div className="flex items-center justify-end px-4 h-[70px] border-b">
                <button
                  onClick={() => {
                    setShowList(false);
                    setActiveChat(false);
                  }}
                  className="text-gray-500 hover:text-[#db4444] text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center gap-2 px-4 py-[14px] border-b">
                <Image
                  src="/book.png"
                  alt="chat"
                  width={40}
                  height={40}
                  className="rounded"
                />
                <div>
                  <div className="font-semibold text-sm">Nhà sách Nam Việt</div>
                  <div className="text-xs text-gray-500">
                    Giá chỉ từ 395.000 đ
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                {loading ? (
                  <div>Đang tải...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400">
                    Chưa có tin nhắn
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isReceiver = msg.sender_id === RECEIVER_ID;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${
                          isReceiver ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        {renderAvatar(msg)}
                        <div
                          className={`px-3 py-2 rounded max-w-[75%] ${
                            isReceiver ? 'bg-gray-100' : 'bg-blue-50'
                          }`}
                        >
                          <div className="font-semibold text-[13px] mb-[2px]">
                            {renderName(msg)}
                          </div>
                          <div>{msg.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t p-2 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập nội dung chat..."
                  className="flex-1 border rounded px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-[#db4444] hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
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
