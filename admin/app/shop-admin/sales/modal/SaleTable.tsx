'use client';

import {
  Table,
  Button,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Radio,
  Tooltip,
  Tag,
} from 'antd';
import { API_BASE_URL } from '@/utils/api';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { RangePicker } = DatePicker;

// formatter VND
const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(Number(n)))) + 'đ';

// Giá sale “đang áp dụng” (ưu tiên discount_type/value nếu đang nhập)
function computeSalePrice(record: any) {
  const price = Number(record.price || 0);
  const type = record.discount_type;
  const val = Number(record.discount_value || 0);
  if (!type || !val) return record.sale_price ?? null;
  if (type === 'percent') return Math.max(0, Math.round(price * (1 - val / 100)));
  return Math.max(0, price - val); // fixed
}

// % giảm dựa trên giá gốc & giá sale
function computeDiscountPercent(record: any) {
  const price = Number(record.price || 0);
  if (price <= 0) return null;
  const effectiveSale =
    (computeSalePrice(record) ?? record.sale_price ?? null) as number | null;
  if (effectiveSale == null) return null;
  if (Number(effectiveSale) >= price) return 0;
  return Math.round(100 * (1 - Number(effectiveSale) / price));
}

export default function SaleTable({
  products,
  loading,
  onRefresh,
  selectedRowKeys,
  setSelectedRowKeys,
  pagination,
  onPageChange,
}: {
  products: any[];
  loading: boolean;
  onRefresh: () => void;
  selectedRowKeys: number[];
  setSelectedRowKeys: (keys: number[]) => void;
  pagination: { current: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
}) {
  const token = Cookies.get('authToken');

  const handleSaveSale = async (record: any) => {
    if (!token) return message.error('Bạn chưa đăng nhập');

    const payload: any = {
      sale_starts_at: record.sale_starts_at || null,
      sale_ends_at: record.sale_ends_at || null,
    };

    if (record.discount_type && record.discount_value) {
      payload.discount_type = record.discount_type;
      payload.discount_value = Number(record.discount_value);
    } else if (record.sale_price) {
      payload.sale_price = Number(record.sale_price);
    } else {
      return message.error('Hãy nhập % hoặc số tiền giảm (hoặc giá sale cụ thể)');
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
      onRefresh(); // refresh đúng trang hiện tại (parent đã lo)
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
    {
  title: 'Sản phẩm',
  dataIndex: 'name',
  key: 'name',
  width: 220,
  render: (val: string) => (
    <div
      title={val} // hover thấy full
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        whiteSpace: 'normal',
      }}
    >
      {val}
    </div>
  ),
}
,
    {
      title: 'Giá gốc',
      dataIndex: 'price',
      key: 'price',
      render: (val) => formatVND(Number(val)),
      sorter: (a, b) => Number(a.price) - Number(b.price),
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
      title: (
        <Space size={4}>
          Giá trị giảm
          <Tooltip title="Nếu giảm %: tối đa 50%. Nếu giảm số tiền: không vượt 50% giá gốc.">
            <span className="text-gray-400 cursor-help">ⓘ</span>
          </Tooltip>
        </Space>
      ),
      key: 'discount_value',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={
            record.discount_type === 'percent'
              ? 50
              : Math.max(1, Math.floor(Number(record.price) * 0.5))
          }
          placeholder={
            record.discount_type === 'percent'
              ? 'Nhập % (≤50)'
              : 'Nhập số tiền (≤50%)'
          }
          onChange={(v) => (record.discount_value = v)}
          className="w-full"
        />
      ),
    },
    {
      title: 'Giá sale (xem trước)',
      key: 'sale_preview',
      render: (_, record) => {
        const preview = computeSalePrice(record);
        return preview != null ? (
          <span className="font-semibold text-red-600">
            {formatVND(Number(preview))}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
      sorter: (a, b) => {
        const av = computeSalePrice(a) ?? a.sale_price ?? a.price;
        const bv = computeSalePrice(b) ?? b.sale_price ?? b.price;
        return Number(av) - Number(bv);
      },
    },
    {
      title: 'Giảm (%)',
      key: 'discount_percent',
      render: (_, record) => {
        const d = computeDiscountPercent(record);
        if (d == null) return <span className="text-gray-400">—</span>;
        const overLimit = d > 50;
        return (
          <Tooltip
            title={
              overLimit
                ? 'Vượt quá 50% - BE sẽ từ chối khi lưu'
                : `Giảm ${d}% so với giá gốc`
            }
          >
            <Tag color={overLimit ? 'error' : 'success'}>{d}%</Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => {
        const ad = computeDiscountPercent(a) ?? -1;
        const bd = computeDiscountPercent(b) ?? -1;
        return ad - bd;
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
          <Button type="primary" onClick={() => handleSaveSale(record)}>
            Lưu
          </Button>
          <Popconfirm
            title="Xóa sale này?"
            onConfirm={() => handleRemoveSale(record.id)}
          >
            <Button danger>Gỡ</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // antd Table onChange (dùng để chuyển trang server)
  const handleTableChange = (pg: TablePaginationConfig) => {
    if (pg.current && onPageChange) onPageChange(pg.current);
  };

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={products}
      loading={loading}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys as number[]),
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: false, // backend cố định 6/sp
      }}
      onChange={handleTableChange}
    />
  );
}
