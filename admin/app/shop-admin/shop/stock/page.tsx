'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card, Form, Input, InputNumber, Button, Select, message,
  Typography, Row, Col, Space, Divider, Table, Tag, Image
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ShoppingCartOutlined, BarChartOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { API_BASE_URL } from '@/utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

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

const StockImportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/shop/products/stock/show`);
      const productList: Product[] = res.data.products;
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      message.error('Không thể tải danh sách sản phẩm tồn kho thấp!');
    }
  };

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchText, products]);

  const handleProductSelect = (productId: number) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    form.setFieldsValue({
      product_id: productId,
      current_stock: product?.stock || 0
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/shop/products/stock/add`, {
        product_id: values.product_id,
        quantity: values.quantity
      });

      message.success(`Đã nhập ${values.quantity} sản phẩm vào kho thành công!`);
      form.resetFields();
      setSelectedProduct(null);
      fetchLowStockProducts();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const productColumns: ColumnType<Product>[] = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'Hết hàng' ? 'red' : 'orange'}>
          {status}
        </Tag>
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
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          style={{ color: '#DB4444', padding: 0 }}
          onClick={() => handleProductSelect(record.id)}
        >
          Chọn
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24, color: '#DB4444' }}>
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
                  <Select
                    placeholder="Chọn sản phẩm cần nhập kho"
                    showSearch
                    onChange={handleProductSelect}
                    filterOption={(input, option) => {
                      const label = option?.children?.toString().toLowerCase() || '';
                      return label.includes(input.toLowerCase());
                    }}
                  >
                    {products.map(product => (
                      <Option key={product.id} value={product.id}>
                        {product.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedProduct && (
                  <div style={{ padding: 12, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }}>
                    <strong>{selectedProduct.name}</strong><br />
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
                    { type: 'number', min: 1, message: 'Số lượng phải > 0!' }
                  ]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập số lượng cần nhập kho" />
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
                    style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
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
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} trong ${total} sản phẩm`
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StockImportPage;
