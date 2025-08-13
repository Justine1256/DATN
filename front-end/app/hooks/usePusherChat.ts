"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
  const [isConnecting, setIsConnecting] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!currentUserId || !token || isConnecting) return

    setIsConnecting(true)

    cleanup()

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER as string,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      enabledTransports: ["ws", "wss"],
      disabledTransports: [],
    })

    pusher.connection.bind("connecting", () => {
      console.log("🔌 Pusher connecting...")
      onConnectionStatus?.("connecting")
    })

    pusher.connection.bind("connected", () => {
      console.log("✅ Pusher connected")
      setIsConnecting(false)
      onConnectionStatus?.("connected")
    })

    pusher.connection.bind("disconnected", () => {
      console.log("❌ Pusher disconnected")
      setIsConnecting(false)
      onConnectionStatus?.("disconnected")
    })

    pusher.connection.bind("error", (error: any) => {
      console.error("🚨 Pusher connection error:", error)
      setIsConnecting(false)
      onConnectionStatus?.("error")
    })

    const channelName = `private-chat.${currentUserId}`
    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_error", (error: any) => {
      console.error("🚨 Channel subscription error:", error)
      onConnectionStatus?.("error")
    })

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("✅ Channel subscription succeeded:", channelName)
    })

    channel.bind_global((eventName: string, data: any) => {
      console.log("🎯 Pusher event received:", eventName, data)
    })

    channel.bind("MessageSent", (payload: any) => {
      console.log("📨 MessageSent event received:", payload)
      // Đảm bảo payload có đủ thông tin cần thiết
      const message = payload.message || payload
      onData?.({
        type: "message",
        message: message,
        // Thêm thông tin để component biết cần refresh recent contacts
        shouldRefreshContacts: true,
      })
    })

    channel.bind("UserTyping", (payload: any) => {
      console.log("⌨️ UserTyping event received:", payload)
      onData?.({ type: "typing", user_id: payload.user_id, is_typing: payload.is_typing })
    })

    pusherRef.current = pusher
    channelRef.current = channel

    cleanupRef.current = () => {
      try {
        if (channel) {
          channel.unbind_all()
          pusher.unsubscribe(channelName)
        }
        if (pusher && pusher.connection.state !== "disconnected") {
          pusher.disconnect()
        }
      } catch (e) {
        console.warn("Cleanup error:", e)
      }
      pusherRef.current = null
      channelRef.current = null
      setIsConnecting(false)
    }

    return cleanupRef.current
  }, [currentUserId, token, onData, onConnectionStatus, isConnecting, cleanup])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

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

  return { sendTypingEvent, isConnecting }
}
