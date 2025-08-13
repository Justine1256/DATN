"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Result, Button } from "antd";

export default function PaymentFailed() {
  const sp = useSearchParams();
  const provider = sp.get("provider");
  const reason = sp.get("reason");
  const router = useRouter();

  return (
    <div style={{ padding: 24 }}>
      <Result
        status="error"
        title="Kết nối thất bại"
        subTitle={`Không thể kết nối ${provider?.toUpperCase()}. Lý do: ${reason}`}
        extra={[
          <Button type="primary" key="retry" onClick={() => router.push("/payment-accounts")}>
            Thử lại
          </Button>,
        ]}
      />
    </div>
  );
}
