"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, Space, Typography, Button, Tag } from "antd";
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/utils/api";

const { Title, Paragraph, Text } = Typography;

export default function CheckoutSuccessPage() {
    const p = useSearchParams();
    const router = useRouter();
    const orderId = p.get("order_id") || "";
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (!orderId) return;
        fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((data) => setOrder(data))
            .catch(() => setOrder(null));
    }, [orderId]);

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "24px 16px",
                backgroundColor: "#f8f9fa",
            }}
        >
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* Header */}
                    <Card style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                        </div>
                        <Title level={2} style={{ margin: 0, color: "#52c41a" }}>
                            Đặt hàng thành công
                        </Title>

                        {/* ✅ Hiển thị mã đơn hàng */}
                        {orderId && (
                            <Paragraph style={{ fontSize: 15, marginTop: 8 }}>
                                Mã đơn hàng của bạn: <Text code>{orderId}</Text>
                            </Paragraph>
                        )}

                        <Paragraph style={{ fontSize: 16, marginTop: 8, color: "#666" }}>
                            Cảm ơn bạn đã mua sắm! Đơn hàng của bạn đã được ghi nhận.
                        </Paragraph>
                        <Tag color="success" style={{ fontSize: 14, padding: "4px 12px" }}>
                            COD - Thanh toán khi nhận hàng
                        </Tag>
                    </Card>

                    {/* Buttons */}
                    <Space size="middle" wrap style={{ justifyContent: "center" }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ShoppingOutlined />}
                            onClick={() => router.push("/account?section=orders")}
                            style={{ borderRadius: 6, background: "#db4444" }}
                        >
                            Xem đơn hàng của tôi
                        </Button>
                        <Button
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => router.push("/")}
                            style={{ borderRadius: 6 }}
                        >
                            Về trang chủ
                        </Button>
                    </Space>
                </Space>
            </div>
        </div>
    );
}