'use client';

import {
  Table,
  Button,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Tag,
  Select,
} from 'antd';
import { API_BASE_URL } from '@/utils/api';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { useState } from 'react';

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

/** Validate chỉ ô "giá trị giảm" theo kiểu giảm */
function getDiscountError(record: any): string | null {
  const price = Number(record.price || 0);
  const type = record.discount_type;
  const val = record.discount_value;

  if (!type) return null; // chưa chọn kiểu thì chưa báo
  if (val == null || val === undefined || Number(val) <= 0) {
    return 'Giá trị giảm phải > 0';
  }

  if (type === 'percent') {
    if (Number(val) > 50) return 'Không được giảm quá 50%';
    return null;
  } else {
    const max = Math.floor(price * 0.5);
    if (Number(val) > max) return `Số tiền giảm tối đa là ${formatVND(max)} (≤50%)`;
    return null;
  }
}

/** Validate toàn dòng trước khi Lưu */
function getRowInvalidReason(record: any): string | null {
  const price = Number(record.price || 0);

  // 1) validate thời gian
  if (record.sale_starts_at && record.sale_ends_at) {
    const s = new Date(record.sale_starts_at).getTime();
    const e = new Date(record.sale_ends_at).getTime();
    if (s > e) return 'Thời gian: Bắt đầu phải trước hoặc bằng Kết thúc';
  }

  // 2) nếu dùng kiểu giảm + giá trị giảm
  if (record.discount_type && record.discount_value) {
    const err = getDiscountError(record);
    if (err) return err;

    const preview = computeSalePrice(record);
    if (preview == null) return 'Không tính được giá sale';
    if (preview <= 0) return 'Giá sale phải > 0';
    if (preview >= price) return 'Giá sale phải < giá gốc';
    if (preview < price * 0.5) return 'Giảm quá 50% giá gốc';
    return null;
  }

  // 3) fallback: nếu người dùng nhập trực tiếp sale_price ở nơi khác
  if (record.sale_price != null) {
    const sp = Number(record.sale_price);
    if (!(sp > 0)) return 'Giá sale phải > 0';
    if (sp >= price) return 'Giá sale phải < giá gốc';
    if (sp < price * 0.5) return 'Giảm quá 50% giá gốc';
    return null;
  }

  // chưa nhập gì để lưu
  return 'Hãy nhập % hoặc số tiền giảm (hoặc giá sale cụ thể)';
}

export default function SaleTable({
  products,
  loading,
  onRefresh,
  selectedRowKeys,
  setSelectedRowKeys,
  pagination,
  onPageChange,
  onLocalPatch,
}: {
  products: any[];
  loading: boolean;
  onRefresh: () => void;
  selectedRowKeys: number[];
  setSelectedRowKeys: (keys: number[]) => void;
  pagination: { current: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
  onLocalPatch?: (id: number, partial: Partial<any>) => void;
}) {
  const token = Cookies.get('authToken');
  const [msg, contextHolder] = message.useMessage();
  const [, setTick] = useState(0); // ép re-render nhẹ khi đổi input

  const handleSaveSale = async (record: any) => {
    if (!token) return msg.error('Bạn chưa đăng nhập');

    // ✅ validate trước khi gọi API
    const invalid = getRowInvalidReason(record);
    if (invalid) return msg.error(invalid);

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
      return msg.error('Hãy nhập % hoặc số tiền giảm (hoặc giá sale cụ thể)');
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

      // Có thể đọc dữ liệu trả về để patch chuẩn theo BE
      // const data = await res.json();
      // const p = data?.product;

      onLocalPatch?.(record.id, {
        sale_price: computeSalePrice(record),
        // sale_starts_at: p?.sale_starts_at ?? record.sale_starts_at,
        // sale_ends_at: p?.sale_ends_at ?? record.sale_ends_at,
      });

      msg.success('Cập nhật thành công');
    } catch (err) {
      console.error(err);
      msg.error('Không thể cập nhật sale');
    }
  };

  const handleRemoveSale = async (id: number) => {
    if (!token) return msg.error('Bạn chưa đăng nhập');
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/sale`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();

      onLocalPatch?.(id, {
        sale_price: null,
        sale_starts_at: null,
        sale_ends_at: null,
        discount_type: undefined,
        discount_value: undefined,
      });

      msg.success('Đã gỡ sale');
    } catch (err) {
      console.error(err);
      msg.error('Không thể gỡ sale');
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
          title={val}
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
    },
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
        <Select
          placeholder="Chọn kiểu giảm"
          style={{ width: 120 }}
          value={record.discount_type}
          onChange={(v) => {
            record.discount_type = v;
            record.discount_value = undefined;
            setTick((n) => n + 1);
          }}
          options={[
            { value: 'percent', label: '% phần trăm' },
            { value: 'fixed', label: 'Số tiền' },
          ]}
        />
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
      width: 170,
      render: (_, record) => {
        const err = getDiscountError(record);
        return (
          <Tooltip title={err || undefined} open={err ? undefined : false}>
            <InputNumber
              min={1}
              max={
                record.discount_type === 'percent'
                  ? 100 /* cho phép nhập rộng, sẽ báo lỗi nếu > 50 */
                  : undefined /* cho phép nhập rộng, sẽ báo lỗi nếu vượt 50% */
              }
              placeholder={
                record.discount_type === 'percent'
                  ? 'Nhập % (≤50)'
                  : 'Nhập số tiền (≤50%)'
              }
              value={record.discount_value}
              onChange={(v) => {
                record.discount_value = v ?? undefined;
                setTick((n) => n + 1);
              }}
              className="w-full"
              status={err ? 'error' : undefined}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Giá sale (xem trước)',
      key: 'sale_preview',
      render: (_, record) => {
        const preview = computeSalePrice(record);
        const price = Number(record.price || 0);
        const tooLow = preview != null && preview < price * 0.5;
        return preview != null ? (
          <Tooltip title={tooLow ? 'Giảm quá 50% giá gốc' : undefined}>
            <span className={`font-semibold ${tooLow ? 'text-red-500' : 'text-red-600'}`}>
              {formatVND(Number(preview))}
            </span>
          </Tooltip>
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
            setTick((n) => n + 1);
          }}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const invalid = getRowInvalidReason(record);
        return (
          <Space>
            <Tooltip title={invalid || undefined}>
              <Button
                type="primary"
                onClick={() => handleSaveSale(record)}
                disabled={!!invalid}
              >
                Lưu
              </Button>
            </Tooltip>
            <Popconfirm
              title="Xóa sale này?"
              onConfirm={() => handleRemoveSale(record.id)}
            >
              <Button danger>Gỡ</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // antd Table onChange (dùng để chuyển trang server)
  const handleTableChange = (pg: TablePaginationConfig) => {
    if (pg.current && onPageChange) onPageChange(pg.current);
  };

  return (
    <>
      {contextHolder}
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
    </>
  );
}
