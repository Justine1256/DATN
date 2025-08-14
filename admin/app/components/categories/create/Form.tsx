'use client';

import React, { useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Typography,
} from 'antd';

const { Title } = Typography;

type CategoryInfo = {
  name?: string;
  createdBy?: 'Admin' | 'Seller' | string;
  stock?: number | string;
  id?: string;
  description?: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
};

interface CategoryInfoFormProps {
  data: CategoryInfo;
  setData: (field: string, value: string) => void; // keep your original signature
}

export default function CategoryInfoForm({
  data,
  setData,
}: CategoryInfoFormProps) {
  // For InputNumber, convert to number or undefined so it’s controlled correctly.
  const stockValue = useMemo(() => {
    if (data?.stock === '' || data?.stock === undefined || data?.stock === null) return undefined;
    const n = Number(data.stock);
    return Number.isFinite(n) ? n : undefined;
  }, [data?.stock]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* General Information */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>General Information</Title>}
        bordered
        bodyStyle={{ paddingTop: 16 }}
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Category Title">
                <Input
                  placeholder="Enter category title"
                  value={data?.name ?? ''}
                  onChange={(e) => setData('name', e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Created By">
                <Select
                  placeholder="Select"
                  value={data?.createdBy ?? ''}
                  onChange={(val) => setData('createdBy', String(val))}
                  options={[
                    { label: 'Admin', value: 'Admin' },
                    { label: 'Seller', value: 'Seller' },
                  ]}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Stock">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Enter stock"
                  value={stockValue}
                  onChange={(val) => setData('stock', String(val ?? ''))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Tag ID">
                <Input
                  placeholder="Enter tag ID"
                  value={data?.id ?? ''}
                  onChange={(e) => setData('id', e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description">
                <Input.TextArea
                  placeholder="Write a short description"
                  rows={4}
                  value={data?.description ?? ''}
                  onChange={(e) => setData('description', e.target.value)}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Meta Options */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Meta Options</Title>}
        bordered
        bodyStyle={{ paddingTop: 16 }}
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Meta Title">
                <Input
                  placeholder="Enter meta title"
                  value={data?.metaTitle ?? ''}
                  onChange={(e) => setData('metaTitle', e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Meta Tag Keyword">
                <Input
                  placeholder="Enter meta keywords (comma separated)"
                  value={data?.metaKeyword ?? ''}
                  onChange={(e) => setData('metaKeyword', e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description">
                <Input.TextArea
                  placeholder="Enter meta description"
                  rows={3}
                  value={data?.metaDescription ?? ''}
                  onChange={(e) => setData('metaDescription', e.target.value)}
                  showCount
                  maxLength={300}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
