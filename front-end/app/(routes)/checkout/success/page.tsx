import OrderSuccessContent from "@/app/components/checkout/OrderSuccess"
import { Suspense } from "react"

// Loading component for Suspense fallback
function OrderSuccessLoading() {
  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 12px" }}>
      <div
        style={{
          borderRadius: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          background: "#fff",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>Đang tải...</div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessLoading />}>
      <OrderSuccessContent />
    </Suspense>
  )
}
