"use client";

import { useState } from "react";
import { Card, Button, Form, Input, InputNumber, Alert, Space, Typography } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "@/utils/api";

const { Title, Text } = Typography;

export default function VNPayTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async (values: any) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/vnpay/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,          // VND (ví dụ 100000)
          orderInfo: values.order_info || "Test payment",
          // KHÔNG gửi return_url từ FE
        }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, data });
      if (res.ok && data.payment_url) {
        // Redirect nguyên xi, KHÔNG parse/rebuild URL
        window.location.href = data.payment_url;
      }
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={3}>VNPay Integration Test</Title>
            <Alert message="FE không chứa secret, không tự verify; mọi ký/verify ở BE" type="info" showIcon />
          </div>

          <Form layout="vertical" onFinish={handleTest} initialValues={{ amount: 100000, order_info: "Test" }}>
            <Form.Item label="Số tiền (VND)" name="amount" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={10000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
            </Form.Item>
            <Form.Item label="Thông tin đơn hàng" name="order_info">
              <Input placeholder="Mô tả" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={loading} icon={<RocketOutlined />} style={{ width: "100%" }}>
                {loading ? "Đang tạo thanh toán..." : "Tạo thanh toán VNPay"}
              </Button>
            </Form.Item>
          </Form>

          {result && (
            <Card type="inner" title="Kết quả">
              {result.ok ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Alert message="Tạo payment URL thành công – sẽ chuyển đến VNPay" type="success" showIcon />
                  <Text strong>Payment URL:</Text>
                  <Text code style={{ wordBreak: "break-all" }}>{result.data?.payment_url}</Text>
                </Space>
              ) : (
                <Alert message="Lỗi tạo payment URL" description={result.error ? String(result.error) : JSON.stringify(result.data)} type="error" showIcon />
              )}
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
}
