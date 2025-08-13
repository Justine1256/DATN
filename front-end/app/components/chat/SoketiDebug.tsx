"use client"

import { useState, useEffect } from "react"
import { Button, Card, Tag, Typography, Space, Alert } from "antd"
import {
  PlayCircleOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons"
import Pusher from "pusher-js"

const { Title, Text, Paragraph } = Typography

export function SoketiDebug() {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [pusherInstance, setPusherInstance] = useState<Pusher | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    if (pusherInstance) {
      pusherInstance.disconnect()
      setPusherInstance(null)
    }

    const config = {
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      host: process.env.NEXT_PUBLIC_PUSHER_HOST,
      port: process.env.NEXT_PUBLIC_PUSHER_PORT,
      scheme: process.env.NEXT_PUBLIC_PUSHER_SCHEME,
    }

    addLog(`Testing connection with config: ${JSON.stringify(config)}`)

    try {
      const pusher = new Pusher(config.key!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "ap1",
        wsHost: config.host,
        wsPort: Number.parseInt(config.port!),
        wssPort: Number.parseInt(config.port!),
        forceTLS: false,
        enabledTransports: ["ws"],
        disableStats: true,
        activityTimeout: 30000,
        pongTimeout: 6000,
        unavailableTimeout: 10000,
      })

      pusher.connection.bind("connecting", () => {
        setConnectionStatus("connecting")
        addLog("Connecting to Soketi server...")
      })

      pusher.connection.bind("connected", () => {
        setConnectionStatus("connected")
        addLog(`Connected! Socket ID: ${pusher.connection.socket_id}`)
      })

      pusher.connection.bind("error", (error: any) => {
        setConnectionStatus("error")
        addLog(`Connection error: ${JSON.stringify(error)}`)
      })

      pusher.connection.bind("disconnected", () => {
        setConnectionStatus("disconnected")
        addLog("Disconnected from server")
      })

      setPusherInstance(pusher)
    } catch (error) {
      addLog(`Failed to create Pusher instance: ${error}`)
      setConnectionStatus("error")
    }
  }

  const testSoketiHealth = async () => {
    const host = process.env.NEXT_PUBLIC_PUSHER_HOST
    const port = process.env.NEXT_PUBLIC_PUSHER_PORT
    const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME

    try {
      addLog("Testing Soketi health endpoint...")
      const response = await fetch(`${scheme}://${host}:${port}/health`)
      if (response.ok) {
        const data = await response.text()
        addLog(`Soketi health check: OK - ${data}`)
      } else {
        addLog(`Soketi health check failed: ${response.status}`)
      }
    } catch (error) {
      addLog(`Soketi health check error: ${error}`)
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
    <Card
      style={{ maxWidth: 800, margin: "0 auto" }}
      title={
        <Space>
          <Title level={3} style={{ margin: 0 }}>
            Soketi Connection Debug
          </Title>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Paragraph type="secondary">Debug tool để kiểm tra kết nối Soketi server</Paragraph>

        <Space align="center">
          <Text strong>Status:</Text>
          <Tag {...getStatusTagProps()}>{connectionStatus}</Tag>
        </Space>

        <div>
          <Title level={5}>Environment Variables:</Title>
          <Card size="small" style={{ backgroundColor: "#f5f5f5" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text code>PUSHER_APP_KEY: {process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "❌ Not set"}</Text>
              <Text code>PUSHER_HOST: {process.env.NEXT_PUBLIC_PUSHER_HOST || "❌ Not set"}</Text>
              <Text code>PUSHER_PORT: {process.env.NEXT_PUBLIC_PUSHER_PORT || "❌ Not set"}</Text>
              <Text code>PUSHER_SCHEME: {process.env.NEXT_PUBLIC_PUSHER_SCHEME || "❌ Not set"}</Text>
            </Space>
          </Card>
        </div>

        <Space>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={testConnection}>
            Test Pusher Connection
          </Button>
          <Button icon={<HeartOutlined />} onClick={testSoketiHealth}>
            Test Soketi Health
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

        <div>
          <Title level={5}>Troubleshooting Steps:</Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Alert
              message="1. Kiểm tra Soketi server config:"
              description={
                <pre style={{ fontSize: "11px", margin: "8px 0 0 0" }}>
                  {`# Trong file .env của Soketi server
PUSHER_APP_ID=2019673
PUSHER_APP_KEY=d13455038dedab3f3d3e
PUSHER_APP_SECRET=0dd7be24fcdccf67189d
PUSHER_APP_CLUSTER=ap1`}
                </pre>
              }
              type="warning"
              showIcon
            />

            <Alert
              message="2. Restart Soketi server:"
              description={
                <pre style={{ fontSize: "11px", margin: "8px 0 0 0" }}>
                  {`pm2 restart soketi
# hoặc
docker restart soketi-container`}
                </pre>
              }
              type="info"
              showIcon
            />

            <Alert
              message="3. Kiểm tra firewall:"
              description={
                <pre style={{ fontSize: "11px", margin: "8px 0 0 0" }}>
                  {`# Đảm bảo port 6001 được mở
sudo ufw allow 6001`}
                </pre>
              }
              type="success"
              showIcon
            />
          </Space>
        </div>
      </Space>
    </Card>
  )
}
