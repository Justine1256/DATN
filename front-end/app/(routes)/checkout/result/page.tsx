"use client";

import { useSearchParams } from "next/navigation";
import { Card, Alert, Space, Typography } from "antd";

const { Title, Text } = Typography;

export default function VnpReturnPage() {
  const p = useSearchParams();

  const code = p.get("vnp_ResponseCode");
  const order = p.get("vnp_TxnRef");
  const hash = p.get("vnp_SecureHash");

  const success = code === "00";

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={3}>Kết quả thanh toán</Title>
          <Alert
            message={success ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất"}
            description={
              <div>
                <div><Text strong>vnp_ResponseCode:</Text> {code}</div>
                <div><Text strong>vnp_TxnRef:</Text> {order}</div>
                <div style={{ wordBreak: "break-all" }}>
                  <Text strong>vnp_SecureHash:</Text> {hash}
                </div>
              </div>
            }
            type={success ? "success" : "warning"}
            showIcon
          />
        </Space>
      </Card>
    </div>
  );
}
