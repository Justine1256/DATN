'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

import {
    Row,
    Col,
    Card,
    Tag,
    Rate,
    Button,
    Pagination,
    Empty,
    Spin,
    Typography,
    Space,
    Segmented,
    Input,
    Tooltip,
    Popconfirm,
} from 'antd';
import {
    SafetyCertificateTwoTone,
    DeleteOutlined,
    FireOutlined,
    StarFilled,
    SearchOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

type Status = 'activated' | 'pending' | 'suspended';
interface Shop {
    id: number;
    name: string;
    description: string;
    logo?: string;
    slug: string;
    rating?: number;
    is_verified?: boolean;
    status: Status;
}

const PAGE_SIZE = 6;
const BRAND = '#DB4444';

export default function FollowedShopsSection() {
    const router = useRouter();

    // data
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    // ui state
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'new' | 'top'>('new');
    const [currentPage, setCurrentPage] = useState(1);
    const [unfollowing, setUnfollowing] = useState<number | null>(null);

    // custom popup
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        const fetchFollowedShops = async () => {
            const token = Cookies.get('authToken');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/my/followed-shops`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setShops(res.data?.shops || []);
            } catch {
                setPopupType('error');
                setPopupMessage('Không tải được danh sách shop đã theo dõi');
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 2200);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowedShops();
    }, []);

    // search + sort
    const filtered = useMemo(() => {
        let data = [...shops];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            data = data.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    (s.description || '').toLowerCase().includes(q)
            );
        }
        data.sort((a, b) =>
            sort === 'top' ? (b.rating || 0) - (a.rating || 0) : b.id - a.id
        );
        return data;
    }, [shops, search, sort]);

    const total = filtered.length;
    const pageData = useMemo(
        () =>
            filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [filtered, currentPage]
    );

    const handleUnfollow = async (shopId: number) => {
        const token = Cookies.get('authToken');
        if (!token) return;
        setUnfollowing(shopId);
        try {
            const res = await fetch(`${API_BASE_URL}/shops/${shopId}/unfollow`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error();
            setShops((prev) => prev.filter((s) => s.id !== shopId));
            setPopupType('success');
            setPopupMessage('Đã hủy theo dõi shop');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 1600);

            // tính lại trang nếu rỗng
            const remain = total - 1;
            const lastPage = Math.max(1, Math.ceil(remain / PAGE_SIZE));
            if (currentPage > lastPage) setCurrentPage(lastPage);
        } catch {
            setPopupType('error');
            setPopupMessage('Hủy theo dõi thất bại. Vui lòng thử lại!');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 1800);
        } finally {
            setUnfollowing(null);
        }
    };

    const StatusTag = ({ v }: { v: Status }) =>
        v === 'activated' ? (
            <Tag color="green">Đang hoạt động</Tag>
        ) : v === 'pending' ? (
            <Tag color="gold">Chờ duyệt</Tag>
        ) : (
            <Tag>Tạm khóa</Tag>
        );

    const ShopLogo = ({ src, alt }: { src: string; alt: string }) => (
        <div
            style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                overflow: 'hidden',
                background: '#fff',
                border: '1px solid #eee',
            }}
        >
            <Image
                src={src}
                alt={alt}
                width={64}
                height={64}
                style={{ width: 64, height: 64, objectFit: 'cover' }}
            />
        </div>
    );

    const goToShop = (slug: string) => router.push(`/shop/${slug}`);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {/* POPUP góc phải (kiểu bạn đưa) */}
            {showPopup && (
                <div
                    className="fixed top-[140px] right-5 z-[9999] text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade"
                    style={{
                        backgroundColor: popupType === 'success' ? '#dcfce7' : '#fee2e2',
                        color: popupType === 'success' ? '#166534' : '#991b1b',
                        borderBottomColor: popupType === 'success' ? '#22c55e' : '#ef4444',
                    }}
                >
                    {popupMessage}
                </div>
            )}

            <div
                style={{ width: '100%', maxWidth: 1200, padding: '0 8px', marginTop: 72 }}
            >
                {/* TOOLBAR – bỏ bộ lọc chữ, chỉ search + sort */}
                <Card
                    variant="outlined"
                    style={{
                        borderRadius: 16,
                        marginBottom: 16,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                    }}
                    styles={{ body: { padding: 16 } }}
                >
                    <Row align="middle" gutter={[12, 12]}>
                        <Col flex="auto">
                            <Space size="middle" align="center" wrap>
                                <div
                                    style={{
                                        width: 6,
                                        height: 28,
                                        borderRadius: 999,
                                        background: `linear-gradient(180deg, ${BRAND}, #ff6b6b)`,
                                    }}
                                />
                                <Title 
  level={3} 
  style={{ margin: 0, color: 'black', cursor: 'default' }}
>
  Danh sách shop theo dõi
</Title>

                                <Tag color={BRAND} style={{ borderRadius: 999 }}>
                                    {shops.length} shop
                                </Tag>
                            </Space>
                           <Text style={{ color: 'black' }}>
  Quản lý & theo dõi các shop yêu thích
</Text>

                        </Col>

                        <Col xs={24} md={10} lg={10}>
                            <Input
                                size="large"
                                allowClear
                                placeholder="Tìm theo tên hoặc mô tả…"
                                prefix={<SearchOutlined />}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </Col>

                        <Col xs={24} md={8} lg={8}>
                            <Segmented
                                block
                                size="large"
                                value={sort}
                                onChange={(v) => {
                                    setSort(v as any);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    {
                                        label: (
                                            <Space>
                                                <FireOutlined />
                                                Mới nhất
                                            </Space>
                                        ),
                                        value: 'new',
                                    },
                                    {
                                        label: (
                                            <Space>
                                                <StarFilled style={{ color: '#faad14' }} />
                                                Điểm cao
                                            </Space>
                                        ),
                                        value: 'top',
                                    },
                                ]}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* LIST */}
                <Card
                    variant="outlined"
                    style={{
                        borderRadius: 16,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    }}
                    styles={{ body: { padding: 16 } }}
                >
                    {loading ? (
                        <div
                            style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}
                        >
                            <Spin size="large" />
                        </div>
                    ) : !total ? (
                        <div style={{ padding: '48px 0' }}>
                            <Empty
                                description={
                                    <>
                                        <Text strong>Chưa có shop nào</Text>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                            Theo dõi thêm shop để cập nhật sản phẩm mới nhé!
                                        </Text>
                                    </>
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <Row gutter={[16, 16]}>
                                {pageData.map((shop) => {
                                    const logo = shop.logo
                                        ? `${STATIC_BASE_URL}/${shop.logo}`
                                        : `${STATIC_BASE_URL}/avatars/default-avatar.jpg`;

                                    return (
                                        <Col xs={24} md={12} xl={8} key={shop.id}>
                                            {/* Card cao bằng nhau; click card -> đi tới shop */}
                                            <Card
                                                hoverable
                                                onClick={() => goToShop(shop.slug)}
                                                style={{
                                                    borderRadius: 16,
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                }}
                                                styles={{
                                                    body: {
                                                        padding: 0,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    },
                                                }}
                                                tabIndex={0}
                                                role="button"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        goToShop(shop.slug);
                                                    }
                                                }}
                                            >
                                                {/* header */}
                                                <div
                                                    style={{
                                                        padding: 16,
                                                        display: 'flex',
                                                        gap: 14,
                                                        alignItems: 'center',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        background:
                                                            'linear-gradient(135deg,#fff 0%,#fafafa 100%)',
                                                    }}
                                                >
                                                    <ShopLogo src={logo} alt={shop.name} />
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <Space size={6} wrap>
                                                            {/* Click tên cũng được, nhưng chặn nổi bọt để tránh double navigate */}
                                                            <Link
                                                                href={`/shop/${shop.slug}`}
                                                                style={{ color: 'inherit' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                               <Title 
  level={5} 
  style={{ margin: 0, color: 'black', cursor: 'default' }} 
  ellipsis
>
  {shop.name}
</Title>

                                                            </Link>
                                                           
                                                        </Space>
                                                        <div style={{ marginTop: 6 }}>
                                                            <StatusTag v={shop.status} />
                                                            {shop.is_verified && (
                                                                <Tooltip title="Shop đã xác minh">
                                                                    <SafetyCertificateTwoTone twoToneColor={BRAND} />
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* ĐÃ BỎ nút “Xem shop” theo yêu cầu */}
                                                </div>

                                                {/* content grow */}
                                                <div
                                                    style={{
                                                        padding: 16,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 12,
                                                        flex: 1,
                                                    }}
                                                >
                                              <Space size="small" align="center" wrap>
  {shop.rating != null && Number(shop.rating) > 0 ? (
    <>
      <Rate
        allowHalf
        disabled
        value={Number(shop.rating)}
      />
      <Text strong style={{ color: 'black' }}>
        {Number(shop.rating).toFixed(1)}
      </Text>
      <Text style={{ color: 'black' }}>điểm</Text>
    </>
  ) : (
    <Text strong style={{ color: 'black' }}>
      Chưa có đánh giá
    </Text>
  )}
</Space>


                                                    {/* giữ chiều cao mô tả để các thẻ bằng nhau */}
                                                    <div style={{ minHeight: 44 }}>
                                                       <Paragraph
  ellipsis={{ rows: 2 }}
  style={{ margin: 0, color: 'black' }}
>
  {shop.description || 'Shop chưa có mô tả.'}
</Paragraph>

                                                    </div>

                                                    {/* footer (chỉ còn hủy theo dõi) */}
                                                    <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                                                        <Popconfirm
                                                            title="Hủy theo dõi shop?"
                                                            okText="Xác nhận"
                                                            cancelText="Hủy"
                                                            onConfirm={(e) => {
                                                                e?.stopPropagation();
                                                                handleUnfollow(shop.id);
                                                            }}
                                                            onCancel={(e) => e?.stopPropagation()}
                                                        >
                                                            <Button
                                                                block
                                                                danger
                                                                ghost
                                                                icon={<DeleteOutlined />}
                                                                loading={unfollowing === shop.id}
                                                                style={{ borderColor: BRAND, color: BRAND, flex: 1 }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {unfollowing === shop.id ? 'Đang hủy…' : 'Hủy theo dõi'}
                                                            </Button>
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>

                            {/* Chỉ hiện phân trang khi có hơn 1 trang */}
                            {total > PAGE_SIZE && (
                                <div
                                    style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}
                                >
                                    <Pagination
                                        current={currentPage}
                                        total={total}
                                        pageSize={PAGE_SIZE}
                                        onChange={(p) => setCurrentPage(p)}
                                        showSizeChanger={false}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            {/* animation cho popup */}
            <style jsx global>{`
        @keyframes slideInFade {
          0% {
            transform: translateY(-8px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideInFade {
          animation: slideInFade 280ms ease-out;
        }
      `}</style>
        </div>
    );
}
