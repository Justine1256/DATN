'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import {
  Alert,
  Badge,
  Card,
  ConfigProvider,
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  Tabs,
  Button,
  message,
} from 'antd';
import {
  GiftOutlined,
  PercentageOutlined,
  FieldTimeOutlined,
  CopyOutlined,
  CheckOutlined,
  ShoppingOutlined,
  CrownOutlined,
  TruckOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Voucher {
  id: number;
  code: string;
  discount_value: number | string;
  discount_type: 'fixed' | 'percent';
  max_discount_value?: number | string | null;
  min_order_value: number | string;
  is_free_shipping: number;
  usage_limit: number | string;
  usage_count: number | string;
  start_date: string;
  end_date: string;
  shop_id: number | null;
  created_at?: string;
}

interface VoucherUserNested {
  id: number;
  voucher_id: number;
  created_at: string;
  voucher: Voucher;
}
type ApiItem = Voucher | VoucherUserNested;

type SafeVoucherUser = {
  id: number;
  created_at: string;
  voucher: Voucher;
};

// ===== Helpers =====
const toNumber = (v: number | string | null | undefined) =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    toNumber(value)
  );

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isExpired = (end?: string) => {
  if (!end) return false;
  const d = new Date(end);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
};

// shop_id null ⇒ Sàn/Admin, có số ⇒ Shop
const isAdminVoucher = (v: Voucher): boolean => v.shop_id === null;

export default function MyVouchersPage() {
  const [voucherUsers, setVoucherUsers] = useState<SafeVoucherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      const token = Cookies.get('authToken');
      if (!token) {
        setErrorMsg('Bạn cần đăng nhập để xem voucher.');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/my-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw: ApiItem[] = res?.data?.data ?? res?.data ?? [];

        const safe: SafeVoucherUser[] = raw
          .map((item: any): SafeVoucherUser | null => {
            if (item?.voucher) {
              // nested
              const v: Voucher = item.voucher;
              return {
                id: item.id ?? v.id,
                created_at: item.created_at ?? v.created_at ?? v.start_date,
                voucher: v,
              };
            }
            if (item?.code) {
              // flat
              const v: Voucher = {
                id: item.id,
                code: item.code,
                discount_value: item.discount_value,
                discount_type: item.discount_type,
                max_discount_value: item.max_discount_value,
                min_order_value: item.min_order_value,
                is_free_shipping: item.is_free_shipping,
                usage_limit: item.usage_limit,
                usage_count: item.usage_count,
                start_date: item.start_date,
                end_date: item.end_date,
                shop_id: item.shop_id ?? null,
                created_at: item.created_at,
              };
              return {
                id: item.id,
                created_at: item.created_at ?? item.start_date,
                voucher: v,
              };
            }
            return null;
          })
          .filter((x): x is SafeVoucherUser => !!x && !!x.voucher?.code);

        // ===== SẮP XẾP ƯU TIÊN CÒN HẠN TRƯỚC =====
        // Nhóm: 0 = còn hạn & còn lượt, 1 = còn hạn nhưng hết lượt, 2 = hết hạn
        const sorted = safe.sort((a, b) => {
          const va = a.voucher;
          const vb = b.voucher;
          const expiredA = isExpired(va.end_date);
          const expiredB = isExpired(vb.end_date);
          const usedUpA = toNumber(va.usage_count) >= toNumber(va.usage_limit);
          const usedUpB = toNumber(vb.usage_count) >= toNumber(vb.usage_limit);

          const scoreA = expiredA ? 2 : usedUpA ? 1 : 0;
          const scoreB = expiredB ? 2 : usedUpB ? 1 : 0;

          if (scoreA !== scoreB) return scoreA - scoreB;

          // Trong cùng nhóm, sắp theo ngày hết hạn gần nhất
          const dateA = new Date(va.end_date).getTime();
          const dateB = new Date(vb.end_date).getTime();
          return dateA - dateB;
        });

        setVoucherUsers(sorted);
      } catch {
        setErrorMsg('Không thể tải danh sách voucher. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      message.success('Đã sao chép mã');
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      message.error('Không thể sao chép mã');
    }
  };

  // Phân nhóm theo shop_id
  const adminList = voucherUsers.filter((vu) => isAdminVoucher(vu.voucher));
  const shopList = voucherUsers.filter((vu) => !isAdminVoucher(vu.voucher));

  // Card renderer (compact, chống tràn, chiều cao bằng nhau)
  const renderVoucherCard = (vu: SafeVoucherUser, kind: 'admin' | 'shop') => {
    const v = vu.voucher;
    const expired = isExpired(v.end_date);
    const usedUp = toNumber(v.usage_count) >= toNumber(v.usage_limit);
    const isValid = !expired && !usedUp;

    const headerIcon = kind === 'admin' ? <CrownOutlined /> : <ShoppingOutlined />;
    const headerColor = kind === 'admin' ? '#db4444' : '#52c41a';
    const borderColor = kind === 'admin' ? 'rgba(219,68,68,0.22)' : 'rgba(82,196,26,0.22)';
    const bgStripe =
      kind === 'admin'
        ? 'linear-gradient(135deg, rgba(219,68,68,0.045), rgba(219,68,68,0.012))'
        : 'linear-gradient(135deg, rgba(82,196,26,0.045), rgba(82,196,26,0.012))';

    return (
      <Card
        key={vu.id}
        hoverable
        style={{
          borderRadius: 10,
          borderColor,
          background: bgStripe,
          opacity: isValid ? 1 : 0.6,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 180,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLDivElement).style.transition = 'transform .15s ease';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0px)';
        }}
      >
        {/* TOP */}
        <Space align="start" style={{ width: '100%' }}>
          <Badge
            offset={[0, 0]}
            count={isValid ? <SafetyCertificateOutlined style={{ color: headerColor }} /> : null}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                background:
                  kind === 'admin'
                    ? 'linear-gradient(135deg, #db4444 0%, #f06a6a 100%)'
                    : 'linear-gradient(135deg, #52c41a 0%, #7ddc66 100%)',
                color: '#fff',
                fontSize: 16,
                flex: '0 0 auto',
              }}
            >
              {headerIcon}
            </div>
          </Badge>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header nhỏ gọn */}
            <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
              <Space size={6} align="center" wrap>
                <Tag color={kind === 'admin' ? '#db4444' : 'green'} style={{ borderRadius: 999, fontSize: 10, lineHeight: '16px' }}>
                  {kind === 'admin' ? 'Admin (Sàn)' : 'Shop'}
                </Tag>
                {v.is_free_shipping === 1 && (
                  <Tag color="blue" style={{ borderRadius: 999, fontSize: 10, lineHeight: '16px' }}>
                    <Space size={4}>
                      <TruckOutlined />
                      <Text ellipsis style={{ fontSize: 10 }}>Freeship</Text>
                    </Space>
                  </Tag>
                )}
                {v.discount_type === 'percent' ? (
                  <Tag color="gold" style={{ borderRadius: 999, fontSize: 10, lineHeight: '16px', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Space size={4}>
                      <PercentageOutlined />
                      <Text ellipsis style={{ fontSize: 10 }}>
                        {toNumber(v.discount_value)}% tối đa {v.max_discount_value ? formatCurrency(v.max_discount_value) : '—'}
                      </Text>
                    </Space>
                  </Tag>
                ) : (
                  <Tag color="purple" style={{ borderRadius: 999, fontSize: 10, lineHeight: '16px', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Space size={4}>
                      <GiftOutlined />
                      <Text ellipsis style={{ fontSize: 10 }}>
                        Giảm {formatCurrency(v.discount_value)}
                      </Text>
                    </Space>
                  </Tag>
                )}
              </Space>

              <Tag color={isValid ? 'green' : 'default'} style={{ borderRadius: 999, fontSize: 10, lineHeight: '16px' }}>
                {expired ? 'Hết hạn' : usedUp ? 'Hết lượt' : 'Còn hạn'}
              </Tag>
            </Space>

            {/* Code + copy */}
            <Space style={{ width: '100%', marginTop: 6, justifyContent: 'space-between' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 6px',
                  borderRadius: 6,
                  border: `1px dashed ${headerColor}`,
                  background: '#fff',
                  maxWidth: 'calc(100% - 26px)',
                }}
              >
                <Text strong style={{ color: headerColor, letterSpacing: 0.4, fontSize: 12 }} ellipsis>
                  {v.code}
                </Text>
              </div>

              <Tooltip title="Sao chép mã">
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleCopy(v.code, vu.id)}
                  icon={
                    copiedId === vu.id ? (
                      <CheckOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  style={{ padding: 0, width: 20, height: 20, minWidth: 20 }}
                />
              </Tooltip>
            </Space>

            {/* Meta info (flex:1 để căn đều chiều cao) */}
            <div style={{ marginTop: 6, flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              <Space size={6} wrap>
                <FieldTimeOutlined />
                <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                  HSD: {formatDate(v.end_date)}
                </Text>
              </Space>

              <Space size={6} wrap>
                <FieldTimeOutlined />
                <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                  Đã lưu: {formatDate(vu.created_at)}
                </Text>
              </Space>

              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                Đơn tối thiểu: <Text strong>{formatCurrency(v.min_order_value)}</Text>
              </Text>

              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {toNumber(v.usage_count) >= toNumber(v.usage_limit)
                  ? <>Đã dùng {toNumber(v.usage_count)}/{toNumber(v.usage_limit)}</>
                  : <>Còn {toNumber(v.usage_limit) - toNumber(v.usage_count)} lượt</>}
              </Text>
            </div>
          </div>
        </Space>
      </Card>
    );
  };

  const renderTab = (list: SafeVoucherUser[], kind: 'admin' | 'shop') => {
    if (loading) {
      return (
        <div style={{ padding: 14 }}>
          <List
            grid={{ gutter: 18, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
            dataSource={[1, 2, 3, 4, 5, 6]}
            renderItem={(i) => (
              <List.Item key={i} style={{ height: '100%' }}>
                <Card style={{ borderRadius: 10, minHeight: 180 }}>
                  <Skeleton active title paragraph={{ rows: 3 }} />
                </Card>
              </List.Item>
            )}
          />
        </div>
      );
    }

    if (!list.length) {
      return (
        <div style={{ padding: 18 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <>
                <Title level={5} style={{ marginBottom: 0 }}>
                  Chưa có voucher {kind === 'admin' ? 'Admin' : 'Shop'}
                </Title>
                <Text type="secondary">Khi có, chúng sẽ xuất hiện tại đây</Text>
              </>
            }
          />
        </div>
      );
    }

    return (
      <div style={{ padding: 14 }}>
        <List
          grid={{ gutter: 18, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
          pagination={{ pageSize: 9, showSizeChanger: false, style: { padding: '8px 4px 4px' } }}
          dataSource={list}
          renderItem={(vu) => (
            <List.Item style={{ height: '100%' }}>
              <div style={{ height: '100%' }}>{renderVoucherCard(vu, kind)}</div>
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#db4444', colorInfo: '#db4444', borderRadius: 10 },
        components: {
          Tag: { colorError: '#db4444' },
          Badge: { colorError: '#db4444' },
          Card: { borderRadiusLG: 10 },
          Tabs: { inkBarColor: '#db4444' },
        },
      }}
    >
      <div style={{ minHeight: '100vh', padding: 12 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <Card
            style={{
              marginBottom: 10,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(219,68,68,0.06), rgba(219,68,68,0.02) 45%, rgba(255,255,255,1))',
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Space align="center" size={10} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space align="center" size={10}>
                <Badge count={voucherUsers.length} color="#db4444">
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'linear-gradient(135deg, #db4444 0%, #f06a6a 100%)',
                      color: '#fff',
                    }}
                  >
                    <GiftOutlined />
                  </div>
                </Badge>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Voucher đã lưu
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Các mã giảm giá bạn đã lưu vào tài khoản
                  </Text>
                </div>
              </Space>
            </Space>
          </Card>

          {errorMsg && (
            <Alert type="error" message={errorMsg} showIcon style={{ marginBottom: 10, borderRadius: 10 }} />
          )}

          {/* Tabs Admin / Shop */}
          <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 10, overflow: 'hidden' }}>
            <Tabs
              items={[
                { key: 'admin', label: (<Space><CrownOutlined /> Admin</Space>), children: renderTab(adminList, 'admin') },
                { key: 'shop', label: (<Space><ShoppingOutlined /> Shop</Space>), children: renderTab(shopList, 'shop') },
              ]}
              tabBarStyle={{ padding: '0 12px', marginBottom: 0 }}
              destroyInactiveTabPane
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}
