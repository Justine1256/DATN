'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/utils/api';

// ✅ Kiểu dữ liệu cho từng item trong giỏ hàng
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

// ✅ Voucher types
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

// ✅ Body gửi lên API khi đặt hàng
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

// ✅ Props truyền vào component
interface Props {
  cartItems: CartItem[];
  paymentMethod: string;
  addressId: number | null;

  // 👉 truyền hẳn object voucher (ưu tiên dùng), còn voucherCode là fallback
  appliedVoucher?: Voucher | null;
  voucherCode?: string | null;

  manualAddressData?: {
    full_name: string;
    address: string;
    apartment?: string;
    city: string;
    phone: string;
    email: string;
  };
  setCartItems: (items: CartItem[]) => void;
}

export default function OrderSummary({
  cartItems,
  paymentMethod,
  addressId,
  voucherCode = null,
  appliedVoucher = null,
  manualAddressData,
  setCartItems,
}: Props) {
  // ✅ Trạng thái UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // ✅ Tính toán đơn hàng (giữ nguyên base + thêm voucher)
  const subtotal = cartItems.reduce((sum, item) => {
    const originalPrice = item.variant?.price ?? item.product.price;
    return sum + originalPrice * item.quantity;
  }, 0);

  const promotionDiscount = cartItems.reduce((sum, item) => {
    const originalPrice = item.variant?.price ?? item.product.price;
    const discountedPrice = item.variant
      ? item.variant.sale_price ?? item.variant.price ?? 0
      : item.product.sale_price ?? item.product.price ?? 0;
    return sum + (originalPrice - discountedPrice) * item.quantity;
  }, 0);

  const discountedSubtotal = Math.max(0, subtotal - promotionDiscount);
  const shippingBase = cartItems.length > 0 ? 20000 : 0;

  // đủ điều kiện đơn tối thiểu cho voucher?
  const meetsMinOrder = (v: Voucher | null) => {
    if (!v?.min_order) return true;
    return discountedSubtotal >= v.min_order;
  };

  // ✅ giảm từ voucher (percent/amount – chỉ khi đủ điều kiện)
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
    // shipping: không giảm vào hàng
    return 0;
  })();

  // ✅ phí ship sau voucher (shipping = free nếu hợp lệ)
  const shipping = (() => {
    if (!appliedVoucher || !meetsMinOrder(appliedVoucher)) return shippingBase;
    const type = (appliedVoucher.type || '').toLowerCase();
    if (type === 'shipping') return 0;
    return shippingBase;
  })();

  const finalTotal = Math.max(0, discountedSubtotal - voucherDiscount + shipping);

  // ✅ Đặt hàng
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

      // ✅ Lấy giỏ hàng (login hoặc khách)
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

      // ✅ Xử lý đặt hàng (khách hoặc đã đăng nhập)
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
          // 👉 truyền mã voucher nếu có
          voucher_code: appliedVoucher?.code || voucherCode || null,
        };

        await axios.post(`${API_BASE_URL}/nologin`, guestPayload);
      } else {
        const requestBody: OrderRequestBody = {
          payment_method: paymentMethod,
          voucher_code: appliedVoucher?.code || voucherCode || null, // 👉 ưu tiên object
        };

        // ✅ Nếu người dùng nhập địa chỉ tay
        if (manualAddressData && Object.values(manualAddressData).some((v) => (v ?? '').toString().trim() !== '')) {
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

        // ✅ Redirect đến trang thanh toán (nếu có)
        if (response.data?.redirect_url) {
          localStorage.removeItem('cart');
          setCartItems([]);
          window.dispatchEvent(new Event('cartUpdated'));
          window.location.href = response.data.redirect_url;
          return;
        }
      }

      // ✅ Đặt hàng thành công
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

  // ✅ Tự động ẩn popup sau 4s
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setPopupType(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // ✅ Click ra ngoài popup để đóng
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setPopupType(null);
      }
    };
    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  // ✅ JSX hiển thị
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

          {/* Voucher (chỉ hiện số nếu có áp dụng và đủ điều kiện) */}
          {appliedVoucher && meetsMinOrder(appliedVoucher) ? (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Voucher:</span>
              <span className="text-green-700">-{voucherDiscount.toLocaleString('vi-VN')}đ</span>
            </div>
          ) : (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Voucher:</span>
              <span>-0đ</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Phí vận chuyển:</span>
            <span>{shipping.toLocaleString('vi-VN')}đ</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
          <div
            ref={popupRef}
            className="bg-white rounded-lg p-6 w-80 flex flex-col items-center relative animate-scaleIn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mb-4 ${popupType === 'success' ? 'text-green-600' : 'text-red-600'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={popupType === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
              />
            </svg>
            <p
              className={`text-base font-semibold text-center ${popupType === 'success' ? 'text-green-700' : 'text-red-700'}`}
            >
              {popupType === 'success' ? successMessage : error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
