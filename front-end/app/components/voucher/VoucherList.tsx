'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';
import {
    Card,
    Row,
    Col,
    Tag,
    Typography,
    Button,
    Space,
    Spin,
    Empty,
    Pagination,
    Grid,
} from 'antd';
import { GiftTwoTone } from '@ant-design/icons';

const { Text } = Typography;
const { useBreakpoint } = Grid;

export interface VoucherShip {
    id: number;
    code: string;
    discount_value: number;
    discount_type: 'percent' | 'amount';
    discountText: string;
    condition: string;
    expiry?: string;
    imageUrl?: string;
    isSaved?: boolean;
}

const BRAND = '#DB4444';
const SAVED = '#52c41a';

export default function VoucherList() {
    const screens = useBreakpoint();

    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState(true);

    // Popup trượt từ phải
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState<string>('');
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // paginate (pageSize responsive)
    const [page, setPage] = useState(1);
    const pageSize = screens.xl ? 6 : screens.md ? 4 : 2;
    const total = vouchers.length;
    const paged = useMemo(
        () => vouchers.slice((page - 1) * pageSize, page * pageSize),
        [vouchers, page, pageSize]
    );

    // đọc token khi mount
    useEffect(() => {
        const token = Cookies.get('authToken') || '';
        if (!token) {
            setLoading(false);
            return;
        }
        void fetchVouchers(token);
    }, []);

    async function fetchVouchers(token: string) {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/vouchers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const formatted: VoucherShip[] = (data || []).map((v: any) => ({
                id: v.id,
                code: v.code,
                discount_value: Number(v.discount_value),
                discount_type: (v.discount_type || 'amount') as 'percent' | 'amount',
                discountText:
                    v.discount_type === 'percent'
                        ? `Giảm ${Number(v.discount_value)}%`
                        : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`,
                condition: `Đơn từ ${Number(v.min_order_value || 0).toLocaleString('vi-VN')}đ`,
                expiry: v.end_date?.split('T')?.[0],
                imageUrl: '/ship.jpg',
                isSaved: !!v.is_saved,
            }));

            setVouchers(formatted);
            setPage(1);
        } catch {
            showToast('Không tải được voucher');
        } finally {
            setLoading(false);
        }
    }

    /** Popup nhỏ + trượt từ phải qua */
    function showToast(message: string, duration = 2500) {
        setPopupMessage(message);
        setShowPopup(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowPopup(false), duration);
    }

    async function handleSave(voucherId: number) {
        const token = Cookies.get('authToken') || '';
        if (!token) return showToast('Bạn cần đăng nhập');

        const existing = vouchers.find((v) => v.id === voucherId);
        if (existing?.isSaved) {
            showToast('Voucher đã tồn tại trong giỏ');
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE_URL}/voucherseve`, // kiểm tra lại endpoint nếu cần
                { voucher_id: voucherId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            const msg: string | undefined = res?.data?.message;

            setVouchers((prev) =>
                prev.map((v) => (v.id === voucherId ? { ...v, isSaved: true } : v))
            );

            if (msg && msg.toLowerCase().includes('trước đó')) {
                showToast('Voucher đã tồn tại trong giỏ');
            } else {
                showToast('Lưu voucher thành công');
            }
        } catch (error: any) {
            if (error?.response?.status === 409) {
                setVouchers((prev) =>
                    prev.map((v) => (v.id === voucherId ? { ...v, isSaved: true } : v))
                );
                showToast('Voucher đã tồn tại trong giỏ');
            } else {
                showToast('Lưu voucher thất bại, vui lòng thử lại');
            }
        }
    }

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <div className="px-4 py-4 max-w-[1170px] mx-auto">
            {/* CSS animation cho popup trượt từ phải */}
            <style jsx global>{`
        @keyframes slideInFade {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInFade {
          animation: slideInFade .35s ease-out both;
        }
      `}</style>

            {/* Popup trượt từ góc phải */}
            {showPopup && (
                <div
                    className="fixed z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade"
                    style={{
                        top: screens.md ? 140 : 100,
                        right: screens.md ? 20 : 12,
                        maxWidth: screens.md ? 320 : 260,
                        width: 'max-content',
                    }}
                    role="status"
                    aria-live="polite"
                >
                    {popupMessage}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                    <Text style={{ marginLeft: 12 }}>Đang tải mã giảm giá...</Text>
                </div>
            ) : total === 0 ? (
                <div className="py-16">
                    <Empty description={<span>Hiện tại chưa có mã giảm giá nào khả dụng</span>} />
                </div>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        {paged.map((v) => (
                            <Col xs={24} sm={12} lg={12} key={v.id}>
                                <Card
                                    styles={{
                                        header: { borderBottom: 'none', background: '#fff', borderRadius: 8 },
                                        body: { paddingTop: 12, paddingBottom: 16 },
                                    }}
                                    title={
                                        <Space align="center" size={screens.xs ? 4 : 8} wrap>
                                            <GiftTwoTone twoToneColor={BRAND} />
                                            <Text strong style={{ color: '#db4444' }}>{v.code}</Text>
                                            <Tag color="blue">
                                                {v.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}
                                            </Tag>
                                            <Tag>{v.discountText}</Tag>
                                        </Space>
                                    }
                                    extra={
                                        <Button
                                            size={screens.md ? 'middle' : 'small'}
                                            type={v.isSaved ? 'default' : 'primary'}
                                            onClick={() =>
                                                v.isSaved ? showToast('Voucher đã tồn tại trong giỏ') : handleSave(v.id)
                                            }
                                            style={{
                                                backgroundColor: v.isSaved ? SAVED : BRAND,
                                                borderColor: v.isSaved ? SAVED : BRAND,
                                                color: '#fff',
                                            }}
                                        >
                                            {v.isSaved ? 'Đã lưu' : 'Lưu vào giỏ'}
                                        </Button>
                                    }
                                    variant="outlined"
                                    style={{
                                        borderRadius: 12,
                                        borderColor: '#f0f0f0',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    <Space size="small" direction="vertical" style={{ width: '100%' }}>
                                        <Text type="secondary" style={{ color: 'rgba(0,0,0,0.45)' }}>
                                            {v.condition}
                                        </Text>

                                        {v.expiry && (
                                            <Text style={{ color: 'inherit' }}>
                                                HSD:{' '}
                                                <Text strong style={{ color: 'inherit' }}>
                                                    {new Date(v.expiry).toLocaleDateString('vi-VN')}
                                                </Text>
                                            </Text>
                                        )}
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <div className="flex justify-center mt-6">
                        <Pagination
                            size={screens.md ? 'default' : 'small'}
                            current={page}
                            total={total}
                            pageSize={pageSize}
                            onChange={setPage}
                            showSizeChanger={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
