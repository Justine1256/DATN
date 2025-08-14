'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';        // 👈 thêm
import { API_BASE_URL } from '@/utils/api';

/* ============== Types ============== */
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
    city: string;
    phone: string;
    email: string;
  };
}

/** ✅ Tổng tiền có thể truyền sẵn từ component cha */
interface Totals {
  subtotal: number;            // tổng theo giá gốc
  promotionDiscount: number;   // giảm giá từ sale/sale_price
  voucherDiscount: number;     // tổng giảm từ các voucher
  shipping: number;            // tổng phí vận chuyển (sau khi áp dụng free ship nếu có)
  finalTotal: number;          // tổng thanh toán cuối cùng
}

/* ============== Props ============== */
interface Props {
  cartItems: CartItem[];
  paymentMethod: string;
  addressId: number | null;

  /** Voucher (nếu muốn hiển thị mã) */
  appliedVoucher?: Voucher | null;
  voucherCode?: string | null;

  /** Kết quả apply voucher từ BE (fallback khi không truyền totals) */
  serverDiscount?: number | null;      // discount_amount
  serverFreeShipping?: boolean;        // is_free_shipping

  /** Nếu người dùng nhập tay địa chỉ */
  manualAddressData?: {
    full_name: string;
    address: string;
    apartment?: string;
    city: string;
    phone: string;
    email: string;
  };

  /** Nhận tổng tiền từ component khác (ưu tiên dùng) */
  totals?: Totals;

  setCartItems: (items: CartItem[]) => void;
}

/* ============== Component ============== */
export default function OrderSummary({
  cartItems,
  paymentMethod,
  addressId,
  appliedVoucher = null,
  voucherCode = null,
  manualAddressData,
  setCartItems,

  // Fallback khi không truyền totals
  serverDiscount = null,
  serverFreeShipping = false,

  // ✅ Ưu tiên dùng totals truyền từ cha
  totals,
}: Props) {
  const router = useRouter();                           // 👈 thêm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  /** ======= TÍNH TIỀN GIỐNG CART (độc lập voucher) ======= */
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
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
    // Tổng theo giá gốc
    const subtotal = cartItems.reduce((s, it) => s + getOriginalPrice(it) * it.quantity, 0);

    // Tổng theo giá đang áp dụng (đã giảm)
    const discountedSubtotal = cartItems.reduce((s, it) => s + getPriceToUse(it) * it.quantity, 0);

    // Khuyến mãi (giảm theo SP)
    const promotionDiscount = Math.max(0, subtotal - discountedSubtotal);

    // Ship: nếu chưa cần theo shop thì để 20k cố định như bạn đang dùng
    const shippingBase = cartItems.length > 0 ? 20000 : 0;

    // Voucher (fallback từ serverDiscount nếu có)
    const voucherDiscount =
      typeof serverDiscount === 'number' ? Math.max(0, Math.floor(serverDiscount)) : 0;

    const shipping = serverFreeShipping ? 0 : shippingBase;

    return { subtotal, promotionDiscount, voucherDiscount, shipping };
  }, [cartItems, serverDiscount, serverFreeShipping]);

  /** ======= Chọn giá trị hiển thị ======= */
  // Luôn dùng local cho 2 số này để không lệch Cart
  const subtotal = /* totals?.subtotal ?? */ localSubtotal;
  const promotionDiscount = /* totals?.promotionDiscount ?? */ localPromo;

  // 2 số dưới vẫn cho phép nhận từ cha (nếu có), không thì dùng local
  const voucherDiscount = totals?.voucherDiscount ?? localVoucherDiscount;
  const shipping = totals?.shipping ?? localShipping;

  const finalTotal = Math.max(0, (subtotal - promotionDiscount) - voucherDiscount + shipping);

  /* ========= Helper: trích xuất orderId từ response linh hoạt ========= */
  const extractOrderId = (data: any): string | number | undefined => {
    if (!data) return undefined;
    // Các khả năng thường gặp
    if (data.order?.id) return data.order.id;
    if (data.order_id) return data.order_id;
    if (data.order?.order_id) return data.order.order_id;
    if (data.id) return data.id;
    if (typeof data === 'string' || typeof data === 'number') return data;
    return undefined;
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

      // lấy cart
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

      // Sẽ dùng để điều hướng sang trang thành công (nếu không redirect VNPAY)
      let createdOrderId: string | number | undefined;

      if (isGuest) {
        const guestPayload = {
          payment_method: paymentMethod,
          address_manual: {
            full_name: manualAddressData?.full_name || '',
            address: `${manualAddressData?.address ?? ''}${manualAddressData?.apartment ? ', ' + manualAddressData.apartment : ''
              }`,
            city: manualAddressData?.city || '',
            phone: manualAddressData?.phone || '',
            email: manualAddressData?.email || '',
          },
          cart_items: cartPayload,
          voucher_code: null,
        };
        const guestRes = await axios.post(`${API_BASE_URL}/nologin`, guestPayload);
        createdOrderId = extractOrderId(guestRes?.data); // 👈 cố gắng lấy orderId từ BE
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
            address: `${manualAddressData.address}${manualAddressData.apartment ? ', ' + manualAddressData.apartment : ''
              }`,
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

        // Nếu BE trả URL thanh toán → giữ nguyên hành vi
        if (response.data?.redirect_url) {
          localStorage.removeItem('cart');
          setCartItems([]);
          window.dispatchEvent(new Event('cartUpdated'));
          window.location.href = response.data.redirect_url;
          return;
        }

        createdOrderId = extractOrderId(response?.data);
      }

      // Đến đây là KHÔNG có redirect_url → coi như đặt thành công (COD hoặc paid ngay)
      setSuccessMessage('Đặt hàng thành công!');
      setPopupType('success');
      setShowPopup(true);

      localStorage.removeItem('cart');
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdated'));

      // 👉 Điều hướng sang trang thành công, truyền đủ tham số
      const qs = new URLSearchParams({
        orderId: String(createdOrderId ?? ''),                         // có thể rỗng nếu BE không trả
        total: String(Math.max(0, Math.floor(finalTotal))),            // tổng thanh toán
        payment: String(paymentMethod || 'cod'),                       // phương thức
      }).toString();

      router.push(`/checkout/success?${qs}`);
      // Không còn setTimeout về trang chủ nữa
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi đặt hàng';
      setError(msg);
      setPopupType('error');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  /* ============== Auto hide popup ============== */
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setPopupType(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  /* ============== UI ============== */
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
            <span className="text-green-700">
              -{promotionDiscount.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {/* Voucher – luôn hiển thị theo số đã truyền/tính */}
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Voucher:</span>
            <span className="text-green-700">
              -{(voucherDiscount || 0).toLocaleString('vi-VN')}đ
            </span>
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

      {/* {showPopup && (
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
              <path strokeLinecap="round" strokeLinejoin="round"
                d={popupType === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
            </svg>

            <p className={`text-base font-semibold text-center ${popupType === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {popupType === 'success' ? successMessage : error}
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
}
