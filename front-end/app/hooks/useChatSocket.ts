"use client"

import { useEffect, useRef } from "react"
import Pusher from "pusher-js"

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string | null
  image: string | null
  created_at: string
  sender: {
    id: number
    name: string
    avatar: string | null
    role: string
  }
  receiver: {
    id: number
    name: string
    avatar: string | null
    role: string
  }
}

interface MessageEvent {
  type: "message"
  message: Message
}

interface TypingEvent {
  type: "typing"
  user_id: number
  is_typing: boolean
}

type ChatSocketData = MessageEvent | TypingEvent

export const useChatSocket = (
  currentUserId: number | undefined,
  token: string,
  receiverId: number | undefined,
  onMessageReceived: (data: ChatSocketData) => void,
  onConnectionStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void,
) => {
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!currentUserId || !token || !receiverId) {
      console.log("❌ Missing required data:", { currentUserId, hasToken: !!token, receiverId })
      return
    }

    if (!pusherRef.current) {
      console.log("🔧 Initializing Pusher with config:", {
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
        host: process.env.NEXT_PUBLIC_PUSHER_HOST,
        port: process.env.NEXT_PUBLIC_PUSHER_PORT,
        scheme: process.env.NEXT_PUBLIC_PUSHER_SCHEME,
      })

      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "mt1",
        wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || "103.75.180.105",
        wsPort: Number.parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "6001"),
        wssPort: Number.parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "6001"),
        forceTLS: false,
        enabledTransports: ["ws"], // Chỉ dùng WebSocket, không fallback
        disableStats: true,
        activityTimeout: 30000,
        pongTimeout: 6000,
        unavailableTimeout: 10000,
      })

      // Updated connection event handlers to report status
      pusherRef.current.connection.bind("connected", () => {
        console.log("✅ Pusher connected successfully - Socket ID:", pusherRef.current?.connection.socket_id)
        onConnectionStatusChange?.("connected")
      })

      pusherRef.current.connection.bind("error", (error: any) => {
        console.error("❌ Pusher connection error:", error)
        onConnectionStatusChange?.("error")
      })

      pusherRef.current.connection.bind("disconnected", () => {
        console.log("🔌 Pusher disconnected")
        onConnectionStatusChange?.("disconnected")
      })

      pusherRef.current.connection.bind("unavailable", () => {
        console.log("⚠️ Pusher connection unavailable")
        onConnectionStatusChange?.("error")
      })

      // Set initial connecting status
      onConnectionStatusChange?.("connecting")
    }

    // Tạo channel name theo format của Laravel Event
    const user1 = Math.min(currentUserId, receiverId)
    const user2 = Math.max(currentUserId, receiverId)
    const channelName = `chat.${user1}.${user2}` // Removed "private-" prefix

    console.log(`🔌 Subscribing to channel: ${channelName} (User ${currentUserId} -> User ${receiverId})`)

    // Subscribe to public channel
    channelRef.current = pusherRef.current.subscribe(channelName)

    channelRef.current.bind("message.sent", (data: { message: Message }) => {
      console.log("📨 New message received via WebSocket:", data)
      onMessageReceived({ type: "message", message: data.message })
    })

    channelRef.current.bind("client-typing", (data: { user_id: number; is_typing: boolean }) => {
      console.log("⌨️ Typing event received:", data, "Current user:", currentUserId)
      onMessageReceived({ type: "typing", user_id: data.user_id, is_typing: data.is_typing })
    })

    // Debug logs cho subscription events
    channelRef.current.bind("pusher:subscription_succeeded", (members: any) => {
      console.log(`✅ Successfully subscribed to ${channelName}`, members)
      console.log("🔍 Channel state:", channelRef.current?.subscribed)
    })

    channelRef.current.bind("pusher:subscription_error", (error: any) => {
      console.error(`❌ Subscription error for ${channelName}:`, error)
    })

    // Debug cho member events
    channelRef.current.bind("pusher:member_added", (member: any) => {
      console.log("👤 Member added to channel:", member)
    })

    channelRef.current.bind("pusher:member_removed", (member: any) => {
      console.log("👤 Member removed from channel:", member)
    })

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`🧹 Cleaning up channel: ${channelName}`)
        channelRef.current.unbind_all()
        pusherRef.current?.unsubscribe(channelName)
        channelRef.current = null
      }
    }
  }, [currentUserId, token, receiverId, onMessageReceived, onConnectionStatusChange])

  const sendTypingEvent = (isTyping: boolean) => {
    if (!currentUserId || !receiverId || !channelRef.current) {
      console.log("❌ Cannot send typing event - missing data:", {
        currentUserId,
        receiverId,
        hasChannel: !!channelRef.current,
        channelSubscribed: channelRef.current?.subscribed,
      })
      return
    }

    console.log("⌨️ Sending typing event:", { user_id: currentUserId, is_typing: isTyping })
    console.log("📡 Channel subscribed:", channelRef.current.subscribed)

    try {
      channelRef.current.trigger("client-typing", {
        user_id: currentUserId,
        is_typing: isTyping,
      })
      console.log("✅ Typing event sent successfully")
    } catch (error) {
      console.error("❌ Error sending typing event:", error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect()
        pusherRef.current = null
      }
    }
  }, [])

  return { sendTypingEvent }
}
