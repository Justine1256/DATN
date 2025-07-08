import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export const useChatSocket = (
  userId?: number,
  token?: string,
  receiverId?: number,
  onMessage?: (data: any) => void
) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  let pusher: Pusher | null = null; // Explicitly declare the type of 'pusher'

  useEffect(() => {
    if (!token || !userId || !receiverId || !onMessage) {
      return;
    }

    // Kiểm tra token bằng API /api/user
    fetch('https://api.marketo.info.vn/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(res => {
      console.log("Response:", res);
      return res.json();
    })
    .then(data => {
      if (data && data.id === userId) {
        setIsAuthenticated(true);
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

    // Kiểm tra kết nối trước
    if (pusher && pusher.connection.state !== 'connected') {
      pusher.disconnect();
    }

    // Kết nối lại
    pusher = new Pusher('d13455038dedab3f3d3e', {
      cluster: 'ap1',
      forceTLS: true,
      authEndpoint: 'https://api.marketo.info.vn/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const participants = [userId, receiverId].sort((a, b) => a - b);
    const channelName = `private-chat.${participants[0]}.${participants[1]}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('message.sent', (data: any) => {
      if (onMessage) {
        console.log('📥 Realtime received:', data);
        onMessage(data);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, [isAuthenticated, token, userId, receiverId, onMessage]);

};
