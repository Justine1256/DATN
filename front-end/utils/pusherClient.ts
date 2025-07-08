// utils/pusherClient.ts
import Pusher from 'pusher-js';

export const pusher = new Pusher('0b14c3b7df414a209cf9f13e', {
  cluster: 'mt1',
  forceTLS: true,
});
