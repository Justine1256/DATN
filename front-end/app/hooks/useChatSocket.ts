import { useEffect } from 'react';
import Pusher from 'pusher-js';

export const useChatSocket = (
  userId?: number,
  token?: string,
  onMessage?: (data: any) => void
) => {
  useEffect(() => {
    console.log('🟢 useChatSocket chạy với:', userId, token, typeof onMessage);
    if (!userId || !token || !onMessage) return;

    Pusher.logToConsole = true;

const pusher = new Pusher('key-0b14c3b7df414a209cf9f13e', {
  cluster: 'mt1',
  forceTLS: true,
  wsHost: 'api.marketo.info.vn',
  wsPort: 443,
  wssPort: 443,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'https://api.marketo.info.vn/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});


    const channel = pusher.subscribe(`private-chat.chat.${userId}`);
    channel.bind('App\\Events\\MessageSent', (data: any) => {
      console.log('📥 Realtime received:', data);
      onMessage(data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId, token, onMessage]);
};
