'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

import {
    Alert,
    Avatar,
    Badge,
    Card,
    ConfigProvider,
    Empty,
    List,
    Skeleton,
    Space,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    BellOutlined,
    CheckCircleTwoTone,
    ClockCircleOutlined,
    LinkOutlined,
} from '@ant-design/icons';

import { StyleProvider } from '@ant-design/cssinjs';

const { Title, Text, Paragraph } = Typography;

interface Notification {
    id: number;
    image_url: string;
    title: string;
    content: string;
    is_read: number; // 0: chưa đọc, 1: đã đọc
    link: string;
    created_at: string;
}

// === Thêm hàm format ảnh ===
const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (typeof img !== 'string' || !img.trim()) {
        return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    return img.startsWith('http')
        ? img
        : `${STATIC_BASE_URL}/${img.startsWith('/') ? img.slice(1) : img}`;
};

function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;

    const weeks = Math.floor(days / 7);
    return `${weeks} tuần trước`;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoverId, setHoverId] = useState<number | null>(null);

    const token = useMemo(() => Cookies.get('authToken'), []);

    // Fetch notifications
    useEffect(() => {
        if (!token) {
            setErrorMessage('Bạn cần đăng nhập để xem thông báo.');
            setLoading(false);
            return;
        }

        axios
            .get(`${API_BASE_URL}/notification`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setNotifications(res.data);
                    setErrorMessage(null);
                } else {
                    setErrorMessage('Không có thông báo nào.');
                }
            })
            .catch((err) => {
                console.error('Lỗi khi lấy thông báo', err);
                setErrorMessage('Lỗi khi tải thông báo. Vui lòng thử lại.');
            })
            .finally(() => setLoading(false));
    }, [token]);

    // Mark read + go to link
    const handleNotificationClick = async (n: Notification) => {
        try {
            if (!token) {
                setErrorMessage('Bạn cần đăng nhập để thực hiện thao tác này.');
                return;
            }

            if (n.is_read === 0) {
                await axios.put(
                    `${API_BASE_URL}/notification/${n.id}/mark-read`,
                    null,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setNotifications((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x))
                );
            }

            window.location.href = n.link;
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái thông báo', err);
            message.error('Lỗi khi cập nhật trạng thái thông báo.');
        }
    };

    const unreadCount = notifications.filter((n) => n.is_read === 0).length;

    return (
        <StyleProvider hashPriority="high">
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#db4444',
                        colorInfo: '#db4444',
                    },
                    components: {
                        Tag: {
                            colorError: '#db4444',
                        },
                        Badge: {
                            colorError: '#db4444',
                        },
                    },
                }}
            >
                <div
                    className="notif-root"
                    style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '32px 16px' }}
                >
                    {/* Header */}
                    <Card
                        styles={{ body: { padding: 20 } }}
                        style={{
                            marginBottom: 16,
                            background:
                                'linear-gradient(90deg, rgba(219,68,68,0.06), rgba(219,68,68,0.02) 45%, rgba(255,255,255,1))',
                            borderRadius: 16,
                        }}
                    >
                        {errorMessage ? (
                            <Alert
                                type="error"
                                message={errorMessage}
                                showIcon
                                style={{ borderRadius: 12 }}
                            />
                        ) : (
                            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space align="center" size={14}>
                                    <Badge count={unreadCount} color="#db4444" offset={[0, 6]}>
                                        <div
                                            style={{
                                                width: 48,
                                                height: 48,
                                                display: 'grid',
                                                placeItems: 'center',
                                                borderRadius: 14,
                                                background:
                                                    'linear-gradient(135deg, #db4444 0%, #f06a6a 100%)',
                                                color: '#fff',
                                            }}
                                        >
                                            <BellOutlined style={{ fontSize: 22 }} />
                                        </div>
                                    </Badge>
                                    <div>
                                        <Title level={3} style={{ margin: 0 }}>
                                            Thông báo
                                        </Title>
                                        <Text type="secondary">
                                            {notifications.length > 0
                                                ? `${notifications.length} thông báo`
                                                : 'Chưa có thông báo'}
                                        </Text>
                                    </div>
                                </Space>
                                {/* Bỏ nút Trang thông báo theo yêu cầu */}
                            </Space>
                        )}
                    </Card>

                    {/* Danh sách */}
                    <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 0 }}>
                        {loading ? (
                            <div style={{ padding: 24 }}>
                                <List
                                    itemLayout="vertical"
                                    dataSource={[1, 2, 3, 4, 5, 6]}
                                    renderItem={(i) => (
                                        <List.Item key={i}>
                                            <Skeleton
                                                active
                                                title
                                                paragraph={{ rows: 2 }}
                                                avatar={{ shape: 'square', size: 56 }}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: 48 }}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <>
                                            <Title level={5} style={{ marginBottom: 0 }}>
                                                Chưa có thông báo
                                            </Title>
                                            <Text type="secondary">
                                                Hiện tại bạn chưa có thông báo nào để hiển thị
                                            </Text>
                                        </>
                                    }
                                />
                            </div>
                        ) : (
                            <List
                                itemLayout="vertical"
                                dataSource={notifications}
                                pagination={{
                                    pageSize: 6,
                                    showSizeChanger: false,
                                    style: { padding: '8px 16px 16px' },
                                }}
                                renderItem={(n) => {
                                    const isUnread = n.is_read === 0;
                                    // === Dùng formatImageUrl thay cho ghép tay ===
                                    const coverSrc = formatImageUrl(n.image_url);
                                    const hovered = hoverId === n.id;

                                    return (
                                        <List.Item
                                            key={n.id}
                                            onMouseEnter={() => setHoverId(n.id)}
                                            onMouseLeave={() => setHoverId(null)}
                                            onClick={() => handleNotificationClick(n)}
                                            style={{
                                                padding: 16,
                                                background: isUnread
                                                    ? 'rgba(219,68,68,0.04)'
                                                    : hovered
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'transparent',
                                                transition: 'all .2s ease',
                                                cursor: 'pointer',
                                                transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
                                            }}
                                        >
                                            <Space align="start" style={{ width: '100%' }} size={16}>
                                                <Badge dot={isUnread} color="#db4444">
                                                    <Avatar
                                                        shape="square"
                                                        size={56}
                                                        src={coverSrc}
                                                        alt={n.title}
                                                        style={{ borderRadius: 12 }}
                                                        onError={() => false}
                                                    />
                                                </Badge>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Space
                                                        align="start"
                                                        style={{ width: '100%', justifyContent: 'space-between' }}
                                                    >
                                                        <Title
                                                            level={5}
                                                            style={{ margin: 0, color: isUnread ? '#1f1f1f' : '#595959' }}
                                                        >
                                                            {n.title}
                                                        </Title>
                                                        {n.is_read === 1 && (
                                                            <CheckCircleTwoTone twoToneColor="#52c41a" />
                                                        )}
                                                    </Space>

                                                    <Paragraph
                                                        type="secondary"
                                                        ellipsis={{ rows: 2 }}
                                                        style={{ margin: '6px 0 10px' }}
                                                    >
                                                        {n.content}
                                                    </Paragraph>

                                                    <Space align="center" size={10}>
                                                        <Text type="secondary">
                                                            <ClockCircleOutlined /> {formatTime(n.created_at)}
                                                        </Text>
                                                        <Tag
                                                            color="#db4444"
                                                            style={{
                                                                borderRadius: 999,
                                                                opacity: hovered ? 1 : 0.3,
                                                                transition: 'opacity .2s ease',
                                                            }}
                                                            icon={<LinkOutlined />}
                                                        >
                                                            Mở
                                                        </Tag>
                                                    </Space>
                                                </div>
                                            </Space>
                                        </List.Item>
                                    );
                                }}
                            />
                        )}
                    </Card>
                </div>
            </ConfigProvider>
        </StyleProvider>
    );
}
