'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Result,
    Button,
    Card,
    Typography,
    Descriptions,
    Space,
    Divider,
} from 'antd';
import {
    CheckCircleTwoTone,
    HomeOutlined,
    ShoppingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BRAND = '#DB4444';

function formatVND(n: number) {
    if (!Number.isFinite(n)) return '—';
    return new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n))) + 'đ';
}

export default function OrderSuccessPage() {
    const params = useSearchParams();

    // Có thể truyền từ trang thanh toán: /checkout/success?orderId=ABC123&total=1230000&payment=vnpay
    const orderId = params.get('orderId') || '';
    const total = useMemo(() => Number(params.get('total') || 0), [params]);
    const paymentMethod = (params.get('payment') || 'cod').toUpperCase();

    return (
        <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 12px' }}>
            <Card
                bordered={false}
                style={{
                    borderRadius: 14,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                }}
                bodyStyle={{ padding: 24 }}
            >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Result
                        status="success"
                        title={
                            <Space direction="vertical" size={6}>
                                <Title level={3} style={{ margin: 0 }}>
                                    Đặt hàng thành công!
                                </Title>
                                <Text type="secondary">
                                    Cảm ơn bạn đã mua sắm. Chúng tôi đang xử lý đơn và sẽ sớm giao đến bạn.
                                </Text>
                            </Space>
                        }
                        icon={<CheckCircleTwoTone twoToneColor={BRAND} style={{ fontSize: 60 }} />}
                        extra={
                            <Space wrap>
                                <Link href="/" passHref>
                                    <Button size="middle" icon={<HomeOutlined />}>
                                        Quay về trang chủ
                                    </Button>
                                </Link>
                                <Link href="/category" passHref>
                                    <Button
                                        type="primary"
                                        size="middle"
                                        icon={<ShoppingOutlined />}
                                        style={{ background: BRAND, borderColor: BRAND }}
                                    >
                                        Tiếp tục mua sắm
                                    </Button>
                                </Link>
                            </Space>
                        }
                    />

                    <Divider style={{ margin: '12px 0' }} />

                    <Descriptions
                        title={<Text strong>Thông tin đơn hàng</Text>}
                        column={{ xs: 1, sm: 2 }}
                        bordered
                        size="middle"
                        labelStyle={{ width: 180 }}
                        contentStyle={{ background: '#fff' }}
                    >
                        <Descriptions.Item label="Mã đơn hàng">
                            {orderId ? <Text code>{orderId}</Text> : <Text type="secondary">Không có</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng thanh toán">
                            <Text strong style={{ color: BRAND }}>{formatVND(total)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức thanh toán">
                            <Text>{paymentMethod}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Text>Đang xử lý</Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Card
                        bordered
                        style={{ borderRadius: 12 }}
                        bodyStyle={{ padding: 16 }}
                    >
                        <Space direction="vertical" size={4}>
                            <Text strong>Gợi ý:</Text>
                            <Text type="secondary">
                                • Bạn sẽ nhận được email/Xác nhận trong tài khoản khi đơn được xác nhận.
                            </Text>
                            <Text type="secondary">
                                • Hãy giữ lại mã đơn hàng để tiện tra cứu hỗ trợ.
                            </Text>
                        </Space>
                    </Card>
                </Space>
            </Card>

            {/* Style phụ cho brand */}
            <style jsx global>{`
        .ant-result-success .ant-result-icon > span {
          color: ${BRAND} !important;
        }
        .ant-btn-primary:hover,
        .ant-btn-primary:focus {
          background: ${BRAND} !important;
          border-color: ${BRAND} !important;
          filter: brightness(0.95);
        }
      `}</style>
        </div>
    );
}
