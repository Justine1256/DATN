'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useRef, useState, useMemo } from 'react';
import { API_BASE_URL } from '@/utils/api';

export interface CartItem {
  id: number | string;
  quantity: number;
  product: {
    id: number;
    name: string;
    image: string | string[];
    price: number;
    sale_price?: number | null;
    original_price?: number;
  };
  variant?: {
    id: number;
    price?: number;
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

interface OrderRequestBody {
  payment_method: string;
  voucher_code: string | null;
  address_id?: number;
  address_manual?: {
    full_name: string;
    address: string;
    city: string;   // "Ward, District, Province"
    phone: string;
    email: string;
  };
}

interface Totals {
  subtotal: number;
  promotionDiscount: number;
  voucherDiscount: number;
  shipping: number;
  finalTotal: number;
}

interface Props {
  cartItems: CartItem[];
  paymentMethod: string;
  addressId: number | null;

  appliedVoucher?: Voucher | null;
  voucherCode?: string | null;

  serverDiscount?: number | null;
  serverFreeShipping?: boolean;

  manualAddressData?: {
    full_name: string;
    address: string;
    apartment?: string;
    city: string;   // "Ward, District, Province"
    phone: string;
    email: string;
  };

  totals?: Totals;

  setCartItems: (items: CartItem[]) => void;
  saveAddress?: boolean; // ✅ tick “Lưu địa chỉ”
}

export default function OrderSummary({
  cartItems,
  paymentMethod,
  addressId,
  appliedVoucher = null,
  voucherCode = null,
  manualAddressData,
  setCartItems,
  serverDiscount = null,
  serverFreeShipping = false,
  totals,
  saveAddress = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // 🔒 Chống lưu 2 lần
  const saveOnceRef = useRef(false);

  const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const getPriceToUse = (item: CartItem) =>
    num(item.variant?.sale_price ?? item.variant?.price ?? item.product.sale_price ?? item.product.price);
  const getOriginalPrice = (item: CartItem) =>
    num(item.variant?.price ?? item.product.price);

  const {
    subtotal: localSubtotal,
    promotionDiscount: localPromo,
    voucherDiscount: localVoucherDiscount,
    shipping: localShipping,
  } = useMemo(() => {
    const subtotal = cartItems.reduce((s, it) => s + getOriginalPrice(it) * it.quantity, 0);
    const discountedSubtotal = cartItems.reduce((s, it) => s + getPriceToUse(it) * it.quantity, 0);
    const promotionDiscount = Math.max(0, subtotal - discountedSubtotal);
    const shippingBase = cartItems.length > 0 ? 20000 : 0;
    const voucherDiscount =
      typeof serverDiscount === 'number' ? Math.max(0, Math.floor(serverDiscount)) : 0;
    const shipping = serverFreeShipping ? 0 : shippingBase;
    return { subtotal, promotionDiscount, voucherDiscount, shipping };
  }, [cartItems, serverDiscount, serverFreeShipping]);

  const subtotal = localSubtotal;
  const promotionDiscount = localPromo;
  const voucherDiscount = totals?.voucherDiscount ?? localVoucherDiscount;
  const shipping = totals?.shipping ?? localShipping;
  const finalTotal = Math.max(0, (subtotal - promotionDiscount) - voucherDiscount + shipping);

  /** ===== Lưu địa chỉ (đăng nhập + nhập tay + tick + không chọn addressId) ===== */
  const trySaveManualAddress = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token || !manualAddressData) return;

    const parts = (manualAddressData.city || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const ward = parts[0] || '';
    const district = parts[1] || '';
    const province = parts[2] || parts[1] || '';
    const city = province;

    const ok =
      manualAddressData.full_name &&
      manualAddressData.phone &&
      manualAddressData.address &&
      ward && district && province;

    if (!ok) return;

    const me = await axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user_id = me.data?.id;

    const payload = {
      full_name: manualAddressData.full_name,
      phone: manualAddressData.phone,
      address: manualAddressData.address,
      ward,
      district,          // ✅ gửi district
      province,
      city,
      note: '',
      is_default: false,
      type: 'Nhà Riêng',
      user_id,
    };

    await axios.post(`${API_BASE_URL}/addresses`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  };

  // ✅ Chỉ cho phép lưu 1 lần / phiên đặt hàng
  const maybeSaveManualAddress = async () => {
    if (saveOnceRef.current) return;
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const isGuest = !token;
    if (isGuest) return;
    if (!saveAddress) return;
    if (!!addressId) return;            // đang dùng địa chỉ đã lưu
    if (!manualAddressData) return;

    await trySaveManualAddress();
    saveOnceRef.current = true;
  };

  /* ============== Đặt hàng ============== */
  const handlePlaceOrder = async () => {
    if (!addressId && !manualAddressData) {
      setError('Vui lòng chọn hoặc nhập địa chỉ giao hàng.');
      setPopupType('error');
      setShowPopup(true);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setShowPopup(false);
    setPopupType(null);

    try {
      const token = localStorage.getItem('token') || Cookies.get('authToken');
      const isGuest = !token;

      let cartPayload: any[];
      if (isGuest) {
        cartPayload = JSON.parse(localStorage.getItem('cart') || '[]');
        if (!cartPayload.length) throw new Error('Giỏ hàng trống.');
      } else {
        cartPayload = cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          sale_price: item.product.sale_price ?? null,
          variant_id: item.variant?.id ?? null,
        }));
      }

      if (isGuest) {
        const guestPayload = {
          payment_method: paymentMethod,
          address_manual: {
            full_name: manualAddressData?.full_name || '',
            address: `${manualAddressData?.address ?? ''}${manualAddressData?.apartment ? ', ' + manualAddressData.apartment : ''}`,
            city: manualAddressData?.city || '',
            phone: manualAddressData?.phone || '',
            email: manualAddressData?.email || '',
          },
          cart_items: cartPayload,
          voucher_code: null,
        };
        await axios.post(`${API_BASE_URL}/nologin`, guestPayload);
      } else {
        const requestBody: OrderRequestBody = {
          payment_method: paymentMethod,
          voucher_code: appliedVoucher?.code || voucherCode || null,
        };

        if (
          manualAddressData &&
          Object.values(manualAddressData).some((v) => (v ?? '').toString().trim() !== '')
        ) {
          requestBody.address_manual = {
            full_name: manualAddressData.full_name,
            address: `${manualAddressData.address}${manualAddressData.apartment ? ', ' + manualAddressData.apartment : ''}`,
            city: manualAddressData.city,
            phone: manualAddressData.phone,
            email: manualAddressData.email,
          };
        } else if (addressId) {
          requestBody.address_id = addressId;
        }

        const response = await axios.post(`${API_BASE_URL}/dathang`, requestBody, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ⛔️ GỌI LƯU ĐỊA CHỈ CHỈ 1 LẦN Ở ĐÂY
        await maybeSaveManualAddress();

        if (response.data?.redirect_url) {
          localStorage.removeItem('cart');
          setCartItems([]);
          window.dispatchEvent(new Event('cartUpdated'));
          window.location.href = response.data.redirect_url;
          return;
        }
      }

      setSuccessMessage('Đặt hàng thành công!');
      setPopupType('success');
      setShowPopup(true);

      localStorage.removeItem('cart');
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdated'));

      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi đặt hàng';
      setError(msg);
      setPopupType('error');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showPopup) {
      const t = setTimeout(() => {
        setShowPopup(false);
        setPopupType(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

  return (
    <div className="space-y-6 text-sm relative">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tóm tắt đơn hàng</h3>

        <div className="border-t border-gray-300 pt-4 space-y-1">
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span>Tạm tính (giá gốc):</span>
            <span>{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Khuyến mãi:</span>
            <span className="text-green-700">-{promotionDiscount.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Voucher:</span>
            <span className="text-green-700">-{(voucherDiscount || 0).toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Phí vận chuyển:</span>
            <span>{(shipping || 0).toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="flex justify-between font-semibold text-lg text-brand pt-3">
            <span>Tổng thanh toán:</span>
            <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="bg-brand hover:bg-red-600 text-white w-[186px] h-[56px] rounded text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center pointer-events-none">
          <div
            ref={popupRef}
            className="bg-white rounded-lg p-6 w-80 flex flex-col items-center relative animate-scaleIn shadow-lg border pointer-events-auto"
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mb-4 ${popupType === 'success' ? 'text-green-600' : 'text-red-600'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={popupType === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
            </svg>

            <p className={`text-base font-semibold text-center ${popupType === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {popupType === 'success' ? successMessage : error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
