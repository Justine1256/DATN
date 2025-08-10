'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
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

// Voucher types
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
    promotionDiscount: number; // includes sale/variant discount + voucher discount
    shipping: number; // after voucher
    total: number;
  }) => void;
  onCartChange: (items: CartItem[]) => void;
}

export default function CartAndPayment({ onPaymentInfoChange, onCartChange }: Props) {
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
  const router = useRouter();                 // ⬅️ thêm
  const [requireLogin, setRequireLogin] = useState(false); // ⬅️ thêm
 
  const token = useMemo(() => (typeof window !== 'undefined' ? (localStorage.getItem('token') || Cookies.get('authToken') || '') : ''), []);
  const isVoucherExpired = (v: Voucher) => {
    if (!v?.expires_at) return false;
    const t = new Date(v.expires_at).getTime();
    return Number.isFinite(t) && t < Date.now();
  };

  const badgeValue = (v: Voucher) => {
    if (!v) return '';
    if (v.type === 'percent') return `${v.value}%`;
    if (v.type === 'shipping') return 'Miễn phí vận chuyển';
    return new Intl.NumberFormat('vi-VN').format(v.value) + '₫';
  };

  const getPriceToUse = (item: CartItem) => {
    return (
      item.variant?.sale_price ??
      item.variant?.price ??
      item.product.sale_price ??
      item.product.price ??
      0
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountedSubtotal = cartItems.reduce((sum, item) => sum + getPriceToUse(item) * item.quantity, 0);
  const baseDiscount = Math.max(0, subtotal - discountedSubtotal);

  const shippingBase = cartItems.length > 0 ? 20000 : 0;

  // Voucher calculations
  const meetsMinOrder = (v: Voucher | null) => {
    if (!v?.min_order) return true;
    return discountedSubtotal >= v.min_order;
  };

  const voucherDiscount = (() => {
    if (!appliedVoucher || !meetsMinOrder(appliedVoucher)) return 0;
    const type = (appliedVoucher.type || 'amount').toLowerCase();
    const val = Number(appliedVoucher.value || 0);
    if (type === 'percent') {
      return Math.max(0, Math.floor((discountedSubtotal * val) / 100));
    }
    if (type === 'amount') {
      return Math.min(discountedSubtotal, Math.max(0, Math.floor(val)));
    }
    // shipping voucher handled below, discount on items = 0
    return 0;
  })();

  const shippingAfterVoucher = (() => {
    if (!appliedVoucher || !meetsMinOrder(appliedVoucher)) return shippingBase;
    const type = (appliedVoucher.type || '').toLowerCase();
    if (type === 'shipping') {
      // free shipping (full)
      return 0;
    }
    return shippingBase;
  })();

  const promotionDiscount = baseDiscount + voucherDiscount;
  const total = Math.max(0, discountedSubtotal - voucherDiscount + shippingAfterVoucher);

  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || !img.trim()) {
      return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith('http')) return img;
    return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
  };

  // ===== Fetch cart =====
  useEffect(() => {
    const t = localStorage.getItem('token') || Cookies.get('authToken');

    const fetchCart = async () => {
      try {
        if (!t) {
          const guestCart = localStorage.getItem('cart');
          const parsed = guestCart ? JSON.parse(guestCart) : [];
          const formatted = parsed.map((item: any, index: number) => ({
            id: `guest-${index}`,
            quantity: item.quantity,
            product: {
              name: item.name,
              image: [item.image],
              price: item.price,
              sale_price: item.sale_price ?? null,
            },
            variant: item.variant ?? null,
          }));
          setCartItems(formatted);
          onCartChange(formatted);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/cart`, {
          headers: { Authorization: `Bearer ${t}` },
        });

        const serverCart = (res.data || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.product?.name || 'Sản phẩm',
            image: Array.isArray(item.product?.image) ? item.product.image : [item.product?.image],
            price: item.product?.price || 0,
            sale_price: item.product?.sale_price ?? null,
          },
          variant: item.variant ?? null,
        }));

        setCartItems(serverCart);
        onCartChange(serverCart);
        localStorage.removeItem('cart');
      } catch (err) {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        setCartItems([]);
        onCartChange([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [onCartChange]);

  // ===== Payment info callback =====
  useEffect(() => {
    onPaymentInfoChange({
      paymentMethod,
      subtotal,
      promotionDiscount,
      shipping: shippingAfterVoucher,
      total,
    });
  }, [paymentMethod, subtotal, promotionDiscount, shippingAfterVoucher, total, onPaymentInfoChange]);

  // ===== Voucher modal handlers =====
  const openVoucherModal = () => {
    const isLoggedIn = !!token; 
    // ⬇️ Nếu chưa đăng nhập: chỉ mở modal thông báo, không load API
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

          const mapped: Voucher[] = listRaw.map((v: any) => ({
            id: v.id ?? v.voucher_id ?? v.code,
            code: String(v.code ?? v.voucher_code ?? v.coupon_code ?? '').trim(),
            title: v.title ?? v.name ?? v.label ?? undefined,
            description: v.description ?? v.desc ?? undefined,
            type: (v.type ?? v.voucher_type ?? 'amount') as VoucherType,
            value: Number(v.value ?? v.discount_value ?? v.amount ?? 0),
            min_order: v.min_order
              ? Number(v.min_order)
              : v.min_order_amount
                ? Number(v.min_order_amount)
                : undefined,
            expires_at:
              v.expires_at ?? v.expired_at ?? v.end_at ?? v.expired_time ?? undefined,
            is_active: v.is_active ?? v.active ?? true,
          }));

          setVouchers(mapped);
        })
        .catch(() => setVoucherError('Không tải được danh sách voucher.'))
        .finally(() => setVoucherLoading(false));
    }
  };



  const closeVoucherModal = () => {
    setShowVoucherModal(false);
    setVoucherSearch('');
    setSelectedVoucherId(appliedVoucher?.id ?? null);
  };

  const applyVoucher = () => {
    const v = vouchers.find((x) => String(x.id) === String(selectedVoucherId)) || null;
    setAppliedVoucher(v);
    setShowVoucherModal(false);
  };

  const clearVoucher = () => {
    setAppliedVoucher(null);
    setSelectedVoucherId(null);
  };

  const filteredVouchers = (() => {
    if (!voucherSearch.trim()) return vouchers;
    const q = voucherSearch.toLowerCase();
    return vouchers.filter((v) => [v.code, v.title, v.description].filter(Boolean).some((s) => String(s).toLowerCase().includes(q)));
  })();

  const VND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n))) + 'đ';

  return (
    <div className="space-y-4">
      {/* Header with voucher chip & button */}
      {/* Header + nút chọn voucher */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Giỏ hàng</h3>

        <button
          type="button"
          onClick={openVoucherModal}
          className="px-3 py-2 rounded-lg bg-brand text-white hover:opacity-90 shadow-sm"
        >
          Chọn voucher
        </button>
      </div>

      {/* Thẻ hiển thị voucher đã chọn (dựa theo JSON, có gì show nấy) */}
      {appliedVoucher && (
        <div className="mt-3 border rounded-xl p-3 bg-green-50/40 border-green-200 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Voucher đã chọn:</span>
            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 border font-mono">
              {(appliedVoucher.code && appliedVoucher.code.trim()) || `#${appliedVoucher.id}`}
            </span>
            {appliedVoucher.type && (
              <span className="px-2 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700 border">
                {appliedVoucher.type}
              </span>
            )}
            <span className="px-2 py-0.5 text-xs rounded bg-white border">
              {badgeValue(appliedVoucher)}
            </span>
            <button
              type="button"
              onClick={clearVoucher}
              className="ml-auto text-xs underline hover:opacity-80"
            >
              Bỏ voucher
            </button>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {appliedVoucher.title && (
              <div><span className="text-gray-600">Tiêu đề:</span> {appliedVoucher.title}</div>
            )}
            {appliedVoucher.description && (
              <div><span className="text-gray-600">Mô tả:</span> {appliedVoucher.description}</div>
            )}
            {typeof appliedVoucher.min_order === 'number' && (
              <div><span className="text-gray-600">ĐH tối thiểu:</span> {new Intl.NumberFormat('vi-VN').format(appliedVoucher.min_order)}₫</div>
            )}
            {appliedVoucher.expires_at && (
              <div className={isVoucherExpired(appliedVoucher) ? 'text-red-600' : ''}>
                <span className="text-gray-600">HSD:</span> {new Date(appliedVoucher.expires_at).toLocaleDateString('vi-VN')}
              </div>
            )}
            {typeof appliedVoucher.is_active === 'boolean' && (
              <div><span className="text-gray-600">Trạng thái:</span> {appliedVoucher.is_active ? 'Đang hoạt động' : 'Ngừng'}</div>
            )}
          </div>
        </div>
      )}


      <div className="grid grid-cols-4 text-sm font-semibold px-4 py-3 bg-white shadow">
        <div className="col-span-2">Sản phẩm</div>
        <div className="text-center">Số lượng</div>
        <div className="text-right">Thành tiền</div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm">Đang tải...</p>
      ) : cartItems.length === 0 ? (
        <p className="text-center text-sm">Giỏ hàng của bạn đang trống.</p>
      ) : (
        cartItems.map((item) => {
          const { product, quantity } = item;
          const price = getPriceToUse(item);
          const originalTotal = product.price * quantity;
          const finalTotal = price * quantity;
          const hasDiscount = price < product.price;

          return (
            <div key={`cart-item-${item.id}`} className="grid grid-cols-4 items-center px-4 py-3 bg-white shadow">
              <div className="col-span-2 flex items-center gap-4">
                <Image src={formatImageUrl(product.image)} alt={product.name || 'Product Image'} width={50} height={50} />
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
              </div>

              <div className="text-center text-sm">{quantity}</div>

              <div className="text-right text-sm">
                {hasDiscount ? (
                  <div>
                    <p className="line-through text-gray-400 text-xs">{VND(originalTotal)}</p>
                    <p className="font-semibold text-red-600">{VND(finalTotal)}</p>
                  </div>
                ) : (
                  <p className="font-semibold">{VND(finalTotal)}</p>
                )}
              </div>
            </div>
          );
        })
      )}


      {/* Payment methods */}
      <div className="pt-2 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-brand" />
          <span>Thanh toán khi nhận hàng</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-4 h-4 accent-brand" />
          <Image src="/vnpay-logo.png" alt="VNPAY" width={70} height={30} />
        </label>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeVoucherModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chọn voucher của bạn</h3>
                <button type="button" onClick={closeVoucherModal} className="px-3 py-1 rounded-lg hover:bg-gray-100">Đóng</button>
              </div>

              <div className="p-4 space-y-3">
                {requireLogin ? (
                  // ⬇️ Trạng thái chưa đăng nhập
                  <div className="text-center py-8">
                    <p className="text-base font-semibold mb-2">Bạn cần đăng nhập để sử dụng voucher</p>
                    <p className="text-sm text-gray-600 mb-4">Vui lòng đăng nhập để xem và áp dụng voucher của bạn.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={closeVoucherModal}
                        className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                   onClick={() => (window.location.href = '/login')}

                        className="px-4 py-2 rounded-xl bg-brand text-white"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  </div>
                ) : (
                  // ⬇️ Trạng thái đã đăng nhập: giữ nguyên phần tìm kiếm + list
                  <>
                    <div className="flex gap-3 items-center">
                      <input
                        value={voucherSearch}
                        onChange={(e) => setVoucherSearch(e.target.value)}
                        placeholder="Tìm theo mã, tên, mô tả..."
                        className="flex-1 border rounded-lg px-3 py-2 outline-none"
                      />
                      {appliedVoucher ? (
                        <button onClick={clearVoucher} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                          Bỏ voucher
                        </button>
                      ) : null}
                    </div>

                    {voucherLoading && <p className="text-gray-500">Đang tải voucher...</p>}
                    {voucherError && <p className="text-red-600">{voucherError}</p>}
                    {!voucherLoading && !voucherError && filteredVouchers.length === 0 && (
                      <p className="text-gray-500">Không có voucher phù hợp.</p>
                    )}

                    {/* ⬇️ Giữ nguyên list bạn đang có */}
                    <ul className="max-h-80 overflow-auto divide-y rounded-lg border">
                      {filteredVouchers.map((v) => {
                        const selected = String(selectedVoucherId ?? appliedVoucher?.id) === String(v.id);
                        const expired = isVoucherExpired(v);
                        const disabled = !!expired || (typeof v.is_active === 'boolean' && !v.is_active);

                        return (
                          <li
                            key={String(v.id)}
                            onClick={() => {
                              if (!disabled) setSelectedVoucherId(selected ? null : v.id);
                            }}
                            className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''
                              } ${disabled ? 'opacity-60' : ''}`}
                          >
                            <input type="radio" name="voucher" className="mt-1" checked={selected} readOnly disabled={disabled} />
                            <div className="flex-1">
                              {/* ... giữ nguyên phần nội dung voucher ... */}
                              {/* title, code, type, badgeValue, min_order, expires_at, description */}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>


              <div className="p-4 border-t flex items-center justify-end gap-3">
                <button type="button" onClick={closeVoucherModal} className="px-4 py-2 rounded-xl border hover:bg-gray-50">
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={requireLogin || selectedVoucherId === null}
                  onClick={applyVoucher}
                  className="px-4 py-2 rounded-xl bg-brand text-white disabled:opacity-50"
                >
                  Áp dụng
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
