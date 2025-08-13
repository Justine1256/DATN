// app/hooks/usePusherChat.ts
"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export function usePusherChat(
  currentUserId?: number | null,
  token?: string | null,
  onData?: (data: any) => void,
  onConnectionStatus?: (status: ConnectionStatus) => void
) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId || !token) return;

    // init
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      // optional: forceTLS: true,
    });

    // connection events
    pusher.connection.bind("connecting", () => onConnectionStatus?.("connecting"));
    pusher.connection.bind("connected", () => onConnectionStatus?.("connected"));
    pusher.connection.bind("disconnected", () => onConnectionStatus?.("disconnected"));
    pusher.connection.bind("error", () => onConnectionStatus?.("error"));

    // subscribe private channel for this user
    const channelName = `private-chat.${currentUserId}`;
    const channel = pusher.subscribe(channelName);

    // Bind server broadcast events (tên event có thể khác tùy backend)
    channel.bind("MessageSent", (payload: any) => {
      // normalize to your UI shape if needed
      onData?.({ type: "message", message: payload.message ?? payload });
    });

    channel.bind("UserTyping", (payload: any) => {
      onData?.({ type: "typing", user_id: payload.user_id, is_typing: payload.is_typing });
    });

    pusherRef.current = pusher;
    channelRef.current = channel;

    return () => {
      try {
        channel.unbind_all?.();
        pusher.unsubscribe(channelName);
        pusher.disconnect();
      } catch (e) {
        // ignore
      }
      pusherRef.current = null;
      channelRef.current = null;
    };
  }, [currentUserId, token, onData, onConnectionStatus]);

  /**
   * sendTypingEvent
   * - isTyping: boolean
   * - targetReceiverId: optional id of user who should see typing (backend may handle)
   *
   * Implementation strategy:
   * 1) Call a backend endpoint `/typing` (preferred) which will broadcast to the target.
   * 2) Fallback: try to trigger a client event (client-typing) on the channel (works only if Pusher client events enabled).
   */
  async function sendTypingEvent(isTyping: boolean, targetReceiverId?: number | null) {
    if (!token) return;

    const payload = {
      user_id: currentUserId,
      receiver_id: targetReceiverId ?? null,
      is_typing: isTyping,
    };

    // 1) Preferred: call server API that will broadcast the typing event (recommended)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}/typing`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return;
    } catch (err) {
      console.warn("usePusherChat: typing API failed, will try client trigger as fallback", err);
    }

    // 2) Fallback: attempt client trigger (only works if server/pusher settings allow client events)
    try {
      channelRef.current?.trigger?.("client-typing", payload);
    } catch (e) {
      console.warn("usePusherChat: client trigger failed", e);
    }
  }

  return { sendTypingEvent };
}
