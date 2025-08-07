import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

export const useChatSocket = (
  userId?: number,
  token?: string,
  receiverId?: number,
  onMessage?: (data: any) => void
) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pusherRef = useRef<Pusher | null>(null); // Sử dụng useRef để lưu trữ pusher instance

  useEffect(() => {
    if (!token || !userId || !receiverId || !onMessage) {
      return;
    }

    // Kiểm tra token chỉ một lần khi component mount
    fetch('https://api.marketo.info.vn/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.id === userId) {
        setIsAuthenticated(true); // Nếu token hợp lệ, xác nhận người dùng
      } else {
        console.error('Token không hợp lệ hoặc không phải người dùng này');
      }
    })
    .catch(error => {
      console.error('Lỗi xác minh token:', error);
    });
  }, [token, userId, receiverId, onMessage]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !receiverId) return;

    // Nếu chưa có kết nối pusher, tạo mới kết nối
    if (!pusherRef.current) {
      pusherRef.current = new Pusher('d13455038dedab3f3d3e', {
        cluster: 'ap1',
        forceTLS: true,
      });

      const participants = [userId, receiverId].sort((a, b) => a - b);
      const channelName = `chat.${participants[0]}.${participants[1]}`; // Kênh công khai
      const channel = pusherRef.current.subscribe(channelName);

      channel.bind('message.sent', (data: any) => {
        if (onMessage) {
          onMessage(data); // Xử lý tin nhắn nhận được
        }
      });
    }

    return () => {
      // Ngắt kết nối Pusher khi component unmount
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [isAuthenticated, userId, receiverId, onMessage]);

};
