"use client"

import { useState, useEffect } from "react"
import { Button, Card, Tag, Typography, Space } from "antd"
import {
  PlayCircleOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons"
import Pusher from "pusher-js"

const { Title, Text, Paragraph } = Typography

export function PusherDebug() {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [pusherInstance, setPusherInstance] = useState<Pusher | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testPusherConnection = async () => {
    if (pusherInstance) {
      pusherInstance.disconnect()
      setPusherInstance(null)
    }

    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER

    addLog(`Testing Pusher Cloud connection with key=${key}, cluster=${cluster}`)

    try {
      const pusher = new Pusher(key!, {
        cluster:  cluster || "mt1",
        forceTLS: true,
        enabledTransports: ["ws", "wss"],
        disableStats: false,
      })

      pusher.connection.bind("connecting", () => {
        setConnectionStatus("connecting")
        addLog("Connecting to Pusher Cloud...")
      })

      pusher.connection.bind("connected", () => {
        setConnectionStatus("connected")
        addLog(`✅ Connected! Socket ID: ${pusher.connection.socket_id}`)
      })

      pusher.connection.bind("error", (error: any) => {
        setConnectionStatus("error")
        addLog(`❌ Connection error: ${JSON.stringify(error)}`)
      })

      pusher.connection.bind("disconnected", () => {
        setConnectionStatus("disconnected")
        addLog("Disconnected from Pusher Cloud")
      })

      pusher.connection.bind("state_change", (states: any) => {
        addLog(`State change: ${states.previous} -> ${states.current}`)
      })

      setPusherInstance(pusher)
    } catch (error) {
      addLog(`Failed to create Pusher instance: ${error}`)
      setConnectionStatus("error")
    }
  }

  useEffect(() => {
    return () => {
      if (pusherInstance) {
        pusherInstance.disconnect()
      }
    }
  }, [pusherInstance])

  const getStatusTagProps = () => {
    switch (connectionStatus) {
      case "connected":
        return { color: "success", icon: <CheckCircleOutlined /> }
      case "error":
        return { color: "error", icon: <CloseCircleOutlined /> }
      case "connecting":
        return { color: "processing", icon: <SyncOutlined spin /> }
      default:
        return { color: "default" }
    }
  }

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }} title="Pusher Connection Debug">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Paragraph type="secondary">Debug tool để kiểm tra kết nối Pusher Cloud</Paragraph>

        <Space align="center">
          <Text strong>Status:</Text>
          <Tag {...getStatusTagProps()}>{connectionStatus}</Tag>
        </Space>

        <div>
          <Title level={5}>Environment Variables:</Title>
          <Card size="small" style={{ backgroundColor: "#f5f5f5" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text code>PUSHER_APP_KEY: {process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "❌ Not set"}</Text>
              <Text code>PUSHER_APP_CLUSTER: {process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "❌ Not set"}</Text>
            </Space>
          </Card>
        </div>

        <Space wrap>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={testPusherConnection}>
            Test Pusher Connection
          </Button>
          <Button icon={<HeartOutlined />} onClick={() => pusherInstance?.disconnect()}>
            Disconnect
          </Button>
        </Space>

        <div>
          <Title level={5}>Debug Logs:</Title>
          <Card
            size="small"
            style={{
              backgroundColor: "#1f1f1f",
              color: "#00ff00",
              maxHeight: 240,
              overflow: "auto",
            }}
          >
            {logs.length === 0 ? (
              <Text type="secondary">No logs yet...</Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {logs.map((log, index) => (
                  <Text key={index} code style={{ color: "#00ff00", fontSize: "12px" }}>
                    {log}
                  </Text>
                ))}
              </Space>
            )}
          </Card>
        </div>
      </Space>
    </Card>
  )
}
