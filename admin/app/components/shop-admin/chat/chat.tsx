'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Search, MoreHorizontal, X } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Image from 'next/image';

interface User {
  id: number;
  name: string;
  avatar: string | null;
  online: boolean;
  last_message?: string;
  last_time?: string;
  unread?: number;
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

export default function AdminChat() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = localStorage.getItem('token') || Cookies.get('authToken');
    if (t) {
      setToken(t);
      fetchUsers(t);
    }
  }, []);


  const fetchUsers = async (t: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/recent-contacts`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUsers(res.data);
      setSelectedUser(res.data[0]);
    } catch (err) {
    }
  };

  useEffect(() => {
    if (selectedUser && token) {
      fetchMessages(selectedUser.id, token);
    }
  }, [selectedUser, token]);

  const fetchMessages = async (receiverId: number, t: string) => {
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { user_id: receiverId },
        headers: { Authorization: `Bearer ${t}` },
      });
      setMessages(
        res.data.sort(
          (a: Message, b: Message) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (err) {
      console.error('❌ Lỗi lấy tin nhắn:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !token || !selectedUser) return;

    try {
      const formData = new FormData();
      formData.append('receiver_id', selectedUser.id.toString());
      formData.append('message', message);

      const res = await axios.post(`${API_BASE_URL}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessages((prev) => [...prev, res.data]);
      setMessage('');
      fetchUsers(token);
    } catch (err) {
      console.error('❌ Lỗi gửi tin nhắn:', err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-9xl w-full flex h-[82vh] bg-gray-50 border rounded-lg shadow overflow-hidden">
        {/* Sidebar */}
        <div className="w-[320px] border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#db4444]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 border-b ${
                  selectedUser?.id === user.id ? 'bg-gray-100' : ''
                }`}
              >
                
<Image
  src={
    user.avatar?.startsWith('http') || user.avatar?.startsWith('/')
      ? user.avatar
      : `${STATIC_BASE_URL}/${user.avatar || 'avatars/default-avatar.jpg'}`
  }
  width={40}
  height={40}
  className="w-10 h-10 rounded-full bg-gray-200 object-cover"
  alt={user.name}
/>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{user.name}</div>
                  <div className="text-sm truncate text-gray-500">{user.last_message}</div>
                </div>
                <div className="text-xs text-gray-500">{user.last_time || ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-col flex-1">
          <div className="p-4 border-b bg-white flex items-center gap-3">
<Image
  src={
    selectedUser?.avatar?.startsWith('http') || selectedUser?.avatar?.startsWith('/')
      ? selectedUser.avatar!
      : `${STATIC_BASE_URL}/${selectedUser?.avatar || 'avatars/default-avatar.jpg'}`
  }
  width={40}
  height={40}
  className="w-10 h-10 rounded-full object-cover"
  alt={selectedUser?.name || ''}
/>
            <div>
              <div className="font-semibold">{selectedUser?.name}</div>
              <div className="text-sm text-green-600">
                {selectedUser?.online ? 'Đang hoạt động' : 'Offline'}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
            {loadingMessages ? (
              <p className="text-center text-sm text-gray-500">Đang tải tin nhắn...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-gray-500">Chưa có tin nhắn nào</p>
            ) : (
              messages.map((msg) => {
                const isSender = msg.sender_id !== selectedUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-md text-sm ${
                        isSender ? 'bg-[#db4444] text-white' : 'bg-white border'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 hover:text-[#db4444] hover:bg-gray-100 rounded-full transition-colors"
              >
                {/* <Image sizes={20} /> */}

              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#db4444]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#db4444] p-3 rounded-lg text-white hover:bg-[#c23e3e] transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
