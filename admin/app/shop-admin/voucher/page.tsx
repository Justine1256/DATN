'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import {
    Card,
    Row,
    Col,
    Typography,
    Space,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Button,
    Table,
    Tag,
    Tooltip,
    Modal,
    Descriptions,
    message,
    Grid,
} from 'antd';
import { DownloadOutlined, InfoCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

// ====== Config ======
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const VND = (n: number | string) =>
    new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(Number(n || 0)))) + '₫';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// ====== Types from backend ======
type DiscountTypeBE = 'fixed' | 'percent' | 'shipping' | string;
interface VoucherBE {
    id: number;
    shop_id: number | null;
    code: string;
    discount_value: string;
    discount_type: DiscountTypeBE;
    max_discount_value?: string | null;
    min_order_value?: string | null;
    usage_limit?: number | null;
    usage_count?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

// ====== UI State Types ======
type StatusFilter = 'all' | 'upcoming' | 'active' | 'expired';
type TableSorter = { field?: string; order?: 'ascend' | 'descend' };

// ====== Helpers ======
const mapTypeBadge = (t: DiscountTypeBE) => {
    const type = String(t).toLowerCase();
    if (type === 'percent') return <Tag color="blue">Giảm %</Tag>;
    if (type === 'fixed') return <Tag color="purple">Giảm tiền</Tag>;
    if (type === 'shipping') return <Tag color="green">Miễn phí VC</Tag>;
    return <Tag>{t}</Tag>;
};

const computeStatus = (row: VoucherBE): StatusFilter => {
    const now = dayjs();
    const start = row.start_date ? dayjs(row.start_date) : null;
    const end = row.end_date ? dayjs(row.end_date) : null;
    if (start && now.isBefore(start)) return 'upcoming';
    if (end && now.isAfter(end)) return 'expired';
    return 'active';
};

const statusTag = (s: StatusFilter) => {
    if (s === 'active') return <Tag color="green">Đang diễn ra</Tag>;
    if (s === 'upcoming') return <Tag color="gold">Sắp diễn ra</Tag>;
    if (s === 'expired') return <Tag>Hết hạn</Tag>;
    return <Tag>—</Tag>;
};

// ====== Component ======
export default function AdminVoucherList() {
    const screens = Grid.useBreakpoint();

    // server data
    const [data, setData] = useState<VoucherBE[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [total, setTotal] = useState(0);

    // filters (client)
    const [q, setQ] = useState('');
    const [shopId, setShopId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<StatusFilter>('all');
    const [type, setType] = useState<DiscountTypeBE | 'all'>('all');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [minOrderFrom, setMinOrderFrom] = useState<number | undefined>(undefined);
    const [minOrderTo, setMinOrderTo] = useState<number | undefined>(undefined);

    // table sort
    const [sorter, setSorter] = useState<TableSorter>({});

    // detail modal
    const [detail, setDetail] = useState<VoucherBE | null>(null);

    const fetchData = async (p = page, pp = perPage) => {
        try {
            setLoading(true);
            const token = Cookies.get('authToken');
            const res = await axios.get(`${API_BASE_URL}/vouchers/list/shop`, {
                params: { page: p, per_page: pp },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
            });

            const paged = res.data?.data;
            const rows: VoucherBE[] = paged?.data ?? [];
            setData(rows);
            setTotal(Number(paged?.total ?? rows.length));
            setPage(Number(paged?.current_page ?? p));
            setPerPage(Number(paged?.per_page ?? pp));
        } catch (e) {
            console.error(e);
            message.error('Không tải được danh sách voucher');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(1, perPage); }, []); // initial

    // client filter + sort
    const filtered = useMemo(() => {
        let rows = [...data];

        if (q.trim()) {
            const kw = q.trim().toLowerCase();
            rows = rows.filter(r => r.code.toLowerCase().includes(kw));
        }
        if (typeof shopId === 'number') {
            rows = rows.filter(r => Number(r.shop_id ?? -1) === Number(shopId));
        }
        if (type !== 'all') {
            rows = rows.filter(r => String(r.discount_type).toLowerCase() === String(type).toLowerCase());
        }
        if (status !== 'all') {
            rows = rows.filter(r => computeStatus(r) === status);
        }
        rows = rows.filter(r => {
            const min = Number(r.min_order_value ?? 0);
            if (typeof minOrderFrom === 'number' && min < minOrderFrom) return false;
            if (typeof minOrderTo === 'number' && min > minOrderTo) return false;
            return true;
        });
        if (dateRange && (dateRange[0] || dateRange[1])) {
            const [from, to] = dateRange;
            rows = rows.filter(r => {
                const s = r.start_date ? dayjs(r.start_date) : null;
                const e = r.end_date ? dayjs(r.end_date) : null;
                const rangeStart = s ?? dayjs('1970-01-01');
                const rangeEnd = e ?? dayjs('2999-12-31');
                const f = from ?? dayjs('1970-01-01');
                const t = to ?? dayjs('2999-12-31');
                return rangeStart.isBefore(t) && rangeEnd.isAfter(f);
            });
        }
        if (sorter.field && sorter.order) {
            const dir = sorter.order === 'ascend' ? 1 : -1;
            rows.sort((a, b) => {
                const fa = (a as any)[sorter.field!];
                const fb = (b as any)[sorter.field!];
                if (fa == null && fb == null) return 0;
                if (fa == null) return -1 * dir;
                if (fb == null) return 1 * dir;
                if (typeof fa === 'number' && typeof fb === 'number') return (fa - fb) * dir;
                return String(fa).localeCompare(String(fb)) * dir;
            });
        }
        return rows;
    }, [data, q, shopId, type, status, dateRange, minOrderFrom, minOrderTo, sorter]);

    // export csv
    const exportCSV = () => {
        const header = [
            'id', 'shop_id', 'code', 'discount_type', 'discount_value', 'max_discount_value', 'min_order_value', 'usage_limit', 'usage_count', 'start_date', 'end_date', 'created_at', 'updated_at',
        ];
        const rows = filtered.map(r => [
            r.id, r.shop_id ?? '', r.code, r.discount_type, r.discount_value, r.max_discount_value ?? '', r.min_order_value ?? '', r.usage_limit ?? '', r.usage_count ?? '', r.start_date ?? '', r.end_date ?? '', r.created_at ?? '', r.updated_at ?? '',
        ]);
        const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `vouchers_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    // ===== Responsive helpers =====
    const controlSize = screens.xs ? 'middle' : 'large';
    const tableSize = screens.xs ? 'small' : 'middle';

    // table columns (thêm ellipsis + nowrap cho cell hẹp, và scroll ngang trên mobile)
    const columns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            key: 'code',
            width: 180,
            onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            ellipsis: true,
            sorter: true,
            render: (v: string, r: VoucherBE) => (
                <Space size="small" wrap={false} style={{ display: 'inline-flex' }}>
                    <Text strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', wordBreak: 'keep-all' }}>{v}</Text>
                    <Tooltip title="Thông tin">
                        <Button size="small" icon={<InfoCircleOutlined />} onClick={(e) => { e.stopPropagation(); setDetail(r); }} style={{ flexShrink: 0 }} />
                    </Tooltip>
                </Space>
            ),
            fixed: screens.xs ? 'left' : undefined,
        },
        {
            title: 'Loại',
            dataIndex: 'discount_type',
            key: 'discount_type',
            width: 130,
            render: (t: DiscountTypeBE) => mapTypeBadge(t),
        },
        {
            title: 'Giá trị',
            key: 'discount_value',
            width: 160,
            render: (_: any, r: VoucherBE) => {
                const t = String(r.discount_type).toLowerCase();
                if (t === 'percent') return <Text>{Number(r.discount_value)}%</Text>;
                if (t === 'fixed') return <Text>{VND(r.discount_value)}</Text>;
                if (t === 'shipping') return <Text>Miễn phí vận chuyển</Text>;
                return <Text>{r.discount_value}</Text>;
            },
            sorter: true,
        },
        {
            title: 'ĐH tối thiểu',
            dataIndex: 'min_order_value',
            key: 'min_order_value',
            width: 140,
            render: (v: string | null) => (v ? VND(v) : '—'),
            sorter: true,
        },
        {
            title: 'Giới hạn / Đã dùng',
            key: 'usage',
            width: 160,
            render: (_: any, r: VoucherBE) => <Text>{(r.usage_limit ?? '∞')} / {(r.usage_count ?? 0)}</Text>,
        },
        {
            title: 'Hiệu lực',
            key: 'date',
            width: 220,
            render: (_: any, r: VoucherBE) => (
                <Space direction="vertical" size={0}>
                    <Text type="secondary">Bắt đầu: {r.start_date ? dayjs(r.start_date).format('DD/MM/YYYY') : '—'}</Text>
                    <Text type="secondary">Kết thúc: {r.end_date ? dayjs(r.end_date).format('DD/MM/YYYY') : '—'}</Text>
                </Space>
            ),
            responsive: ['sm']
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 130,
            render: (_: any, r: VoucherBE) => statusTag(computeStatus(r)),
            filters: [
                { text: 'Đang diễn ra', value: 'active' },
                { text: 'Sắp diễn ra', value: 'upcoming' },
                { text: 'Hết hạn', value: 'expired' },
            ],
            onFilter: (val: any, r: VoucherBE) => computeStatus(r) === val,
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 12 }}>
            {/* Header */}
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
                <Space size="middle" wrap>
                    <Title level={4} style={{ margin: 0 }}>Danh sách mã giảm giá</Title>
                    <Tag color="blue">{total} mã</Tag>
                </Space>
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData(page, perPage)}>Tải lại</Button>
                    <Button icon={<DownloadOutlined />} onClick={exportCSV}>Xuất CSV</Button>
                </Space>
            </Space>

            {/* FILTER BAR */}
            <Card styles={{ body: { padding: screens.xs ? 8 : 12 } }} style={{ borderRadius: 10, marginBottom: 12 }}>
                <Row gutter={[12, 8]} align="middle">
                    <Col xs={24} md={8}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo mã voucher…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={12} md={4}>
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Shop ID"
                            value={shopId}
                            min={0}
                            onChange={(v) => setShopId(typeof v === 'number' ? v : undefined)}
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={12} md={5}>
                        <Select
                            value={type}
                            onChange={setType}
                            style={{ width: '100%' }}
                            options={[
                                { label: 'Tất cả loại', value: 'all' },
                                { label: 'Giảm tiền (fixed)', value: 'fixed' },
                                { label: 'Giảm % (percent)', value: 'percent' },
                                { label: 'Miễn phí VC', value: 'shipping' },
                            ]}
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={12} md={5}>
                        <Select
                            value={status}
                            onChange={setStatus}
                            style={{ width: '100%' }}
                            options={[
                                { label: 'Tất cả trạng thái', value: 'all' },
                                { label: 'Đang diễn ra', value: 'active' },
                                { label: 'Sắp diễn ra', value: 'upcoming' },
                                { label: 'Hết hạn', value: 'expired' },
                            ]}
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={24} md={10}>
                        <RangePicker
                            allowEmpty={[true, true]}
                            style={{ width: '100%' }}
                            value={dateRange as any}
                            onChange={(v) => setDateRange(v as any)}
                            format="DD/MM/YYYY"
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={12} md={4}>
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="ĐH tối thiểu từ"
                            min={0}
                            value={minOrderFrom}
                            onChange={(v) => setMinOrderFrom(typeof v === 'number' ? v : undefined)}
                            size={controlSize as any}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="ĐH tối thiểu đến"
                            min={0}
                            value={minOrderTo}
                            onChange={(v) => setMinOrderTo(typeof v === 'number' ? v : undefined)}
                            size={controlSize as any}
                        />
                    </Col>

                    <Col xs={24} md={5}>
                        <Space wrap>
                            <Button onClick={() => { setQ(''); setShopId(undefined); setType('all'); setStatus('all'); setDateRange(null); setMinOrderFrom(undefined); setMinOrderTo(undefined); }}>
                                Xoá lọc
                            </Button>
                            <Button type="primary" onClick={() => fetchData(1, perPage)}>Áp dụng</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* TABLE */}
            <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 10 }}>
                <Table<VoucherBE>
                    loading={loading}
                    rowKey="id"
                    columns={columns as any}
                    dataSource={filtered}
                    size={tableSize as any}
                    scroll={{ x: screens.xs ? 900 : undefined }}
                    sticky
                    pagination={{
                        current: page,
                        pageSize: perPage,
                        total,
                        showSizeChanger: true,
                        onChange: (p, ps) => { setPage(p); setPerPage(ps); fetchData(p, ps); },
                    }}
                    onChange={(_, __, sorterArg) => {
                        const s = Array.isArray(sorterArg) ? sorterArg[0] : sorterArg;
                        setSorter({ field: (s?.field as string) || undefined, order: s?.order || undefined });
                    }}
                />
            </Card>

            {/* DETAIL MODAL */}
            <Modal
                open={!!detail}
                onCancel={() => setDetail(null)}
                title="Chi tiết voucher"
                footer={null}
                styles={{ body: { paddingTop: 8 } }}
            >
                {detail && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                        <Descriptions.Item label="Shop">
                            {detail.shop_id == null ? <Tag>Toàn sàn</Tag> : <Tag color="purple">#{detail.shop_id}</Tag>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã"><Text copyable>{detail.code}</Text></Descriptions.Item>
                        <Descriptions.Item label="Loại">{mapTypeBadge(detail.discount_type)}</Descriptions.Item>
                        <Descriptions.Item label="Giá trị">
                            {String(detail.discount_type).toLowerCase() === 'percent'
                                ? `${Number(detail.discount_value)}%`
                                : String(detail.discount_type).toLowerCase() === 'fixed'
                                    ? VND(detail.discount_value)
                                    : 'Miễn phí vận chuyển'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giảm tối đa">
                            {detail.max_discount_value ? VND(detail.max_discount_value) : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="ĐH tối thiểu">
                            {detail.min_order_value ? VND(detail.min_order_value) : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới hạn / Đã dùng">
                            {(detail.usage_limit ?? '∞')} / {(detail.usage_count ?? 0)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Bắt đầu">
                            {detail.start_date ? dayjs(detail.start_date).format('DD/MM/YYYY HH:mm') : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kết thúc">
                            {detail.end_date ? dayjs(detail.end_date).format('DD/MM/YYYY HH:mm') : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {statusTag(computeStatus(detail))}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tạo lúc">
                            {detail.created_at ? dayjs(detail.created_at).format('DD/MM/YYYY HH:mm') : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật">
                            {detail.updated_at ? dayjs(detail.updated_at).format('DD/MM/YYYY HH:mm') : '—'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}
