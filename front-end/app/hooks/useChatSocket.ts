"use client"

import { useEffect, useRef, useCallback } from "react"
import Pusher from "pusher-js"

interface ChatSocketData {
  type: string
  message?: any
  user_id?: number
  is_typing?: boolean
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export function useChatSocket(
  currentUserId: number | undefined,
  token: string,
  receiverId: number | undefined,
  onSocketData: (data: ChatSocketData) => void,
  onConnectionStatus: (status: ConnectionStatus) => void,
) {
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)

  // Initialize Pusher connection
  useEffect(() => {
    if (!currentUserId || !token) {
      return
    }

    onConnectionStatus("connecting")

    try {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
        authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL || "/api"}/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })

      // Connection event handlers
      pusherRef.current.connection.bind("connected", () => {
        onConnectionStatus("connected")
      })

      pusherRef.current.connection.bind("disconnected", () => {
        onConnectionStatus("disconnected")
      })

      pusherRef.current.connection.bind("error", (error: any) => {
        console.error("❌ Pusher connection error:", error)
        onConnectionStatus("error")
      })

      // Subscribe to user's private channel for receiving messages
      const userChannel = pusherRef.current.subscribe(`private-user.${currentUserId}`)

      userChannel.bind("message", (data: any) => {
        onSocketData({
          type: "message",
          message: data,
        })
      })

      userChannel.bind("typing", (data: any) => {
        onSocketData({
          type: "typing",
          user_id: data.user_id,
          is_typing: data.is_typing,
        })
      })

      channelRef.current = userChannel
    } catch (error) {
      console.error("❌ Failed to initialize Pusher:", error)
      onConnectionStatus("error")
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        pusherRef.current?.unsubscribe(`private-user.${currentUserId}`)
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect()
      }
    }
  }, [currentUserId, token, onSocketData, onConnectionStatus])

  // Send typing event
  const sendTypingEvent = useCallback(
    (isTyping: boolean) => {
      if (!receiverId || !currentUserId || !pusherRef.current) {
        return
      }

      try {
        const receiverChannel = pusherRef.current.subscribe(`private-user.${receiverId}`)
        receiverChannel.trigger("client-typing", {
          user_id: currentUserId,
          is_typing: isTyping,
        })

      } catch (error) {
        console.error("❌ Failed to send typing event:", error)
      }
    },
    [receiverId, currentUserId],
  )

  return {
    sendTypingEvent,
    pusher: pusherRef.current,
  }
}
