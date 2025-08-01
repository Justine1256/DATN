'use client';
import React, { useEffect, useState } from 'react';
import { Table, Card, Form, InputNumber, Select, Button, Tag, message } from 'antd';
import { API_BASE_URL } from '@/utils/api';

interface Product {
  id: number;
  name: string;
  stock: number;
  status?: string;
}

const StockManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchLowStockProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shop/products/stock/show`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setProducts(data.products || []);
      setLowStockProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      message.error('Không thể tải danh sách sản phẩm.');
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const handleImportStock = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/shop/products/stock/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          product_id: values.product_id,
          quantity: values.quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi nhập kho');
      }

      message.success('Nhập kho thành công!');
      form.resetFields();
      fetchLowStockProducts(); // refresh sau khi nhập
    } catch (error: any) {
      message.error(error.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Form nhập kho */}
      <Card title="📦 Nhập kho sản phẩm" style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={handleImportStock} form={form}>
          <Form.Item
            name="product_id"
            rules={[{ required: true, message: 'Chọn sản phẩm' }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              style={{ minWidth: 240 }}
              options={products.map((p) => ({
                label: `${p.name} (${p.stock})`,
                value: p.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            rules={[{ required: true, message: 'Nhập số lượng' }]}
          >
            <InputNumber min={1} placeholder="Số lượng" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Nhập kho
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Bảng sản phẩm cần nhập */}
      {lowStockProducts.length > 0 && (
        <Card title="⚠️ Sản phẩm cần bổ sung" bordered>
          <Table
            dataSource={lowStockProducts}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Sản phẩm',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Tồn kho',
                dataIndex: 'stock',
                key: 'stock',
                align: 'center',
                render: (stock) => (
                  <Tag color={stock === 0 ? 'red' : 'orange'}>{stock}</Tag>
                ),
              },
              {
                title: 'Trạng thái',
                key: 'status',
                render: (_, record) => (
                  <Tag color={record.stock === 0 ? 'red' : 'orange'}>
                    {record.stock === 0 ? 'Hết hàng' : 'Cần bổ sung'}
                  </Tag>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default StockManager;
