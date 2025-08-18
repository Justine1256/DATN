'use client';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
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
  Divider,
  message,
  Collapse,
} from 'antd';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Title } = Typography;

/* ===================== Types ===================== */
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
  shop_id?: number | null;
  used?: boolean;
}

export interface CartItem {
  id: string | number;
  quantity: number;
  shop_id: number;
  shop_name?: string;
  product: {
    id?: number;
    name: string;
    image: string[] | string;
    price: number;
    sale_price?: number | null;
  };
  variant?: {
    price?: number | null;
    sale_price?: number | null;
  } | null;
}

type PaymentMethod = 'cod' | 'vnpay';

export interface PaymentInfoChangePayload {
  paymentMethod: PaymentMethod;
  perShop: Array<{
    shop_id: number;
    shop_name?: string;
    subTotal: number;
    voucherDiscount: number;
    shipping: number;
    lineTotal: number;
  }>;
  globalVoucherDiscount: number;
  globalFreeShipping: boolean;
  summary: { subTotal: number; discount: number; shipping: number; total: number };
  shopVouchers: Array<{ shop_id: number; code: string }>;
  globalVoucherCode: string | null;
}

interface Props {
  onPaymentInfoChange?: (info: PaymentInfoChangePayload) => void;
  onCartChange?: (items: CartItem[]) => void;
  onVoucherApplied?: (res: {
    voucher: Voucher | null;
    serverDiscount: number | null;
    serverFreeShipping: boolean;
    code?: string | null;
  }) => void;
}

/* ===================== Component ===================== */
const BRAND = '#DB4444';
const SHIPPING_EACH_SHOP = 20000;
const COLLAPSE_COUNT = 2;

const OneLine: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span
    style={{
      display: 'inline-block',
      maxWidth: 280,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
    title={typeof children === 'string' ? children : undefined}
  >
    {children}
  </span>
);

const CartByShop: React.FC<Props> = ({ onPaymentInfoChange, onCartChange, onVoucherApplied }) => {
  /* ---------- State ---------- */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeShopId, setActiveShopId] = useState<string>();

  // NEW: đọc danh sách id đã chọn từ localStorage
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('selectedCartIds') || '[]');
      if (Array.isArray(saved)) setSelectedIds(saved.map(String));
    } catch { /* noop */ }
  }, []);

  // server overrides
  const [applyLoading, setApplyLoading] = useState(false);
  const [serverGlobal, setServerGlobal] = useState<{ discount: number; freeShipping: boolean }>({
    discount: 0,
    freeShipping: false,
  });
  const [serverShop, setServerShop] = useState<Record<number, { discount: number; freeShipping: boolean }>>({});

  // voucher state
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherModalShopId, setVoucherModalShopId] = useState<number | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherErr, setVoucherErr] = useState<string | null>(null);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | number | null>(null);

  // voucher đã áp dụng
  const [applied, setApplied] = useState<{ global: Voucher | null; byShop: Record<number, Voucher | null> }>({
    global: null,
    byShop: {},
  });

  // toast trượt
  const [popupMsg, setPopupMsg] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [msgApi, ctxMsg] = message.useMessage();

  // Modal xem all item 1 shop
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemsModalShop, setItemsModalShop] = useState<{ shop_id: number; shop_name?: string; items: CartItem[] } | null>(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('token') || Cookies.get('authToken') || '' : ''),
    []
  );

  /* ---------- Helpers ---------- */
  const isExpired = useCallback((v: Voucher) => {
    if (!v?.expires_at) return false;
    const t = new Date(v.expires_at).getTime();
    return Number.isFinite(t) && t < Date.now();
  }, []);

  const badge = useCallback((v: Voucher) => {
    if (v.type === 'percent') return `${v.value}%`;
    if (v.type === 'amount') return `Giảm ${new Intl.NumberFormat('vi-VN').format(v.value)}₫`;
    if (v.type === 'shipping') return 'Miễn phí vận chuyển';
    return '';
  }, []);

  const VND = useCallback((n: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n))) + 'đ', []);
  const imageUrl = useCallback((img: string[] | string) => {
    let i = Array.isArray(img) ? img[0] : img;
    if (!i) return `${STATIC_BASE_URL}/products/default-product.png`;
    if (i.startsWith('http')) return i;
    return i.startsWith('/') ? `${STATIC_BASE_URL}${i}` : `${STATIC_BASE_URL}/${i}`;
  }, []);
  const unitPrice = useCallback(
    (it: CartItem) => it.variant?.sale_price ?? it.variant?.price ?? it.product.sale_price ?? it.product.price ?? 0,
    []
  );

  /* ---------- LỌC ITEMS THEO selectedCartIds ---------- */
  const itemsForCheckout = useMemo(() => {
    if (!selectedIds.length) return items; // nếu vào trực tiếp /checkout không có chọn trước → lấy tất cả
    const setIds = new Set(selectedIds);
    return items.filter((it) => setIds.has(String(it.id)));
  }, [items, selectedIds]);

  // Thông báo cho parent (nếu cần) mỗi khi danh sách dùng để checkout thay đổi
  useEffect(() => {
    onCartChange?.(itemsForCheckout);
  }, [itemsForCheckout, onCartChange]);

  /* ---------- Group cart theo shop (sau khi lọc) ---------- */
  const grouped = useMemo(() => {
    const map = new Map<number, { shop_id: number; shop_name?: string; items: CartItem[] }>();
    for (const it of itemsForCheckout) {
      if (!map.has(it.shop_id)) map.set(it.shop_id, { shop_id: it.shop_id, shop_name: it.shop_name, items: [] });
      map.get(it.shop_id)!.items.push(it);
    }
    return Array.from(map.values());
  }, [itemsForCheckout]);

  /* ---------- Tính tiền per shop & toàn giỏ ---------- */
  const perShopRaw = useMemo(
    () =>
      grouped.map((g) => ({
        shop_id: g.shop_id,
        shop_name: g.shop_name,
        sub: g.items.reduce((s, it) => s + unitPrice(it) * it.quantity, 0),
      })),
    [grouped, unitPrice]
  );

  const globalVoucherDiscount = useMemo(() => {
    if (serverGlobal.discount > 0) return serverGlobal.discount;
    const v = applied.global;
    if (!v || isExpired(v) || v.is_active === false) return 0;
    const subAll = perShopRaw.reduce((s, r) => s + r.sub, 0);
    if (typeof v.min_order === 'number' && subAll < v.min_order) return 0;
    if (v.type === 'percent') return Math.floor((subAll * v.value) / 100);
    if (v.type === 'amount') return Math.min(subAll, Math.floor(v.value));
    return 0;
  }, [applied.global, isExpired, perShopRaw, serverGlobal.discount]);

  const globalFreeShipping = useMemo(() => {
    if (serverGlobal.freeShipping) return true;
    const v = applied.global;
    if (!v || isExpired(v) || v.is_active === false) return false;
    const subAll = perShopRaw.reduce((s, r) => s + r.sub, 0);
    if (typeof v.min_order === 'number' && subAll < v.min_order) return false;
    return v.type === 'shipping';
  }, [applied.global, isExpired, perShopRaw, serverGlobal.freeShipping]);

  const perShopComputed = useMemo(
    () =>
      grouped.map((g) => {
        const sub = g.items.reduce((s, it) => s + unitPrice(it) * it.quantity, 0);
        const v = applied.byShop[g.shop_id];

        let vDiscount = 0;
        let ship = SHIPPING_EACH_SHOP;

        if (v && !(isExpired(v) || v.is_active === false)) {
          if (typeof v.min_order !== 'number' || sub >= v.min_order) {
            if (v.type === 'percent') vDiscount = Math.floor((sub * v.value) / 100);
            else if (v.type === 'amount') vDiscount = Math.min(sub, Math.floor(v.value));
            else if (v.type === 'shipping') {
              ship = 0;
            }
          }
        }

        // override server cho shop
        const ovr = serverShop?.[g.shop_id];
        if (ovr) {
          vDiscount = Math.max(0, Math.floor(Number(ovr.discount ?? 0)));
          if (ovr.freeShipping) ship = 0;
        }
        if (globalFreeShipping) ship = 0;

        const lineTotal = Math.max(0, sub - vDiscount) + ship;
        return {
          shop_id: g.shop_id,
          shop_name: g.shop_name,
          subTotal: sub,
          voucherDiscount: vDiscount,
          shipping: ship,
          lineTotal,
        };
      }),
    [grouped, applied.byShop, unitPrice, globalFreeShipping, isExpired, serverShop]
  );

  const summary = useMemo(() => {
    const subAll = perShopComputed.reduce((s, r) => s + r.subTotal, 0);
    const shopDiscounts = perShopComputed.reduce((s, r) => s + r.voucherDiscount, 0);
    const shippingAll = perShopComputed.reduce((s, r) => s + r.shipping, 0);
    const discountAll = shopDiscounts + globalVoucherDiscount;
    const total = Math.max(0, subAll - globalVoucherDiscount) - shopDiscounts + shippingAll;
    return { subTotal: subAll, discount: discountAll, shipping: shippingAll, total };
  }, [perShopComputed, globalVoucherDiscount]);

  const shopVouchers = useMemo(
    () =>
      Object.entries(applied.byShop || {})
        .filter(([, v]) => v?.code)
        .map(([sid, v]) => ({ shop_id: Number(sid), code: String(v!.code) })),
    [applied.byShop]
  );
  const globalVoucherCode = applied.global?.code ?? null;

  useEffect(() => {
    onPaymentInfoChange?.({
      paymentMethod,
      perShop: perShopComputed,
      globalVoucherDiscount,
      globalFreeShipping,
      summary,
      shopVouchers,
      globalVoucherCode,
    });
  }, [paymentMethod, perShopComputed, globalVoucherDiscount, globalFreeShipping, summary, onPaymentInfoChange]);

  /* ---------- Fetch cart ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const t = localStorage.getItem('token') || Cookies.get('authToken');
        if (!t) {
          const guest = localStorage.getItem('cart');
          const parsed = guest ? JSON.parse(guest) : [];
          const mapped: CartItem[] = parsed.map((it: any, idx: number) => ({
            id: it.id ?? `guest-${idx}`,
            quantity: it.quantity,
            shop_id: Number(it.shop_id ?? 0),
            shop_name: it.shop_name ?? 'Shop',
            product: {
              id: Number(it.product_id ?? it.id ?? 0),
              name: it.name,
              image: it.image,
              price: Number(it.price ?? 0),
              sale_price: it.sale_price ?? null,
            },
            variant: it.variant ?? null,
          }));
          if (!mounted) return;
          setItems(mapped);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/cart`, { headers: { Authorization: `Bearer ${t}` } });
        const sv: CartItem[] = (res.data || []).map((it: any, idx: number) => ({
          id: it.id ?? `srv-${idx}`,
          quantity: it.quantity,
          shop_id: Number(it.product?.shop_id ?? it.shop_id ?? 0),
          shop_name: it.product?.shop?.name ?? it.shop_name ?? 'Shop',
          product: {
            id: Number(it.product?.id ?? it.product_id ?? 0),
            name: it.product?.name ?? 'Sản phẩm',
            image: Array.isArray(it.product?.image) ? it.product.image : it.product?.image ?? [],
            price: Number(it.product?.price ?? 0),
            sale_price: it.product?.sale_price ?? null,
          },
          variant: it.variant ?? null,
        }));
        if (!mounted) return;
        setItems(sv);
        localStorage.removeItem('cart');
      } catch (e) {
        console.error('Load cart error:', e);
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Voucher: open / fetch / filter / apply / clear ---------- */
  const openVoucherModal = useCallback(
    (shopId: number) => {
      setVoucherModalShopId(shopId);
      setVoucherModalOpen(true);
      const pre = applied.byShop[shopId]?.id ?? null;
      setSelectedVoucherId(pre);

      setVoucherLoading(true);
      setVoucherErr(null);
      axios
        .get(`${API_BASE_URL}/my-vouchers`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        .then((res) => {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : res.data?.data?.vouchers || res.data || [];
          const mapped: Voucher[] = list.map((row: any) => {
            const src = row.voucher ?? row;
            const dt = String(src.discount_type ?? src.type ?? 'amount').toLowerCase();
            return {
              id: src.id ?? src.voucher_id ?? src.code,
              code: String(src.code ?? src.voucher_code ?? src.coupon_code ?? '').trim(),
              title: src.title ?? src.name ?? src.label ?? undefined,
              description: src.description ?? src.desc ?? undefined,
              type: (['percent', 'amount', 'shipping'].includes(dt) ? dt : 'amount') as VoucherType,
              value: Number(src.discount_value ?? src.value ?? src.amount ?? 0),
              min_order: src.min_order_value
                ? Number(src.min_order_value)
                : src.min_order_amount
                  ? Number(src.min_order_amount)
                  : undefined,
              expires_at: src.end_date ?? src.expires_at ?? src.expired_at ?? src.end_at ?? undefined,
              is_active: src.is_active ?? src.active ?? true,
              shop_id: src.shop_id ?? null,
              used: Boolean(src.is_used ?? src.used ?? src.used_at ?? false),
            };
          });
          const dedup = Array.from(new Map(mapped.map((v) => [`${v.code}|${v.shop_id ?? 'all'}`, v])).values());
          setVouchers(dedup);
        })
        .catch(() => setVoucherErr('Không tải được danh sách voucher.'))
        .finally(() => setVoucherLoading(false));
    },
    [token, applied.byShop]
  );

  const closeVoucherModal = useCallback(() => {
    setVoucherModalOpen(false);
    setVoucherSearch('');
    setVoucherModalShopId(null);
  }, []);

  const current = vouchers.find((x) => String(x.id) === String(selectedVoucherId));

  const clearVoucher = useCallback(
    (shopId: number | null) => {
      setApplied((prev) =>
        shopId == null ? { ...prev, global: null } : { ...prev, byShop: { ...prev.byShop, [shopId]: null } }
      );

      if (shopId == null) {
        setServerGlobal({ discount: 0, freeShipping: false });
        onVoucherApplied?.({ voucher: null, serverDiscount: 0, serverFreeShipping: false, code: null });
      } else {
        setServerShop((prev) => {
          const next = { ...prev };
          delete next[shopId];
          return next;
        });
      }

      setPopupMsg('Đã bỏ voucher.');
      setShowPopup(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowPopup(false), 2000);
    },
    [onVoucherApplied]
  );

  // Áp dụng voucher → dùng itemsForCheckout trong payload
  const applyVoucher = useCallback(async () => {
    if (selectedVoucherId == null || voucherModalShopId == null) return;
    const v = vouchers.find((x) => String(x.id) === String(selectedVoucherId));
    if (!v) return;

    try {
      setApplyLoading(true);

      if (!token) {
        message.warning('Bạn cần đăng nhập để áp dụng voucher.');
        return;
      }

      const itemsPayload = itemsForCheckout.map((it) => ({
        shop_id: it.shop_id,
        price: unitPrice(it),
        quantity: it.quantity,
        product_id: it.product.id,
      }));

      const postShopId = v.shop_id == null ? null : voucherModalShopId;

      const res = await axios.post(
        `${API_BASE_URL}/vouchers/apply`,
        { code: v.code, shop_id: postShopId, items: itemsPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res?.data ?? {};
      const ok = data.valid ?? data.success ?? data.ok ?? (typeof data.error === 'undefined');
      if (!ok) {
        message.warning(data.message ?? 'Voucher không hợp lệ.');
        return;
      }

      const serverDiscount = Number(
        data.total_discount ?? data.discount_amount ?? data.amount ?? data.discount ?? 0
      );
      const serverFree = Boolean(
        data.free_shipping ?? data.shipping_free ?? data.is_free_shipping ?? false
      );

      if (v.shop_id == null) {
        setApplied((prev) => ({ ...prev, global: v }));
        setServerGlobal({ discount: serverDiscount, freeShipping: serverFree });
        onVoucherApplied?.({
          voucher: v,
          serverDiscount,
          serverFreeShipping: serverFree,
          code: v.code ?? null,
        });
      } else {
        if (Number(v.shop_id) !== Number(voucherModalShopId)) {
          message.warning('Voucher không thuộc shop này.');
          return;
        }
        setApplied((prev) => ({ ...prev, byShop: { ...prev.byShop, [voucherModalShopId]: v } }));
        setServerShop((prev) => ({
          ...prev,
          [voucherModalShopId!]: { discount: serverDiscount, freeShipping: serverFree },
        }));
      }

      setVoucherModalOpen(false);
      setPopupMsg('Áp dụng voucher thành công!');
      setShowPopup(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowPopup(false), 2000);
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg = e?.response?.data?.message ?? 'Áp dụng voucher thất bại.';
      message.error(msg);

      if (code === 'VOUCHER_ALREADY_USED') {
        setVouchers((prev) =>
          prev.map((x) => (String(x.id) === String(selectedVoucherId) ? { ...x, used: true } : x))
        );
      }
    } finally {
      setApplyLoading(false);
    }
  }, [selectedVoucherId, vouchers, voucherModalShopId, itemsForCheckout, token, unitPrice, onVoucherApplied]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const filteredVouchers = useMemo(() => {
    const s = voucherSearch.trim().toLowerCase();

    const scopeFiltered = vouchers.filter((v) => {
      if (voucherModalShopId == null) return v.shop_id == null;
      return v.shop_id == null || Number(v.shop_id) === Number(voucherModalShopId);
    });

    const searched = !s
      ? scopeFiltered
      : scopeFiltered.filter((v) =>
        [v.code, v.title, v.description].filter(Boolean).some((x) => String(x).toLowerCase().includes(s))
      );

    const score = (v: Voucher) => {
      const isGlobal = v.shop_id == null ? 1 : 0;
      const globalScore = isGlobal ? 5_000_000 : 0;

      const activeScore = v.is_active !== false && !isExpired(v) ? 1_000_000 : 0;
      const usedPenalty = v.used ? -2_000_000 : 0;
      const freeShipScore = v.type === 'shipping' ? 500_000 : 0;
      const percentScore = v.type === 'percent' ? Math.min(100, v.value) * 1_000 : 0;
      const amountScore = v.type === 'amount' ? Math.min(10_000_000, v.value) : 0;
      const expiryScore = v.expires_at ? (10_000_000_000 - new Date(v.expires_at).getTime()) / 1_000_000 : 0;

      return globalScore + activeScore + usedPenalty + freeShipScore + percentScore + amountScore + expiryScore;
    };

    return searched.slice().sort((a, b) => score(b) - score(a));
  }, [vouchers, voucherSearch, voucherModalShopId, isExpired]);

  /* ---------- util tính tiền shop ---------- */
  const calcShopMoney = useCallback(
    (shopId: number) =>
      perShopComputed.find((x) => Number(x.shop_id) === Number(shopId)) ?? {
        shop_id: shopId,
        subTotal: 0,
        voucherDiscount: 0,
        shipping: 0,
        lineTotal: 0,
        shop_name: '',
      },
    [perShopComputed]
  );

  /* ===================== UI ===================== */
  return (
    <div className="space-y-4">
      {ctxMsg}

      {/* toast trượt góc phải */}
      {showPopup && (
        <div
          className="fixed top-[140px] right-5 z-[9999] text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade"
          style={{ backgroundColor: '#dcfce7', color: '#166534', borderBottomColor: '#22c55e' }}
        >
          {popupMsg}
        </div>
      )}

      {/* Header */}
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0, color: '#222', display: 'flex', alignItems: 'center' }}>
          <ShoppingCartOutlined style={{ marginRight: 8, color: '#db4444', fontSize: 20 }} />
          Giỏ hàng
        </Title>
      </Space>

      {/* Phương thức thanh toán */}
      <Card
        title={<Text strong style={{ color: 'black' }}>Phương thức thanh toán</Text>}
        variant="outlined"
      >
        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <Space direction="vertical">
            <Radio value="cod">Thanh toán khi nhận hàng (COD)</Radio>
            <Radio value="vnpay">
              <Space>
                <Image src="/vnpay-logo.png" alt="VNPAY" width={24} height={24} />
                VNPAY
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* Danh sách theo shop (ĐÃ LỌC THEO selectedCartIds) */}
      <Card
        title={<Text strong style={{ color: 'black' }}>Sản phẩm trong giỏ hàng</Text>}
        variant="outlined"
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : grouped.length === 0 ? (
          <Alert type="info" message="Không có sản phẩm được chọn." />
        ) : (
          <Collapse
            accordion
            activeKey={activeShopId}
            onChange={(k) => setActiveShopId(Array.isArray(k) ? String(k[0]) : String(k))}
            style={{ background: 'transparent' }}
          >
            {grouped.map((g) => {
              const shopVoucher = applied.byShop[g.shop_id] ?? null;
              const money = calcShopMoney(g.shop_id);
              const firstTwo = g.items.slice(0, COLLAPSE_COUNT);
              const hiddenCount = Math.max(0, g.items.length - COLLAPSE_COUNT);

              return (
                <Panel
                  key={String(g.shop_id)}
                  header={
                    <div style={{ display: 'flex,', alignItems: 'center', gap: 12, width: '100%' }}>
                      <Text strong style={{ color: 'black' }}>
                        Shop:{' '}
                        <span
                          style={{
                            display: 'inline-block',
                            maxWidth: 180,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            verticalAlign: 'bottom',
                          }}
                          title={g.shop_name ?? `#${g.shop_id}`}
                        >
                          {g.shop_name ?? `#${g.shop_id}`}
                        </span>
                      </Text>

                      <div
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          gap: 12,
                          fontSize: 12,
                          color: '#666',
                        }}
                      >
                        <span>
                          Tạm tính: <Text strong>{VND(money.subTotal)}</Text>
                        </span>
                        {!!money.voucherDiscount && (
                          <span>
                            Giảm: <Text type="danger">-{VND(money.voucherDiscount)}</Text>
                          </span>
                        )}
                        <span>Phí VC: {VND(money.shipping)}</span>
                      </div>
                    </div>
                  }
                >
                  {/* Sản phẩm (tối đa 2) */}
                  <List<CartItem>
                    itemLayout="horizontal"
                    dataSource={firstTwo}
                    rowKey={(it) => String(it.id)}
                    renderItem={(it) => {
                      const u = unitPrice(it);
                      const total = u * it.quantity;
                      const ori = it.product.price * it.quantity;
                      const hasSale = u < it.product.price;

                      return (
                        <List.Item style={{ padding: '6px 0' }}>
                          <List.Item.Meta
                            avatar={
                              <img
                                src={imageUrl(it.product.image)}
                                alt={it.product.name}
                                style={{
                                  width: 44,
                                  height: 44,
                                  objectFit: 'contain',
                                  borderRadius: 8,
                                  border: '1px solid #f0f0f0',
                                }}
                              />
                            }
                            title={
                              <OneLine>
                                <strong>{it.product.name}</strong>
                              </OneLine>
                            }
                            description={<Text type="secondary">SL: {it.quantity}</Text>}
                          />
                          <div style={{ textAlign: 'right', minWidth: 120 }}>
                            {hasSale ? (
                              <>
                                <div>
                                  <Text delete type="secondary">{VND(ori)}</Text>
                                </div>
                                <div>
                                  <Text strong type="danger">{VND(total)}</Text>
                                </div>
                              </>
                            ) : (
                              <Text strong>{VND(total)}</Text>
                            )}
                          </div>
                        </List.Item>
                      );
                    }}
                  />

                  {/* Nếu còn sp ẩn → nút xem modal */}
                  {hiddenCount > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                      <Button
                        type="link"
                        onClick={() => {
                          setItemsModalShop(g);
                          setItemsModalOpen(true);
                        }}
                      >
                        Xem tất cả {g.items.length} sản phẩm
                      </Button>
                    </div>
                  )}

                  <Divider style={{ margin: '10px 0' }} />

                  {/* Voucher pills */}
                  <div
                    style={{
                      marginTop: 6,
                      marginBottom: 8,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {applied.global && (
                      <div className="voucher-pill" title={`Voucher sàn: ${applied.global.code} • ${badge(applied.global)}`}>
                        <span className="voucher-label">Voucher sàn:</span>
                        <span className="voucher-code">{applied.global.code}</span>
                        <span className="voucher-dot">•</span>
                        <span className="voucher-benefit">{badge(applied.global)}</span>
                        <button
                          type="button"
                          className="voucher-close"
                          aria-label="Bỏ voucher sàn"
                          onClick={(e) => { e.preventDefault(); clearVoucher(null); }}
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {shopVoucher && (
                      <div className="voucher-pill" title={`Voucher shop: ${shopVoucher.code} • ${badge(shopVoucher)}`}>
                        <span className="voucher-label">Voucher shop:</span>
                        <span className="voucher-code">{shopVoucher.code}</span>
                        <span className="voucher-dot">•</span>
                        <span className="voucher-benefit">{badge(shopVoucher)}</span>
                        <button
                          type="button"
                          className="voucher-close"
                          aria-label="Bỏ voucher shop"
                          onClick={(e) => { e.preventDefault(); clearVoucher(g.shop_id); }}
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <Button size="small" onClick={() => openVoucherModal(g.shop_id)}>
                      Voucher
                    </Button>
                  </div>

                  {/* Tóm tắt per shop */}
                  <div style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tạm tính</span>
                      <strong>{VND(money.subTotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Giảm voucher shop</span>
                      <span style={{ color: '#d0302f' }}>-{VND(money.voucherDiscount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phí vận chuyển</span>
                      <span>{VND(money.shipping)}</span>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        )}
      </Card>

      {/* Modal xem toàn bộ sản phẩm của 1 shop */}
      <Modal
        open={itemsModalOpen}
        onCancel={() => setItemsModalOpen(false)}
        title={itemsModalShop ? `Sản phẩm - ${itemsModalShop.shop_name ?? `#${itemsModalShop.shop_id}`}` : 'Sản phẩm'}
        footer={<Button onClick={() => setItemsModalOpen(false)}>Đóng</Button>}
        width={760}
        style={{ maxHeight: 460, overflowY: 'auto' }}
      >
        {itemsModalShop && (
          <List<CartItem>
            itemLayout="horizontal"
            dataSource={itemsModalShop.items}
            rowKey={(it) => String(it.id)}
            renderItem={(it) => {
              const u = unitPrice(it);
              const total = u * it.quantity;
              const ori = it.product.price * it.quantity;
              const hasSale = u < it.product.price;
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <img
                        src={imageUrl(it.product.image)}
                        alt={it.product.name}
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: 'contain',
                          borderRadius: 8,
                          border: '1px solid #f0f0f0',
                        }}
                      />
                    }
                    title={
                      <OneLine>
                        <strong>{it.product.name}</strong>
                      </OneLine>
                    }
                    description={<Text type="secondary">SL: {it.quantity}</Text>}
                  />
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    {hasSale ? (
                      <>
                        <div><Text delete type="secondary">{VND(ori)}</Text></div>
                        <div><Text strong type="danger">{VND(total)}</Text></div>
                      </>
                    ) : (
                      <Text strong>{VND(total)}</Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Modal>

      {/* Modal chọn voucher */}
      <Modal
        open={voucherModalOpen}
        onCancel={closeVoucherModal}
        title="Chọn voucher"
        footer={
          <Space>
            <Button onClick={closeVoucherModal}>Hủy</Button>
            <Button
              type="primary"
              style={{ background: BRAND, borderColor: BRAND }}
              disabled={selectedVoucherId == null || current?.used}
              loading={applyLoading}
              onClick={applyVoucher}
            >
              Áp dụng
            </Button>
          </Space>
        }
        width={720}
      >
        <Input
          placeholder="Tìm theo mã, tên, mô tả..."
          value={voucherSearch}
          onChange={(e) => setVoucherSearch(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />

        {voucherLoading && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin />
          </div>
        )}
        {voucherErr && <Alert type="error" showIcon message={voucherErr} />}

        {!voucherLoading && !voucherErr && (
          <>
            {filteredVouchers.length === 0 ? (
              <Alert type="info" showIcon message="Không có voucher phù hợp." />
            ) : (
              <div style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 6 }}>
                <List<Voucher>
                  dataSource={filteredVouchers}
                  rowKey={(v) => String(v.id)}
                  renderItem={(v) => {
                    const selected = String(selectedVoucherId ?? '') === String(v.id);
                    const expired = isExpired(v);
                    const disabled = !!expired || v.is_active === false;
                    const used = !!v.used;

                    return (
                      <List.Item
                        onClick={() => { if (!disabled) setSelectedVoucherId(selected ? null : v.id); }}
                        style={{
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          background: selected ? '#f5faff' : undefined,
                          opacity: disabled ? 0.6 : 1,
                          borderRadius: 10,
                          padding: 12,
                          marginBottom: 10,
                          border: selected ? '1px solid #91caff' : '1px solid #f0f0f0',
                        }}
                      >
                        <Space align="start" style={{ width: '100%', alignItems: 'center' }}>
                          <Radio checked={selected} disabled={disabled} />
                          <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 0 }}>
                            <Space wrap>
                              <Tag bordered={false}><OneLine>{v.code}</OneLine></Tag>
                              <Tag color={v.shop_id == null ? 'blue' : 'purple'}>
                                {v.shop_id == null ? 'Toàn sàn' : `Shop #${v.shop_id}`}
                              </Tag>
                              <Tag bordered={false}>{badge(v)}</Tag>
                              {used && <Tag color="default">Đã dùng</Tag>}
                              {expired && <Tag color="red">Hết hạn</Tag>}
                            </Space>
                            {v.title && (<OneLine><Text strong>{v.title}</Text></OneLine>)}
                            {v.description && (<Text type="secondary"><OneLine>{v.description}</OneLine></Text>)}
                            <Space size="small" wrap>
                              {typeof v.min_order === 'number' && (
                                <Text type="secondary">ĐH tối thiểu: {new Intl.NumberFormat('vi-VN').format(v.min_order)}₫</Text>
                              )}
                              {v.expires_at && (
                                <Text type={expired ? 'danger' : 'secondary'}>
                                  HSD: {new Date(v.expires_at).toLocaleDateString('vi-VN')}
                                </Text>
                              )}
                            </Space>
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

      {/* animation + style */}
      <style jsx global>{`
        @keyframes slideInFade {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slideInFade { animation: slideInFade 260ms ease-out; }

        .voucher-pill {
          display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
          padding: 6px 8px; border: 1px solid #e8ddff; background: #f6f0ff; color: #5b21b6;
          border-radius: 8px; line-height: 1;
        }
        .voucher-label { font-weight: 600; white-space: nowrap; }
        .voucher-code, .voucher-benefit {
          max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .voucher-dot { opacity: 0.7; }
        .voucher-close {
          margin-left: 2px; border: 0; background: transparent; cursor: pointer;
          font-size: 16px; line-height: 1; color: #7c3aed; padding: 0 2px; border-radius: 6px;
        }
        .voucher-close:hover { background: rgba(124, 58, 237, 0.08); }
      `}</style>
    </div>
  );
};

export default CartByShop;
