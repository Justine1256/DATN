'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { useEffect, useRef, useState } from 'react';

interface CartItem {
  id: number;
  quantity: number;
  product: {
    price: number;
    sale_price?: number | null;
  };
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

interface Props {
  cartItems: CartItem[];
  paymentMethod: string;
  addressId: number | null;
  voucherCode?: string | null;
  manualAddressData?: {
    full_name: string;
    address: string;
    apartment?: string;
    city: string;
    phone: string;
    email: string;
  };
}

export default function OrderSummary({
  cartItems,
  paymentMethod,
  addressId,
  voucherCode = null,
  manualAddressData,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const promotionDiscount = cartItems.reduce((sum, item) => {
    const { price, sale_price } = item.product;
    return sale_price && sale_price < price ? sum + (price - sale_price) * item.quantity : sum;
  }, 0);
  const discountedSubtotal = subtotal - promotionDiscount;
  const shipping = 20000;
  const voucherDiscount = 0;
  const finalTotal = discountedSubtotal - voucherDiscount + shipping;

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
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setPopupType('error');
        setShowPopup(true);
        setLoading(false);
        return;
      }

      const requestBody: OrderRequestBody = {
        payment_method: paymentMethod,
        
        voucher_code: voucherCode || null,
      };
console.log('paymentMethod gửi lên:', paymentMethod);

      if (manualAddressData && Object.values(manualAddressData).some((v) => v.trim() !== '')) {
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage('Đặt hàng thành công!');
      setPopupType('success');
      setShowPopup(true);

      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi đặt hàng';
      setError(msg);
      setPopupType('error');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto close popup sau 4 giây
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setPopupType(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // ✅ Click ra ngoài để tắt popup
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

  return (
    <div className="space-y-6 text-sm relative">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tóm tắt đơn hàng</h3>
        <div className="border-t border-gray-300 pt-4 space-y-1">
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span>Tạm tính (giá gốc):</span>
            <span>{subtotal.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Khuyến mãi (giảm giá sản phẩm):</span>
            <span className="text-green-700">-{promotionDiscount.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Giảm giá từ voucher:</span>
            <span className="text-green-700">-{voucherDiscount.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Phí vận chuyển:</span>
            <span>{shipping ? shipping.toLocaleString('vi-VN') : '0'}đ</span>

          </div>
          <div className="flex justify-between font-semibold text-lg text-brand pt-3">
            <span>Tổng thanh toán:</span>
            <span>{finalTotal.toLocaleString()}đ</span>
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

      {/* ✅ Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
          <div
            ref={popupRef}
            className="bg-white rounded-lg p-6 w-80 flex flex-col items-center relative animate-scaleIn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mb-4 ${popupType === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  popupType === 'success'
                    ? 'M5 13l4 4L19 7'
                    : 'M6 18L18 6M6 6l12 12'
                }
              />
            </svg>
            <p
              className={`text-base font-semibold text-center ${popupType === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
            >
              {popupType === 'success' ? successMessage : error}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
