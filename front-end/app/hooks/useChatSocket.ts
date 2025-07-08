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

 const pusher = new Pusher('d13455038dedab3f3d3e', {
  cluster: 'ap1',
  forceTLS: true,
  authEndpoint: 'https://api.marketo.info.vn/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});


    const channel = pusher.subscribe(`private-chat.${userId}`);
    channel.bind('MessageSent', (data: any) => {
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
