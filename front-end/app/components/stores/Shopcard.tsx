'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import ShopProductSlider from '../home/ShopProduct';
import { API_BASE_URL } from '@/utils/api';
import { User, MessageCircle, Star, Phone, Package, Calendar, Users } from 'lucide-react';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Typography,
  Divider,
  Space,
} from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';

const { Text, Title } = Typography;

declare global {
  interface WindowEventMap {
    'open-chat-with-user': CustomEvent<{
      id: number;
      name: string;
      avatar?: string | null;
      role?: string;
      isBot?: boolean;
    }>;
    'open-chat-box': CustomEvent<{
      receiverId: number;
      receiverName: string;
      avatar?: string;
    }>;
  }
}

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} năm trước`;
};

interface Shop {
  id: number;
  name: string;
  description: string;
  logo: string;
  phone: string;
  rating: number | null;
  total_sales: number;
  created_at: string;
  status: 'activated' | 'pending' | 'suspended';
  email: string;
  slug: string;
  followers_count: number;
  is_following?: boolean;
  user_id?: number | null;
  owner_user_id?: number | null;
}

export default function ShopCard({ shop }: { shop: Shop }) {
  const [followed, setFollowed] = useState<boolean>(!!shop?.is_following);
  useEffect(() => setFollowed(!!shop?.is_following), [shop?.id, shop?.is_following]);

  const [followers, setFollowers] = useState<number>(shop.followers_count ?? 0);
  useEffect(() => setFollowers(shop.followers_count ?? 0), [shop.id, shop.followers_count]);

  const [pending, setPending] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');

  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => setShowPopup(false), 1800);
    return () => clearTimeout(t);
  }, [showPopup]);

  const toast = (msg: string) => {
    setPopupText(msg);
    setShowPopup(true);
  };
  // 1) thêm các helper ở đầu file (sau import)

  const extractFirstUrl = (s: string): string | null => {
    // case 1: là JSON array: ["https://...jpg", "..."]
    const trimmed = s.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
          return arr[0];
        }
      } catch { /* ignore */ }
    }
    // case 2: chuỗi “dính liền” nhiều mảng: ["https://...jpg"]["https://...jpg"]...
    const re = /https?:\/\/[^\]\s"]+/g;
    const matches = s.match(re);
    if (matches && matches.length > 0) return matches[0];

    // case 3: chỉ là một path/URL bình thường
    return trimmed || null;
  };

  const toFirstImage = (input: unknown): string | null => {
    if (!input) return null;

    if (Array.isArray(input)) {
      const first = input.find(x => typeof x === "string" && x.trim().length > 0);
      return first ?? null;
    }

    if (typeof input === "string") {
      const first = extractFirstUrl(input);
      return first;
    }

    return null;
  };

  const formatShopLogoUrl = (logo: unknown): string => {
    const first = toFirstImage(logo);

    // fallback ảnh mặc định khi không có logo
    if (!first) return "/shop_default_logo.png";

    // nếu đã là URL tuyệt đối -> trả nguyên
    if (first.startsWith("http://") || first.startsWith("https://")) return first;

    // nếu là đường dẫn tuyệt đối trên storage (/storage/shops/xxx.jpg)
    if (first.startsWith("/")) {
      return `${API_BASE_URL}/image${first}`; // backend proxy /image/<path>
    }

    // còn lại là relative path (storage/shops/xxx.jpg)
    return `${API_BASE_URL}/image/${first}`;
  };

  const followShop = async () => {
    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) return toast('Vui lòng đăng nhập để theo dõi cửa hàng');
    setPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/shops/${shop.id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFollowed(true);
        setFollowers((v) => v + 1);
        toast(data?.message || 'Đã theo dõi cửa hàng');
      } else {
        if (data?.message?.toLowerCase?.().includes('đã theo dõi')) setFollowed(true);
        toast(data?.message || 'Theo dõi thất bại. Vui lòng thử lại!');
      }
    } catch {
      toast('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setPending(false);
    }
  };

  const unfollowShop = async () => {
    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) return toast('Vui lòng đăng nhập để hủy theo dõi');
    setPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/shops/${shop.id}/unfollow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFollowed(false);
        setFollowers((v) => Math.max(0, v - 1));
        toast(data?.message || 'Đã hủy theo dõi cửa hàng');
      } else {
        if (data?.message?.toLowerCase?.().includes('chưa theo dõi')) setFollowed(false);
        toast(data?.message || 'Hủy theo dõi thất bại. Vui lòng thử lại!');
      }
    } catch {
      toast('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setPending(false);
    }
  };

  const handleOpenChat = () => {
    if (!shop) return;
    const receiverId = Number(shop.id);
    if (!Number.isFinite(receiverId)) {
      console.warn('Lỗi không nhận được id.');
      return;
    }
    const avatarUrl = shop.logo ? `${API_BASE_URL}/image/${shop.logo}` : undefined;
    window.dispatchEvent(
      new CustomEvent('open-chat-box', {
        detail: {
          receiverId,
          receiverName: shop.name,
          avatar: avatarUrl,
        },
      })
    );
  };

  const toggleFollow = useCallback(
    () => (followed ? unfollowShop() : followShop()),
    [followed]
  );

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#db4444',
            colorInfo: '#db4444',
            borderRadiusLG: 14,
            fontSize: 14,
          },
          components: {
            Button: { controlHeight: 34, paddingInline: 12 },
            Card: { paddingLG: 16 },
            Tag: { defaultBg: '#eef6ee' },
          },
        }}
      >
        {/* Khoanh vùng để reset các rule global “quá tay” */}
        <div className="shop-root">
          {/* COVER */}
          <div className="rounded-2xl overflow-hidden">
            <Image
              src="/shop_cover.jpg"
              alt="Shop Cover"
              width={1440}
              height={280}
              className="w-full h-[220px] md:h-[280px] object-cover"
              priority
            />
          </div>

          {/* INFO */}
          <Card className="mt-4" variant="outlined" styles={{ body: { paddingTop: 12, paddingBottom: 12 } }}>
            <Row gutter={[16, 16]} align="middle" wrap>
              <Col xs={24} md={12} lg={10}>
                <Space align="center" size={12} wrap>
                  <Avatar
                    size={72}
                    src={formatShopLogoUrl(shop.logo)}
                    style={{
                      border: '3px solid #fff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                      backgroundColor: '#fafafa',
                    }}
                  />
                  <div>
                    <Space size={8} align="center" wrap>
                      <Title level={4} style={{ margin: 0 }}>
                        {shop.name}
                      </Title>
                      <Tag color={shop.status === 'activated' ? 'success' : 'default'}>
                        {shop.status === 'activated' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                      </Tag>
                    </Space>
                    <div className="mt-1">
                      <Tooltip title={shop.email}>
                        <Text
                          type="secondary"
                          ellipsis={{ tooltip: false }}
                          style={{ maxWidth: 260, display: 'inline-block' }}
                        >
                          {shop.email}
                        </Text>
                      </Tooltip>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={24} md={12} lg={14}>
                <Row justify="end" gutter={8} wrap>
                  <Col>
                    <Button
                      onClick={toggleFollow}
                      loading={pending}
                      type={followed ? 'default' : 'primary'}
                      ghost={followed}
                      icon={<User size={16} />}
                    >
                      {followed ? 'Đã theo dõi' : 'Theo dõi'}
                    </Button>
                  </Col>
                  <Col>
                    <Button icon={<MessageCircle size={16} />} onClick={handleOpenChat}>
                      Chat
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            {/* Stats */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Space>
                  <Phone size={16} className="text-[#db4444]" />
                  <div>
                    <Text type="secondary">Điện thoại</Text>
                    <div className="font-semibold text-black">{shop.phone}</div>
                  </div>
                </Space>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Space>
                  <Package size={16} className="text-[#db4444]" />
                  <div>
                    <Text type="secondary">Đã bán</Text>
                    <div className="font-semibold text-black">
                      {shop.total_sales ? shop.total_sales : 'Chưa có lượt bán'}
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Space>
                  <Star size={16} className="text-[#db4444]" />
                  <div>
                    <Text type="secondary">Đánh giá</Text>
                    <div className="font-semibold text-black">
                      {shop.rating !== null ? shop.rating : 'Chưa có đánh giá'}
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Space>
                  <Calendar size={16} className="text-[#db4444]" />
                  <div>
                    <Text type="secondary">Tham gia</Text>
                    <div className="font-semibold text-black">{formatTimeAgo(shop.created_at)}</div>
                  </div>
                </Space>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Space>
                  <Users size={16} className="text-[#db4444]" />
                  <div>
                    <Text type="secondary">Người theo dõi</Text>
                    <div className="font-semibold text-black">
                      {followers > 0 ? followers : 'Chưa có người theo dõi'}
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Products */}
          {shop.slug && (
            <div className="w-full max-w-screen-xl mx-auto mt-6">
              <ShopProductSlider shopSlug={shop.slug} />
            </div>
          )}

          {/* Toast */}
          {showPopup && (
            <div className="fixed top-[120px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500">
              {popupText}
            </div>
          )}
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}
