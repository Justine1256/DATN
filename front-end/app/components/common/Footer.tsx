'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {
  Row,
  Col,
  Typography,
  Space,
  Form,
  Input,
  Button,
  Divider,
  message,
} from 'antd';
import {
  FacebookFilled,
  TwitterSquareFilled,
  InstagramFilled,
  LinkedinFilled,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Footer() {
  const [form] = Form.useForm();

  const onFinish = (values: { email: string }) => {
    // TODO: gọi API subscribe của bạn ở đây
    message.success(`Đã đăng ký: ${values.email}`);
    form.resetFields();
  };

  return (
    <footer style={{ background: '#111827', color: '#fff' }}>
      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-8">
        {/* Header */}
        <Row gutter={[24, 24]} align="top" justify="space-between">
          {/* Logo + Subscribe (md: 6/24 ~ 3/12) */}
          <Col xs={24} sm={12} md={6}>
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/logoft.png"
                alt="Logo công ty"
                width={140}
                height={40}
                priority
              />
            </Link>

            <Space direction="vertical" size={6} style={{ display: 'block' }}>
              <Text>Đăng ký nhận tin</Text>
              <Text>Nhận 10% giảm giá cho đơn hàng đầu tiên</Text>
            </Space>

            <Form
              form={form}
              layout="inline"
              onFinish={onFinish}
              style={{ marginTop: 12 }}
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
                style={{ flex: 1 }}
              >
                <Input
                  placeholder="Nhập email của bạn"
                  allowClear
                />
              </Form.Item>
              <Form.Item>
                <Button type="default" htmlType="submit" className='bg-brand text-white border-brand'>
                  Đăng ký
                </Button>
              </Form.Item>
            </Form>
          </Col>

            {/* Hỗ trợ (md: 4/24 ~ 2/12) */}
            <Col xs={24} sm={12} md={4}>
              <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Hỗ trợ</Title>
              <Space direction="vertical" size={4}>
                <Text>Fpoly Hồ Chí Minh</Text>
                <Text>Marketo.gmail.com</Text>
                <Text>0978740071</Text>
              </Space>
            </Col>

            {/* Tài khoản (md: 4/24 ~ 2/12) */}
            <Col xs={24} sm={12} md={4}>
              <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Tài khoản</Title>
              <Space direction="vertical" size={6}>
                <Link href="/account" className="ant-typography">Tài khoản của tôi</Link>
                <Link href="/login" className="ant-typography">Đăng nhập / Đăng ký</Link>
                <Link href="/cart" className="ant-typography">Giỏ hàng</Link>
                <Link href="/wishlist" className="ant-typography">Danh sách yêu thích</Link>
                <Link href="/category" className="ant-typography">Mua sắm</Link>
              </Space>
            </Col>

          {/* Liên kết nhanh (md: 4/24 ~ 2/12) */}
          <Col xs={24} sm={12} md={4}>
            <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Liên kết nhanh</Title>
            <Space direction="vertical" size={6}>
              <Link href="/dieu-khoan" className="ant-typography">Điều khoản & Chính sách</Link>
              <Link href="#" className="ant-typography">Câu hỏi thường gặp</Link>
              <Link href="#" className="ant-typography">Liên hệ</Link>
            </Space>
          </Col>

          {/* App + Social (md: 6/24 ~ 3/12) */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Tải ứng dụng</Title>
            <Space align="start" size={16}>
              <Link href="/download-app">
                <Image src="/qr.png" alt="QR Code" width={72} height={72} />
              </Link>
              <Space direction="vertical" size={10}>
                <Link
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image src="/gg.png" alt="Google Play" width={80} height={44} />
                </Link>
                <Link
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image src="/ap.png" alt="App Store" width={80} height={44} />
                </Link>
              </Space>
            </Space>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

            <Space size="large" style={{ fontSize: 22, color: '#9CA3AF' }}>
              <Link href="#" className="hover:text-white">
                <FacebookFilled />
              </Link>
              <Link href="#" className="hover:text-white">
                <TwitterSquareFilled />
              </Link>
              <Link href="#" className="hover:text-white">
                <InstagramFilled />
              </Link>
              <Link href="#" className="hover:text-white">
                <LinkedinFilled />
              </Link>
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', marginTop: 24 }} />

        <Row justify="center">
          <Col>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.65)' }}>
              © {new Date().getFullYear()} Marketo. All rights reserved.
            </Text>
          </Col>
        </Row>
      </div>
      <style jsx global>{`
        .ant-typography {
          color: rgba(255,255,255,0.85);
        }
        .ant-typography:hover {
          color: #ffffff;
        }
      `}</style>
    </footer>
  );
}
