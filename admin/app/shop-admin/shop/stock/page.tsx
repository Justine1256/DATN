'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  message,
  Typography,
  Row,
  Col,
  Space,
  Divider,
  Table,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

const { Title, Text } = Typography;

interface Product {
  id: number;
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  image?: string;
  category?: string;
  status: string;
}

const BRAND = '#DB4444';

const StockImportPage: React.FC = () => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');

  // ===== Popup trượt ngang (đặt dưới header) =====
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');
  const [popupTop, setPopupTop] = useState<number>(88); // fallback

  const triggerPopup = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
    window.setTimeout(() => setShowPopup(false), 2000);
  };

  // đo chiều cao header rồi đặt top cho popup
  useEffect(() => {
    const computeTop = () => {
      // Ưu tiên id của header nếu bạn có: #site-header
      const headerEl =
        document.querySelector('#site-header') ||
        document.querySelector('header') ||
        document.querySelector('.ant-layout-header');

      const h = headerEl?.getBoundingClientRect().height ?? 64;
      setPopupTop(h + 12); // cách header 12px
    };

    computeTop();
    window.addEventListener('resize', computeTop);
    window.addEventListener('scroll', computeTop);
    return () => {
      window.removeEventListener('resize', computeTop);
      window.removeEventListener('scroll', computeTop);
    };
  }, []);

  // ===== Load danh sách tồn kho thấp =====
  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        message.error('Không tìm thấy token đăng nhập!');
        triggerPopup('Không tìm thấy token đăng nhập!', 'error');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/shop/products/stock/show`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productList: Product[] = res.data?.products ?? [];
      setProducts(productList);
      setFilteredProducts(productList);
    } catch {
      message.error('Không thể tải danh sách sản phẩm tồn kho thấp!');
      triggerPopup('Không thể tải danh sách sản phẩm tồn kho thấp!', 'error');
    }
  };

  // search local
  useEffect(() => {
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()),
    );
    setFilteredProducts(filtered);
  }, [searchText, products]);

  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId) || null;
    setSelectedProduct(product);
    form.setFieldsValue({
      product_id: productId,
      current_stock: product?.stock ?? 0,
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        message.error('Không tìm thấy token đăng nhập!');
        triggerPopup('Không tìm thấy token đăng nhập!', 'error');
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_BASE_URL}/shop/products/stock/add`,
        {
          product_id: values.product_id,
          quantity: values.quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const msg = `Đã nhập ${values.quantity} sản phẩm vào kho thành công!`;
      message.success(msg);
      triggerPopup(msg, 'success');

      form.resetFields();
      setSelectedProduct(null);
      fetchLowStockProducts();
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại!';
      message.error(errMsg);
      triggerPopup(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== Bảng =====
  const productColumns: ColumnType<Product>[] = useMemo(
    () => [
      {
        title: 'Tên sản phẩm',
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record) => (
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>ID: {record.id}</div>
          </div>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string) => (
          <Tag color={status === 'Hết hàng' ? 'red' : 'orange'}>{status}</Tag>
        ),
      },
      {
        title: 'Tồn kho',
        dataIndex: 'stock',
        key: 'stock',
        width: 100,
        align: 'center',
        render: (stock: number) => (
          <Tag color={stock === 0 ? 'red' : 'orange'}>{stock}</Tag>
        ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <Button
            type="link"
            style={{ color: BRAND, padding: 0 }}
            onClick={() => handleProductSelect(record.id)}
          >
            Chọn
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div style={{ padding: 16, minHeight: '100vh' }}>
      {/* Popup trượt ngang – đặt dưới header */}
      {showPopup && (
        <div
          className={`fixed right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg animate-slide-in text-white
          ${popupType === 'success'
              ? 'bg-green-500'
              : popupType === 'error'
                ? 'bg-red-500'
                : 'bg-[#DB4444]'
            }`}
          style={{ top: popupTop }}
          role="alert"
        >
          {/* icon theo loại */}
          {popupType === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : popupType === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
            </svg>
          )}

          <span className="text-sm font-medium">{popupMessage}</span>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24, color: BRAND }}>
          Nhập kho sản phẩm
        </Title>

        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <PlusOutlined />
                  Thông tin nhập kho
                </Space>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  label="Sản phẩm"
                  name="product_id"
                  rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
                >
                  {/* ✅ Fix TS: dùng options + optionFilterProp="label" */}
                  <Select
                    placeholder="Chọn sản phẩm cần nhập kho"
                    showSearch
                    optionFilterProp="label"
                    options={products.map((p) => ({
                      label: p.name,     // string để filter không lỗi
                      value: p.id,       // number ok
                    }))}
                    onChange={(val) => handleProductSelect(Number(val))}
                  />
                </Form.Item>

                {selectedProduct && (
                  <div
                    style={{
                      padding: 12,
                      background: '#f0f0f0',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <strong>{selectedProduct.name}</strong>
                    <br />
                    <Text type="secondary">Tồn kho hiện tại: {selectedProduct.stock}</Text>
                  </div>
                )}

                <Form.Item label="Tồn kho hiện tại" name="current_stock">
                  <Input disabled prefix={<BarChartOutlined />} />
                </Form.Item>

                <Form.Item
                  label="Số lượng nhập"
                  name="quantity"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng!' },
                    { type: 'number', min: 1, message: 'Số lượng phải > 0!' },
                  ]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="Nhập số lượng cần nhập kho"
                  />
                </Form.Item>

                <Divider />

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    style={{ backgroundColor: BRAND, borderColor: BRAND }}
                  >
                    Nhập kho
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title="Danh sách sản phẩm tồn kho thấp"
              extra={
                <Input.Search
                  placeholder="Tìm kiếm sản phẩm..."
                  allowClear
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              }
            >
              <Table
                columns={productColumns}
                dataSource={filteredProducts}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} sản phẩm`,
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Keyframes cho hiệu ứng trượt ngang */}
      <style jsx global>{`
        @keyframes slide-in {
          0% { transform: translateX(24px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default StockImportPage;
