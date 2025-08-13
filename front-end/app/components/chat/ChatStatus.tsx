"use client"

import { useEffect, useState } from "react"
import Pusher from "pusher-js"

interface ChatStatusProps {
  userId: number
  token: string
}

interface UserStatus {
  id: number
  online: boolean
  last_seen?: string
}

export default function ChatStatus({ userId, token }: ChatStatusProps) {
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatus>>(new Map())

  useEffect(() => {
    if (!userId || !token) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || "localhost",
      wsPort: Number.parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "6001"),
      wssPort: Number.parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "6001"),
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      authorizer: (channel: any) => {
        return {
          authorize: (socketId: string, callback: Function) => {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then((response) => response.json())
              .then((data) => callback(null, data))
              .catch((error) => callback(error, null))
          },
        }
      },
    })

    // Subscribe to presence channel for online status
    const presenceChannel = pusher.subscribe("presence-online")

    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const newStatuses = new Map()
      members.each((member: any) => {
        newStatuses.set(member.id, { id: member.id, online: true })
      })
      setUserStatuses(newStatuses)
    })

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setUserStatuses((prev) => new Map(prev.set(member.id, { id: member.id, online: true })))
    })

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setUserStatuses((prev) => {
        const newMap = new Map(prev)
        newMap.set(member.id, { id: member.id, online: false, last_seen: new Date().toISOString() })
        return newMap
      })
    })

    return () => {
      pusher.unsubscribe("presence-online")
      pusher.disconnect()
    }
  }, [userId, token])

  return null // This is a utility component, doesn't render anything
}

export const useUserStatus = (userId: number) => {
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatus>>(new Map())

  // This would be connected to the ChatStatus component via context or global state
  const getUserStatus = (id: number): UserStatus | undefined => {
    return userStatuses.get(id)
  }

  return { getUserStatus }
}
