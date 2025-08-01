'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, InputNumber, Button, Select, message, 
  Typography, Row, Col, Space, Divider, Table, Tag, Image, Tooltip
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ShoppingCartOutlined,
   BarChartOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
  status: string;
}

interface ImportHistory {
  id: number;
  product_name: string;
  quantity: number;
  date: string;
  user: string;
}

const StockImportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

  // Mock data for products
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'iPhone 14 Pro Max',
        sku: 'IP14PM001',
        price: 25000000,
        stock: 15,
        category: 'Điện thoại',
        status: 'active',
        image: 'https://via.placeholder.com/60x60'
      },
      {
        id: 2,
        name: 'Samsung Galaxy S23',
        sku: 'SGS23001',
        price: 18000000,
        stock: 8,
        category: 'Điện thoại',
        status: 'active',
        image: 'https://via.placeholder.com/60x60'
      },
      {
        id: 3,
        name: 'MacBook Air M2',
        sku: 'MBA2022',
        price: 32000000,
        stock: 5,
        category: 'Laptop',
        status: 'active',
        image: 'https://via.placeholder.com/60x60'
      },
      {
        id: 4,
        name: 'AirPods Pro 2',
        sku: 'APP2001',
        price: 6500000,
        stock: 25,
        category: 'Phụ kiện',
        status: 'active',
        image: 'https://via.placeholder.com/60x60'
      },
      {
        id: 5,
        name: 'iPad Pro 11 inch',
        sku: 'IPP11001',
        price: 22000000,
        stock: 3,
        category: 'Tablet',
        status: 'low_stock',
        image: 'https://via.placeholder.com/60x60'
      }
    ];

    const mockHistory: ImportHistory[] = [
      {
        id: 1,
        product_name: 'iPhone 14 Pro Max',
        quantity: 10,
        date: '2024-12-01 14:30',
        user: 'Admin'
      },
      {
        id: 2,
        product_name: 'Samsung Galaxy S23',
        quantity: 5,
        date: '2024-12-01 10:15',
        user: 'Admin'
      },
      {
        id: 3,
        product_name: 'MacBook Air M2',
        quantity: 3,
        date: '2024-11-30 16:45',
        user: 'Admin'
      }
    ];

    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
    setImportHistory(mockHistory);
  }, []);

  // Filter products based on search
  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchText.toLowerCase())
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`Đã nhập ${values.quantity} sản phẩm vào kho thành công!`);
      
      // Update local stock
      if (selectedProduct) {
        const updatedProducts = products.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, stock: p.stock + values.quantity }
            : p
        );
        setProducts(updatedProducts);
        
        // Add to history
        const newHistoryItem: ImportHistory = {
          id: importHistory.length + 1,
          product_name: selectedProduct.name,
          quantity: values.quantity,
          date: new Date().toLocaleString('vi-VN'),
          user: 'Admin'
        };
        setImportHistory([newHistoryItem, ...importHistory]);
      }
      
      form.resetFields();
      setSelectedProduct(null);
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const productColumns: ColumnType<Product>[] = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      align: 'center',
      render: (image: string, record) => (
        <Image
          src={image}
          alt={record.name}
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 8 }}
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (price: number) => (
        <Text strong style={{ color: '#DB4444' }}>
          {price.toLocaleString('vi-VN')}đ
        </Text>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      align: 'center',
      render: (stock: number, record) => {
        let color = 'green';
        if (stock === 0) color = 'red';
        else if (stock < 10) color = 'orange';
        
        return (
          <Tag color={color} style={{ fontWeight: 500 }}>
            {stock}
          </Tag>
        );
      },
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

  const historyColumns: ColumnType<ImportHistory>[] = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (quantity: number) => (
        <Tag color="green">+{quantity}</Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: 'Người nhập',
      dataIndex: 'user',
      key: 'user',
      width: 100,
    },
  ];

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24, color: '#DB4444' }}>
          Nhập kho sản phẩm
        </Title>

        <Row gutter={24}>
          {/* Form nhập kho */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <PlusOutlined />
                  Thông tin nhập kho
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  label="Sản phẩm"
                  name="product_id"
                  rules={[
                    { required: true, message: 'Vui lòng chọn sản phẩm!' }
                  ]}
                >
                  <Select
                    placeholder="Chọn sản phẩm cần nhập kho"
                    showSearch
                    filterOption={(input, option) => {
                      if (!option?.children) return false;
                      const children = option.children as React.ReactNode;
                      const childrenStr = typeof children === 'string' ? children : children?.toString() || '';
                      return childrenStr.toLowerCase().includes(input.toLowerCase());
                    }}
                    onChange={handleProductSelect}
                  >
                    {products.map(product => (
                      <Option key={product.id} value={product.id}>
                        {product.name} - SKU: {product.sku}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedProduct && (
                  <div style={{ 
                    padding: 16, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 8,
                    marginBottom: 16
                  }}>
                    <Row gutter={16} align="middle">
                      <Col flex="60px">
                        <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          width={50}
                          height={50}
                          style={{ borderRadius: 8 }}
                        />
                      </Col>
                      <Col flex="1">
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>
                          {selectedProduct.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          SKU: {selectedProduct.sku}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Tồn kho hiện tại: <strong>{selectedProduct.stock}</strong>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                <Form.Item
                  label="Tồn kho hiện tại"
                  name="current_stock"
                >
                  <Input 
                    disabled
                    prefix={<BarChartOutlined />}
                    placeholder="Chọn sản phẩm để xem tồn kho"
                  />
                </Form.Item>

                <Form.Item
                  label="Số lượng nhập"
                  name="quantity"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng!' },
                    { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0!' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Nhập số lượng cần nhập kho"
                    min={1}
                    
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
                    style={{ 
                      backgroundColor: '#DB4444', 
                      borderColor: '#DB4444',
                      height: 48
                    }}
                    icon={<ShoppingCartOutlined />}
                  >
                    Nhập kho
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Danh sách sản phẩm */}
          <Col xs={24} lg={16}>
            <Card 
              title="Danh sách sản phẩm"
              extra={
                <Input.Search
                  placeholder="Tìm kiếm sản phẩm..."
                  allowClear
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              }
              style={{ marginBottom: 24 }}
            >
              <Table
                columns={productColumns}
                dataSource={filteredProducts}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} sản phẩm`,
                }}
                scroll={{ x: 600 }}
              />
            </Card>

            {/* Lịch sử nhập kho */}
            <Card title="Lịch sử nhập kho gần đây">
              <Table
                columns={historyColumns}
                dataSource={importHistory}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
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