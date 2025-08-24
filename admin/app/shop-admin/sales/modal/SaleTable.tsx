'use client';

import { Table, Button, InputNumber, DatePicker, Space, Popconfirm, message, Radio, Tooltip } from 'antd';
import { API_BASE_URL } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { RangePicker } = DatePicker;

function computeSalePrice(record: any) {
  const price = Number(record.price || 0);
  const type = record.discount_type;
  const val  = Number(record.discount_value || 0);

  if (!type || !val) return record.sale_price ?? null;

  if (type === 'percent') {
    return Math.max(0, Math.round(price * (1 - val / 100)));
  }
  // fixed
  return Math.max(0, price - val);
}

export default function SaleTable({
  products,
  loading,
  onRefresh,
  selectedRowKeys,
  setSelectedRowKeys,
}: any) {
  const token = Cookies.get('authToken');

  const handleSaveSale = async (record: any) => {
    if (!token) return message.error('Bạn chưa đăng nhập');

    // gửi discount_* (BE sẽ tính)
    const payload: any = {
      sale_starts_at: record.sale_starts_at || null,
      sale_ends_at: record.sale_ends_at || null,
    };

    if (record.discount_type && record.discount_value) {
      payload.discount_type  = record.discount_type;
      payload.discount_value = Number(record.discount_value);
    } else if (record.sale_price) {
      payload.sale_price = Number(record.sale_price);
    } else {
      return message.error('Hãy nhập % hoặc số tiền giảm (hoặc nhập trực tiếp giá sale)');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products/${record.id}/sale`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      message.success('Cập nhật thành công');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Không thể cập nhật sale');
    }
  };

  const handleRemoveSale = async (id: number) => {
    if (!token) return message.error('Bạn chưa đăng nhập');
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/sale`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      message.success('Đã gỡ sale');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Không thể gỡ sale');
    }
  };

  const columns: ColumnsType<any> = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    {
      title: 'Giá gốc',
      dataIndex: 'price',
      key: 'price',
      render: (val) => `${Number(val).toLocaleString('vi-VN')}₫`,
    },
    {
      title: 'Kiểu giảm',
      key: 'discount_type',
      render: (_, record) => (
        <Radio.Group
          defaultValue={record.discount_type}
          onChange={(e) => (record.discount_type = e.target.value)}
        >
          <Radio value="percent">% phần trăm</Radio>
          <Radio value="fixed">Số tiền</Radio>
        </Radio.Group>
      ),
    },
    {
      title: 'Giá trị giảm',
      key: 'discount_value',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.discount_type === 'percent' ? 99 : Number(record.price) - 1}
          placeholder={record.discount_type === 'percent' ? 'Nhập %' : 'Nhập số tiền'}
          onChange={(v) => (record.discount_value = v)}
        />
      ),
    },
    {
      title: 'Giá sale (xem trước)',
      key: 'sale_preview',
      render: (_, record) => {
        const preview = computeSalePrice(record);
        return preview
          ? <span className="font-semibold text-red-600">{preview.toLocaleString('vi-VN')}₫</span>
          : <span className="text-gray-400">—</span>;
      },
    },
    {
      title: 'Thời gian sale',
      key: 'sale_time',
      render: (_, record) => (
        <RangePicker
          showTime
          defaultValue={
            record.sale_starts_at && record.sale_ends_at
              ? [dayjs(record.sale_starts_at), dayjs(record.sale_ends_at)]
              : undefined
          }
          onChange={(dates) => {
            if (dates) {
              record.sale_starts_at = dates[0]?.toISOString();
              record.sale_ends_at = dates[1]?.toISOString();
            } else {
              record.sale_starts_at = null;
              record.sale_ends_at = null;
            }
          }}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleSaveSale(record)}>Lưu</Button>
          <Popconfirm title="Xóa sale này?" onConfirm={() => handleRemoveSale(record.id)}>
            <Button danger>Gỡ</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={products}
      loading={loading}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
      }}
      pagination={{ pageSize: 10 }}
    />
  );
}
