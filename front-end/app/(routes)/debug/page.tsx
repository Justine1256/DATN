import { PusherDebug } from "@/app/components/chat/SoketiDebug"
import { Layout } from "antd"

const { Content } = Layout

export default function DebugPage() {
  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <PusherDebug />
    </Layout>
  )
}
