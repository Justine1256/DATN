'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import {
  Button,
  Modal,
  Input,
  Radio,
  Tag,
  List,
  Card,
  Typography,
  Space,
  Alert,
  Spin,
  // Divider,
  message,
} from 'antd';

const { Text, Title } = Typography;

// ===== Types =====
interface CartItem {
  id: string | number;
  quantity: number;
  product: {
    name: string;
    image: string[];
    price: number;
    sale_price?: number | null;
  };
  variant?: {
    price?: number | null;
    sale_price?: number | null;
  };
}
export type VoucherType = 'percent' | 'amount' | 'shipping' | string;
export interface Voucher {
  id: number | string;
  code: string;
  title?: string;
  description?: string;
  type: VoucherType;
  value: number;
  min_order?: number;
  expires_at?: string;
  is_active?: boolean;
}

interface Props {
  onPaymentInfoChange: (info: {
    paymentMethod: string;
    subtotal: number;
    promotionDiscount: number;
    shipping: number;
    total: number;
  }) => void;
  onCartChange: (items: CartItem[]) => void;

  onVoucherApplied?: (res: {
    voucher: Voucher | null;
    serverDiscount: number | null;
    serverFreeShipping: boolean;
    code: string | null;
  }) => void;
}

export default function CartAndPayment({ onPaymentInfoChange, onCartChange, onVoucherApplied }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Voucher state =====
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | number | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [requireLogin, setRequireLogin] = useState(false);

  const [applying, setApplying] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // ===== Popup trượt từ phải =====
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const token = useMemo(
    () =>
      typeof window !== 'undefined'
        ? (localStorage.getItem('token') || Cookies.get('authToken') || '')
        : '',
    []
  );

  // ========= Helpers =========
  const isVoucherExpired = useCallback((v: Voucher) => {
    if (!v?.expires_at) return false;
    const t = new Date(v.expires_at).getTime();
    return Number.isFinite(t) && t < Date.now();
  }, []);
  // Hiển thị tên loại voucher theo tiếng Việt
  const displayVoucherType = (t?: VoucherType) => {
    if (!t) return '';
    const type = String(t).toLowerCase();
    if (type === 'percent') return 'Giảm %';
    if (type === 'amount') return 'Giảm tiền';
    if (type === 'shipping') return 'Miễn phí vận chuyển';
    return t; // fallback
  };
  const badgeValue = useCallback((v: Voucher) => {
    if (!v) return '';
    if (v.type === 'percent') return `${v.value}%`;
    if (v.type === 'shipping') return 'Miễn phí vận chuyển';
    if (v.type === 'amount') return `Giảm ${new Intl.NumberFormat('vi-VN').format(v.value)}₫`;
    return '';
  }, []);


  const getPriceToUse = useCallback((item: CartItem) => {
    return (
      item.variant?.sale_price ??
      item.variant?.price ??
      item.product.sale_price ??
      item.product.price ??
      0
    );
  }, []);

  const formatImageUrl = useCallback((img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) return `${STATIC_BASE_URL}/products/default-product.png`;
    if (img.startsWith('http')) return img;
    return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
  }, []);

  const VND = useCallback(
    (n: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n))) + 'đ',
    []
  );

  // ========= Cart compute (memo) =========
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const discountedSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + getPriceToUse(item) * item.quantity, 0),
    [cartItems, getPriceToUse]
  );

  const baseDiscount = Math.max(0, subtotal - discountedSubtotal);
  const shippingBase = cartItems.length > 0 ? 20000 : 0;

  const meetsMinOrder = useCallback(
    (v: Voucher | null) => {
      if (!v?.min_order) return true;
      return discountedSubtotal >= v.min_order;
    },
    [discountedSubtotal]
  );

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher || !meetsMinOrder(appliedVoucher)) return 0;
    const type = (appliedVoucher.type || 'amount').toLowerCase();
    const val = Number(appliedVoucher.value || 0);
    if (type === 'percent') return Math.max(0, Math.floor((discountedSubtotal * val) / 100));
    if (type === 'amount') return Math.min(discountedSubtotal, Math.max(0, Math.floor(val)));
    return 0;
  }, [appliedVoucher, discountedSubtotal, meetsMinOrder]);

  const shippingAfterVoucher = useMemo(() => {
    if (!appliedVoucher || !meetsMinOrder(appliedVoucher)) return shippingBase;
    const type = (appliedVoucher.type || '').toLowerCase();
    if (type === 'shipping') return 0;
    return shippingBase;
  }, [appliedVoucher, meetsMinOrder, shippingBase]);

  const promotionDiscount = baseDiscount + voucherDiscount;
  const total = Math.max(0, discountedSubtotal - voucherDiscount + shippingAfterVoucher);

  // ========= Fetch Cart =========
  useEffect(() => {
    let mounted = true;
    const t = localStorage.getItem('token') || Cookies.get('authToken');

    (async () => {
      try {
        if (!t) {
          const guestCart = localStorage.getItem('cart');
          const parsed = guestCart ? JSON.parse(guestCart) : [];
          const formatted: CartItem[] = parsed.map((item: any, index: number) => ({
            id: `guest-${index}`,
            quantity: item.quantity,
            product: {
              id: Number(item.product_id ?? item.id ?? 0),
              name: item.name,
              image: [item.image],
              price: item.price,
              sale_price: item.sale_price ?? null,
            } as any,
            variant: item.variant ?? null,
          }));
          if (!mounted) return;
          setCartItems(formatted);
          onCartChange(formatted);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/cart`, {
          headers: { Authorization: `Bearer ${t}` },
        });

        const serverCart: CartItem[] = (res.data || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: Number(item.product?.id ?? item.product_id ?? 0),
            name: item.product?.name || 'Sản phẩm',
            image: Array.isArray(item.product?.image) ? item.product.image : [item.product?.image],
            price: item.product?.price || 0,
            sale_price: item.product?.sale_price ?? null,
          } as any,
          variant: item.variant ?? null,
        }));

        if (!mounted) return;
        setCartItems(serverCart);
        onCartChange(serverCart);
        localStorage.removeItem('cart');
      } catch (err) {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        if (!mounted) return;
        setCartItems([]);
        onCartChange([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onCartChange]);

  // ========= Emit payment info to parent =========
  useEffect(() => {
    onPaymentInfoChange({
      paymentMethod,
      subtotal,
      promotionDiscount,
      shipping: shippingAfterVoucher,
      total,
    });
  }, [paymentMethod, subtotal, promotionDiscount, shippingAfterVoucher, total, onPaymentInfoChange]);

  // ========= Voucher modal =========
  const openVoucherModal = useCallback(() => {
    const isLoggedIn = !!token;
    if (!isLoggedIn) {
      setRequireLogin(true);
      setVoucherError(null);
      setShowVoucherModal(true);
      return;
    }

    setRequireLogin(false);
    setShowVoucherModal(true);

    if (vouchers.length === 0) {
      setVoucherLoading(true);
      setVoucherError(null);

      axios
        .get(`${API_BASE_URL}/my-vouchers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        .then((res) => {
          const listRaw = Array.isArray(res.data?.data)
            ? res.data.data
            : res.data?.data?.vouchers || res.data || [];

          const mapped: Voucher[] = listRaw.map((v: any) => {
            const src = v.voucher ?? v;
            const discountType = String(src.discount_type ?? src.type ?? 'amount').toLowerCase();
            return {
              id: v.id ?? src.id ?? src.voucher_id ?? src.code,
              code: String(src.code ?? src.voucher_code ?? src.coupon_code ?? '').trim(),
              title: src.title ?? src.name ?? src.label ?? undefined,
              description: src.description ?? src.desc ?? undefined,
              type:
                discountType === 'percent' ||
                  discountType === 'amount' ||
                  discountType === 'shipping'
                  ? (discountType as VoucherType)
                  : 'amount',
              value: Number(src.discount_value ?? src.value ?? src.amount ?? 0),
              min_order: src.min_order_value
                ? Number(src.min_order_value)
                : src.min_order_amount
                  ? Number(src.min_order_amount)
                  : undefined,
              expires_at:
                src.end_date ??
                src.expires_at ??
                src.expired_at ??
                src.end_at ??
                src.expired_time ??
                undefined,
              is_active: src.is_active ?? src.active ?? true,
            };
          });

          setVouchers(mapped);
        })
        .catch((err) => {
          console.error('Lỗi khi load voucher:', err);
          setVoucherError('Không tải được danh sách voucher.');
        })
        .finally(() => setVoucherLoading(false));
    }
  }, [token, vouchers.length]);

  const closeVoucherModal = useCallback(() => {
    setShowVoucherModal(false);
    setVoucherSearch('');
    setSelectedVoucherId(appliedVoucher?.id ?? null);
  }, [appliedVoucher?.id]);

  const clearVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setSelectedVoucherId(null);
    onVoucherApplied?.({ voucher: null, serverDiscount: 0, serverFreeShipping: false, code: null });

    // Show toast trượt từ phải
    setPopupMessage('Đã bỏ voucher.');
    setShowPopup(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowPopup(false), 2500);
  }, [onVoucherApplied]);

  // Debounce search
  const debouncedSearch = useMemo(() => voucherSearch.trim().toLowerCase(), [voucherSearch]);

  const filteredVouchers = useMemo(() => {
    const s = debouncedSearch;
    const list = !s
      ? vouchers.slice()
      : vouchers.filter((v) =>
        [v.code, v.title, v.description].filter(Boolean).some((x) => String(x).toLowerCase().includes(s))
      );

    return list.sort((a, b) => {
      const ad = (a.is_active !== false) && !isVoucherExpired(a) ? 1 : 0;
      const bd = (b.is_active !== false) && !isVoucherExpired(b) ? 1 : 0;
      return bd - ad;
    });
  }, [vouchers, debouncedSearch, isVoucherExpired]);

  const applyVoucher = useCallback(async () => {
    const v = vouchers.find((x) => String(x.id) === String(selectedVoucherId)) || null;
    if (!v) return;

    if (!token) {
      setRequireLogin(true);
      return;
    }

    try {
      setApplying(true);
      setVoucherError(null);

      const res = await axios.post(
        `${API_BASE_URL}/vouchers/apply`,
        { code: v.code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { discount_amount, is_free_shipping } = res.data || {};

      setAppliedVoucher(v);
      setShowVoucherModal(false);

      onVoucherApplied?.({
        voucher: v,
        serverDiscount: typeof discount_amount === 'number' ? discount_amount : 0,
        serverFreeShipping: !!is_free_shipping,
        code: v.code || null,
      });

      // Show toast trượt từ phải
      setPopupMessage('Áp dụng voucher thành công!');
      setShowPopup(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowPopup(false), 2500);
    } catch (err: any) {
      setVoucherError(err?.response?.data?.message || 'Không áp dụng được voucher.');
      messageApi.error('Áp dụng voucher thất bại.');
    } finally {
      setApplying(false);
    }
  }, [selectedVoucherId, vouchers, token, onVoucherApplied, messageApi]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ====== UI ======
  return (
    <div className="space-y-4">
      {contextHolder}

      {/* Toast trượt từ góc phải */}
      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
          {popupMessage}
        </div>
      )}

      {/* Header */}
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Giỏ hàng</Title>
        <Button
          type="primary"
          onClick={openVoucherModal}
          style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
        >
          Chọn voucher
        </Button>
      </Space>

      {/* Voucher đang chọn */}
      {appliedVoucher && (
        <Alert
          type="success"
          showIcon
          message={
            <Space wrap>
              <Text strong>Voucher đã chọn:</Text>
              <Tag bordered={false} color="default">{appliedVoucher.code || `#${appliedVoucher.id}`}</Tag>
              {appliedVoucher.type && <Tag color="blue">{displayVoucherType(appliedVoucher.type)}</Tag>}
              <Tag bordered={false}>{badgeValue(appliedVoucher)}</Tag>

              {typeof appliedVoucher.min_order === 'number' && (
                <Text type="secondary">
                  ĐH tối thiểu:{' '}
                  {new Intl.NumberFormat('vi-VN').format(appliedVoucher.min_order)}₫
                </Text>
              )}
              {appliedVoucher.expires_at && (
                <Text type={isVoucherExpired(appliedVoucher) ? 'danger' : undefined}>
                  HSD: {new Date(appliedVoucher.expires_at).toLocaleDateString('vi-VN')}
                </Text>
              )}
            </Space>
          }
          action={<Button size="small" onClick={clearVoucher}>Bỏ voucher</Button>}
        />
      )}

      {/* Danh sách sản phẩm */}
      <Card size="small" styles={{ body: { padding: 12 } }} title={<Text strong>Mặt hàng</Text>}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : cartItems.length === 0 ? (
          <Alert type="info" message="Giỏ hàng của bạn đang trống." />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={cartItems}
            renderItem={(item) => {
              const price = getPriceToUse(item);
              const originalTotal = item.product.price * item.quantity;
              const finalTotal = price * item.quantity;
              const hasDiscount = price < item.product.price;

              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <img
                        src={formatImageUrl(item.product.image)}
                        alt={item.product.name || 'Product'}
                        style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid #f0f0f0' }}
                      />
                    }
                    title={<Text strong>{item.product.name}</Text>}
                    description={
                      <Space size="small" wrap>
                        <Text type="secondary">SL: {item.quantity}</Text>
                      </Space>
                    }
                  />
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    {hasDiscount ? (
                      <>
                        <div><Text delete type="secondary">{VND(originalTotal)}</Text></div>
                        <div><Text strong type="danger">{VND(finalTotal)}</Text></div>
                      </>
                    ) : (
                      <Text strong>{VND(finalTotal)}</Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* Phương thức thanh toán */}
      <Card size="small" styles={{ body: { padding: 12 } }} title={<Text strong>Phương thức thanh toán</Text>}>
        <Radio.Group
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <Space direction="vertical">
            <Radio value="cod">Thanh toán khi nhận hàng (COD)</Radio>
            <Radio value="vnpay">VNPAY</Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* (Giữ nguyên phần tóm tắt tiền nếu cần bật lại) */}

      {/* Modal chọn voucher */}
      <Modal
        open={showVoucherModal}
        onCancel={closeVoucherModal}
        title="Chọn voucher của bạn"
        footer={
          requireLogin ? (
            <Space>
              <Button onClick={closeVoucherModal}>Đóng</Button>
              <Button
                type="primary"
                onClick={() => (window.location.href = '/login')}
                style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
              >
                Đăng nhập
              </Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={closeVoucherModal}>Hủy</Button>
              <Button
                type="primary"
                disabled={selectedVoucherId === null || applying}
                loading={applying}
                onClick={applyVoucher}
                style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
              >
                Áp dụng
              </Button>
            </Space>
          )
        }
      >
        {requireLogin ? (
          <Alert
            type="warning"
            showIcon
            message="Bạn cần đăng nhập để sử dụng voucher."
            description="Vui lòng đăng nhập để xem và áp dụng voucher của bạn."
          />
        ) : (
          <>
            <Input
              placeholder="Tìm theo mã, tên, mô tả..."
              value={voucherSearch}
              onChange={(e) => setVoucherSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            {voucherLoading && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
            {voucherError && <Alert type="error" showIcon message={voucherError} />}
            {!voucherLoading && !voucherError && filteredVouchers.length === 0 && (
              <Alert type="info" showIcon message="Không có voucher phù hợp." />
            )}

            {!voucherLoading && !voucherError && filteredVouchers.length > 0 && (
              <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
                <List
                  dataSource={filteredVouchers}
                  rowKey={(v) => String(v.id)}
                  renderItem={(v) => {
                    const selected = String(selectedVoucherId ?? appliedVoucher?.id) === String(v.id);
                    const expired = isVoucherExpired(v);
                    const disabled = !!expired || (typeof v.is_active === 'boolean' && !v.is_active);

                    return (
                      <List.Item
                        onClick={() => {
                          if (!disabled) setSelectedVoucherId(selected ? null : v.id);
                        }}
                        style={{
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          background: selected ? '#edf5ff' : undefined,
                          opacity: disabled ? 0.6 : 1,
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <Space align="start">
                          <Radio checked={selected} disabled={disabled} />
                          <Space direction="vertical" size={4}>
                            <Space wrap>
                              <Tag bordered={false}>{v.code || `#${v.id}`}</Tag>
                              {v.type && (
                                <Tag color="blue">
                                  {v.type === 'amount'
                                    ? 'Giảm tiền'
                                    : v.type === 'percent'
                                      ? 'Giảm %'
                                      : v.type === 'shipping'
                                        ? 'Miễn phí vận chuyển'
                                        : v.type}
                                </Tag>
                              )}

                              <Tag bordered={false}>{badgeValue(v)}</Tag>
                              {expired && <Tag color="red">Hết hạn</Tag>}
                            </Space>

                            {v.title && <Text strong>{v.title}</Text>}

                            <Space size="small" wrap>
                              {typeof v.min_order === 'number' && (
                                <Text type="secondary">
                                  ĐH tối thiểu: {new Intl.NumberFormat('vi-VN').format(v.min_order)}₫
                                </Text>
                              )}
                              {v.expires_at && (
                                <Text type={expired ? 'danger' : 'secondary'}>
                                  HSD: {new Date(v.expires_at).toLocaleDateString('vi-VN')}
                                </Text>
                              )}
                              {typeof v.is_active === 'boolean' && (
                                <Text type="secondary">Trạng thái: {v.is_active ? 'Đang hoạt động' : 'Ngừng'}</Text>
                              )}
                            </Space>

                            {v.description && <Text type="secondary">{v.description}</Text>}
                          </Space>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
