"use client"

import { useEffect, useRef } from "react"
import Pusher from "pusher-js"
import axios from "axios"
import { API_BASE_URL } from "@/utils/api"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export function usePusherChat(
  currentUserId?: number | null,
  token?: string | null,
  receiverId?: number | null,
  onData?: (data: any) => void,
  onConnectionStatus?: (status: ConnectionStatus) => void,
) {
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!currentUserId || !token) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER as string,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // connection events
    pusher.connection.bind("connecting", () => onConnectionStatus?.("connecting"))
    pusher.connection.bind("connected", () => onConnectionStatus?.("connected"))
    pusher.connection.bind("disconnected", () => onConnectionStatus?.("disconnected"))
    pusher.connection.bind("error", () => onConnectionStatus?.("error"))

    const channelName = `private-chat.${currentUserId}`
    const channel = pusher.subscribe(channelName)

    channel.bind("MessageSent", (payload: any) => {
      onData?.({ type: "message", message: payload.message ?? payload })
    })

    channel.bind("UserTyping", (payload: any) => {
      onData?.({ type: "typing", user_id: payload.user_id, is_typing: payload.is_typing })
    })

    pusherRef.current = pusher
    channelRef.current = channel

    return () => {
      try {
        channel.unbind_all?.()
        pusher.unsubscribe(channelName)
        pusher.disconnect()
      } catch (e) {
        // ignore
      }
      pusherRef.current = null
      channelRef.current = null
    }
  }, [currentUserId, token, onData, onConnectionStatus])

  async function sendTypingEvent(isTyping: boolean, targetReceiverId?: number | null) {
    if (!token) return

    const payload = {
      receiver_id: targetReceiverId || receiverId,
      is_typing: isTyping,
    }

    try {
      await axios.post(`${API_BASE_URL}/typing`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.warn("usePusherChat: typing API failed", err)
    }
  }

  return { sendTypingEvent }
}
