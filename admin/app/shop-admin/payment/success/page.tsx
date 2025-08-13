"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Result, Button } from "antd";

export default function PaymentSuccess() {
  const sp = useSearchParams();
  const provider = sp.get("provider");
  const router = useRouter();

  useEffect(() => {
    // có thể fetch lại danh sách nếu muốn, hoặc để người dùng quay lại
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Result
        status="success"
        title="Kết nối thành công!"
        subTitle={`Cổng thanh toán ${provider?.toUpperCase()} đã được kết nối và kích hoạt.`}
        extra={[
          <Button type="primary" key="back" onClick={() => router.push("/payment-accounts")}>
            Quay lại danh sách
          </Button>,
        ]}
      />
    </div>
  );
}
