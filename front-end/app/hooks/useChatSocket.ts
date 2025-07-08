import { useEffect } from 'react';
import Pusher from 'pusher-js';

export const useChatSocket = (
  userId?: number,
  token?: string,
  receiverId?: number,
  onMessage?: (data: any) => void
) => {
  useEffect(() => {
    console.log('🟢 useChatSocket chạy với:', userId, token, receiverId);
    if (!userId || !token || !receiverId || !onMessage) return;

    Pusher.logToConsole = true;

    const pusher = new Pusher('d13455038dedab3f3d3e', {
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
      console.log('📥 Realtime received:', data);
      onMessage(data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId, token, receiverId, onMessage]);
};
