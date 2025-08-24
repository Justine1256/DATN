'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button, Input, DatePicker, Slider, Select, Radio, Space, message
} from 'antd';
import Cookies from 'js-cookie';
import dayjs, { Dayjs } from 'dayjs';

import { API_BASE_URL } from '@/utils/api';
import SaleTable from './modal/SaleTable';
import BulkSaleModal from './modal/BulkSaleModal';

const { RangePicker } = DatePicker;

type Product = {
  id: number;
  name: string;
  price: number;
  sale_price?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  // ... các field khác
};

type Filters = {
  q: string;
  range: [Dayjs | null, Dayjs | null] | null;
  discount: [number, number];               // %
  status: 'all' | 'on' | 'off';
  sortBy: 'name' | 'price' | 'sale_price';
  sortDir: 'asc' | 'desc';
};

type PaginationState = {
  current: number;
  pageSize: number;
  total: number;
};

export default function ShopSaleManagement() {
  const [msg, ctx] = message.useMessage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // ====== server pagination ======
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 6, // theo backend paginate(6)
    total: 0,
  });

  // ====== Filters state (FE) ======
  const [filters, setFilters] = useState<Filters>({
    q: '',
    range: null,
    discount: [0, 50],          // tối đa 50% theo rule BE
    status: 'all',
    sortBy: 'name',
    sortDir: 'asc',
  });

  // ====== Fetch products theo user->shop_id + trang ======
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);

      const token = Cookies.get('authToken');

      const resUser = await fetch(`${API_BASE_URL}/user`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resUser.ok) { msg.error('Không thể lấy thông tin người dùng'); return; }

      const user = await resUser.json();
      // tuỳ backend: user.shop_id hoặc user.shop.id
      const shopId = user?.shop?.id ?? user?.shop_id;
      if (!shopId) { msg.error('Không tìm thấy shop_id cho tài khoản này'); return; }

      const resProducts = await fetch(`${API_BASE_URL}/shop/products/${shopId}?page=${page}`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resProducts.ok) { msg.error('Không thể tải danh sách sản phẩm'); return; }

      const data = await resProducts.json();
      const p = data.products;

      setProducts(p?.data || []);
      setPagination({
        current: Number(p?.current_page || page),
        pageSize: Number(p?.per_page || 6),
        total: Number(p?.total || 0),
      });
    } catch (e) {
      console.error(e);
      msg.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(1); }, []);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleBulkSuccess = () => {
    fetchProducts(pagination.current);
    setSelectedRowKeys([]);
  };

  // ====== Helpers FE filter/sort trên dữ liệu của TRANG hiện tại ======
  const isOnSale = (p: Product, now = Date.now()) => {
    const hasValidPrice = p.sale_price != null && Number(p.sale_price) < Number(p.price);
    if (!hasValidPrice) return false;
    const starts = p.sale_starts_at ? new Date(p.sale_starts_at).getTime() : null;
    const ends   = p.sale_ends_at   ? new Date(p.sale_ends_at).getTime()   : null;
    if (starts && now < starts) return false;
    if (ends && now > ends) return false;
    return true;
  };

  const discountPercent = (p: Product) => {
    if (p.sale_price == null || Number(p.sale_price) >= Number(p.price)) return 0;
    return Math.round(100 * (1 - Number(p.sale_price) / Number(p.price)));
  };

  // Nếu chọn khoảng thời gian → sp vĩnh viễn (không start & end) sẽ bị loại
  const overlaps = (
    rStart: number | null | undefined,
    rEnd: number | null | undefined,
    sStart: number | null | undefined,
    sEnd: number | null | undefined
  ) => {
    const rangeSelected = !!(rStart || rEnd);
    if (!rangeSelected) return true;
    if (!sStart && !sEnd) return false;
    const RS = rStart ?? -Infinity;
    const RE = rEnd   ??  Infinity;
    const SS = sStart ?? -Infinity;
    const SE = sEnd   ??  Infinity;
    return SS <= RE && SE >= RS;
  };

  const filteredProducts = useMemo(() => {
    const now = Date.now();
    const q = filters.q.trim().toLowerCase();

    const rStart = filters.range?.[0] ? filters.range[0]!.toDate().getTime() : null;
    const rEnd   = filters.range?.[1] ? filters.range[1]!.toDate().getTime() : null;

    let list = products.filter((p) => {
      if (q && !String(p.name).toLowerCase().includes(q)) return false;

      const on = isOnSale(p, now);
      if (filters.status === 'on' && !on) return false;
      if (filters.status === 'off' && on) return false;

      const sStart = p.sale_starts_at ? new Date(p.sale_starts_at).getTime() : null;
      const sEnd   = p.sale_ends_at   ? new Date(p.sale_ends_at).getTime()   : null;
      if (!overlaps(rStart, rEnd, sStart, sEnd)) return false;

      const d = discountPercent(p);
      const [minD, maxD] = filters.discount;
      if (d < minD || d > maxD) return false;

      return true;
    });

    const dir = filters.sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let va: any; let vb: any;
      switch (filters.sortBy) {
        case 'name': va = a.name || ''; vb = b.name || ''; return va.localeCompare(vb) * dir;
        case 'price': va = Number(a.price); vb = Number(b.price); break;
        case 'sale_price':
          va = Number(a.sale_price ?? a.price);
          vb = Number(b.sale_price ?? b.price);
          break;
        default: va = 0; vb = 0;
      }
      return (va - vb) * dir;
    });

    return list;
  }, [products, filters]);

  // ====== UI ======
  return (
    <div className="p-4 bg-white rounded-md shadow">
      {ctx}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Quản lý ưu đãi sản phẩm</h2>
        <Button
          type="primary"
          disabled={selectedRowKeys.length === 0}
          onClick={() => setIsBulkModalOpen(true)}
        >
          Đặt sale hàng loạt
        </Button>
      </div>

      {/* --- FILTER BAR (lọc FE trên trang hiện tại) --- */}
      <div className="mb-4 p-3 rounded border border-gray-200">
        <Space size="large" wrap>
          {/* Tìm tên */}
          <Input.Search
            allowClear
            placeholder="Tìm theo tên sản phẩm"
            onSearch={(val) => setFilters((f) => ({ ...f, q: val }))}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            style={{ width: 260 }}
            value={filters.q}
          />

          {/* Khoảng thời gian sale */}
          <RangePicker
            showTime
            value={filters.range as any}
            onChange={(v) => setFilters((f) => ({ ...f, range: (v as any) ?? null }))}
          />

          {/* % giảm */}
          <div style={{ width: 240 }}>
            <div className="text-xs text-gray-500 mb-1">Khoảng % giảm</div>
            <Slider
              range
              min={0}
              max={50}
              value={filters.discount}
              onChange={(v) => setFilters((f) => ({ ...f, discount: v as [number, number] }))}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>

          {/* Trạng thái sale */}
          <Select
            value={filters.status}
            style={{ width: 160 }}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'on',  label: 'Có sale' },
              { value: 'off', label: 'Không sale' },
            ]}
          />

          {/* Sort */}
          <Select
            value={filters.sortBy}
            style={{ width: 180 }}
            onChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
            options={[
              { value: 'name', label: 'Sắp xếp: Tên' },
              { value: 'price', label: 'Sắp xếp: Giá gốc' },
              { value: 'sale_price', label: 'Sắp xếp: Giá sale' },
            ]}
          />
          <Radio.Group
            value={filters.sortDir}
            onChange={(e) => setFilters((f) => ({ ...f, sortDir: e.target.value }))}
          >
            <Radio.Button value="asc">Tăng</Radio.Button>
            <Radio.Button value="desc">Giảm</Radio.Button>
          </Radio.Group>

          {/* Reset */}
          <Button
            onClick={() =>
              setFilters({
                q: '',
                range: null,
                discount: [0, 50],
                status: 'all',
                sortBy: 'name',
                sortDir: 'asc',
              })
            }
          >
            Xóa bộ lọc
          </Button>
        </Space>
      </div>

      <SaleTable
        products={filteredProducts}
        loading={loading}
        onRefresh={() => fetchProducts(pagination.current)}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        // phân trang server
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <BulkSaleModal
        open={isBulkModalOpen}
        onCancel={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
        selectedProductIds={selectedRowKeys}
      />
    </div>
  );
}
