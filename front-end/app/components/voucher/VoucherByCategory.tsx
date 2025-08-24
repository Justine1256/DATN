'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

import {
    Tabs,
    Row,
    Col,
    Card,
    Typography,
    Tag,
    Button,
    Space,
    Spin,
    Result,
} from 'antd';
import type { TabsProps } from 'antd';

import { FiSmartphone } from 'react-icons/fi';
import { TbFridge, TbAirConditioning } from 'react-icons/tb';
import { FaTshirt, FaHeartbeat, FaTv } from 'react-icons/fa';
import { MdSportsEsports, MdOutlineLaptopMac } from 'react-icons/md';

const { Text, Title } = Typography;

export interface VoucherShip {
    id: number;
    code: string;
    discount_value: number;
    discount_type: 'percent' | 'amount' | string;
    min_order_value?: number;
    discountText: string;
    condition: string;
    expiry?: string;
    imageUrl?: string;
    isSaved?: boolean;
}

const BRAND = '#DB4444';
const SAVED = '#52c41a';

const categoryMap: Record<string, number> = {
    'Điện thoại': 1,
    'Tủ lạnh': 2,
    'Thời Trang': 3,
    'Laptop': 4,
    'Điều hòa': 5,
    'Sức Khỏe & Làm Đẹp': 6,
    'Game': 7,
    'Tivi': 8,
};
const categories = Object.keys(categoryMap);

const iconMap: Record<string, React.ReactNode> = {
    'Điện thoại': <FiSmartphone />,
    'Tủ lạnh': <TbFridge />,
    'Thời Trang': <FaTshirt />,
    'Laptop': <MdOutlineLaptopMac />,
    'Điều hòa': <TbAirConditioning />,
    'Sức Khỏe & Làm Đẹp': <FaHeartbeat />,
    'Game': <MdSportsEsports />,
    'Tivi': <FaTv />,
};

export default function VoucherByCategory() {
    const [activeCat, setActiveCat] = useState<string>(categories[0]);
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [err, setErr] = useState<string | null>(null);

    // Popup
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const token = Cookies.get('authToken');

    const tabs: TabsProps['items'] = useMemo(
        () =>
            categories.map((label) => ({
                key: label,
                label: (
                    <Space size={6}>
                        <span className="text-base">{iconMap[label]}</span>
                        <span>{label}</span>
                    </Space>
                ),
            })),
        []
    );

    useEffect(() => {
        const fetchVouchers = async () => {
            setLoading(true);
            setErr(null);
            setVouchers([]);

            try {
                const categoryId = categoryMap[activeCat];
                const res = await fetch(`${API_BASE_URL}/vouchers/by-category/${categoryId}`);
                const data = await res.json();

                if (!Array.isArray(data?.data)) {
                    setErr('Dữ liệu không đúng định dạng.');
                    return;
                }

                const formatted: VoucherShip[] = data.data.map((v: any) => {
                    const discountText =
                        String(v.discount_type).toLowerCase() === 'percent'
                            ? `Giảm ${Number(v.discount_value)}%`
                            : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`;
                    const min = Number(v.min_order_value || v.min_order || 0);

                    return {
                        id: Number(v.id),
                        code: String(v.code || v.voucher_code || '').trim(),
                        discount_value: Number(v.discount_value),
                        discount_type: String(v.discount_type || 'amount').toLowerCase(),
                        min_order_value: min,
                        discountText,
                        condition: min
                            ? `Đơn từ ${min.toLocaleString('vi-VN')}đ`
                            : 'Không yêu cầu đơn tối thiểu',
                        expiry: v.end_date ? String(v.end_date).split('T')[0] : undefined,
                        imageUrl: v.image || '/ship.jpg',
                        isSaved: !!v.is_saved,
                    };
                });

                setVouchers(formatted);
            } catch {
                setErr('Có lỗi khi tải dữ liệu, vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchVouchers();
    }, [activeCat]);

    function showToast(msg: string, duration = 2500) {
        setPopupMessage(msg);
        setShowPopup(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowPopup(false), duration);
    }

    const handleSave = async (voucherId: number) => {
        const existing = vouchers.find((x) => x.id === voucherId);
        if (existing?.isSaved) {
            showToast('Voucher này đã được lưu trước đó.');
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE_URL}/voucherseve`,
                { voucher_id: voucherId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            if (res.data?.success) {
                setVouchers((prev) =>
                    prev.map((v) => (v.id === voucherId ? { ...v, isSaved: true } : v))
                );
                showToast('Đã lưu voucher vào ví của bạn.');
            } else {
                showToast(res.data?.message || 'Không thể lưu voucher.');
            }
        } catch (err: any) {
            if (err?.response?.status === 409) {
                setVouchers((prev) =>
                    prev.map((v) => (v.id === voucherId ? { ...v, isSaved: true } : v))
                );
                showToast('Voucher này đã được lưu trước đó.');
            } else if (err?.response?.status === 401) {
                showToast('Bạn cần đăng nhập để lưu voucher.');
            } else {
                showToast('Lỗi khi lưu voucher.');
            }
        }
    };

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <div className="max-w-[1120px] mx-auto px-4 py-16">
            {/* CSS popup */}
            <style jsx global>{`
        @keyframes slideInFade {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInFade {
          animation: slideInFade 0.35s ease-out both;
        }
      `}</style>

            {showPopup && (
                <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
                    {popupMessage}
                </div>
            )}

            <div className="text-center mb-16">
                <Text
                    style={{
                        color: "black",       // màu chữ đen
                        fontSize: "40px",     // tăng cỡ chữ (tuỳ chỉnh: 16px, 18px, 20px...)
                        fontWeight: 500,      // đậm vừa (có thể đổi 600/700 nếu muốn đậm hơn)
                        cursor: "default"
                    }}
                >
                    Mã giảm giá cho danh mục
                </Text>


            </div>

            <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 16 }} variant="outlined">
                <Tabs
                    items={tabs}
                    activeKey={activeCat}
                    onChange={setActiveCat}
                    centered
                    tabBarGutter={8}
                />

                <div style={{ minHeight: 240, paddingTop: 12 }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spin size="large" />
                        </div>
                    ) : err ? (
                        <Result status="error" title="Không thể tải voucher" subTitle={err} />
                    ) : vouchers.length === 0 ? (
                        <Result
                            status="info"
                            title="Chưa có mã giảm giá"
                            subTitle="Danh mục này tạm thời chưa có voucher."
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {vouchers.map((v) => (
                                <Col xs={24} sm={12} key={v.id}>
                                    <Card
                                        hoverable
                                        variant="outlined"
                                        styles={{ body: { padding: 16 } }}
                                        style={{ borderRadius: 14, height: '100%' }}
                                    >
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <Space align="center" wrap>
                                                <Tag color="blue">{v.discountText}</Tag>
                                                <Tag>{v.condition}</Tag>
                                                {v.expiry && <Tag color="red">HSD: {v.expiry}</Tag>}
                                            </Space>

                                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                <Text
                                                    type="secondary"
                                                    style={{ color: "rgba(0,0,0,0.45)", cursor: "default" }}
                                                >
                                                    Mã áp dụng
                                                </Text>

                                                <Text
                                                    strong
                                                    style={{ color: '#db4444' }}
                                                    copyable={{ text: v.code }}
                                                >
                                                    {v.code || '(Chưa có mã)'}
                                                </Text>

                                            </Space>

                                            <Space
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'space-between',
                                                    marginTop: 8,
                                                }}
                                            >
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        color: "rgba(0,0,0,0.45)",
                                                        cursor: "default"
                                                    }}
                                                >
                                                    ID: {v.id}
                                                </Text>

                                                <Button
                                                    type="primary"
                                                    onClick={() => handleSave(v.id)}
                                                    disabled={v.isSaved}
                                                    style={{
                                                        backgroundColor: v.isSaved ? SAVED : BRAND,
                                                        borderColor: v.isSaved ? SAVED : BRAND,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {v.isSaved ? 'Đã lưu' : 'Lưu voucher'}
                                                </Button>
                                            </Space>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            </Card>
        </div>
    );
}
