import { useEffect } from 'react';
import Pusher from 'pusher-js';

export const useChatSocket = (userId: number, token: string, onMessage: (data: any) => void) => {
  useEffect(() => {
    if (!userId || !token) return;

    Pusher.logToConsole = true;

    const pusher = new Pusher('key-0b14c3b7df414a209cf9f13e', {
  cluster: 'mt1',
  forceTLS: true,
  wsHost: 'api.marketo.info.vn',
  wsPort: 6001,
  wssPort: 6001,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'https://api.marketo.info.vn/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`, // hoặc lấy từ localStorage nếu cần
    },
  },
});

    const channel = pusher.subscribe(`private-chat.${userId}`);

    channel.bind('App\\Events\\MessageSent', (data: any) => {
      console.log('📥 Realtime received:', data);
      onMessage(data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId, token]);
};
