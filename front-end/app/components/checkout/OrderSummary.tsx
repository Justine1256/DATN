'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { useState } from 'react';

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
}: Props)
 {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Tính toán các giá trị ---
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const promotionDiscount = cartItems.reduce((sum, item) => {
    const { price, sale_price } = item.product;
    if (sale_price && sale_price < price) {
      return sum + (price - sale_price) * item.quantity;
    }
    return sum;
  }, 0);

  const discountedSubtotal = subtotal - promotionDiscount;

  const shipping = 20000;
  const voucherDiscount = 0; // giả định chưa tính trước ở FE, BE sẽ xử lý
  const finalTotal = discountedSubtotal - voucherDiscount + shipping;

const handlePlaceOrder = async () => {
    
  if (!addressId && !manualAddressData) {
    setError('Vui lòng chọn hoặc nhập địa chỉ giao hàng.');
    return;
  }

  setLoading(true);
  setError('');
  setSuccessMessage('');

  try {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      setError('Bạn chưa đăng nhập.');
      setLoading(false);
      return;
    }

    const requestBody: OrderRequestBody = {
      payment_method: paymentMethod.toUpperCase(),
      voucher_code: voucherCode || null,
    };

    if (manualAddressData && Object.values(manualAddressData).some((v) => v.trim() !== '')) {
      requestBody.address_manual = {
        full_name: manualAddressData.full_name,
        address: `${manualAddressData.address}${
          manualAddressData.apartment ? ', ' + manualAddressData.apartment : ''
        }`,
        city: manualAddressData.city,
        phone: manualAddressData.phone,
        email: manualAddressData.email,
      };
      console.log("manualAddressData:", manualAddressData);
    } else if (addressId) {
      requestBody.address_id = addressId;
    } else {
      setError('Vui lòng chọn hoặc nhập địa chỉ giao hàng.');
      setLoading(false);
      return;
    }

    const response = await axios.post(`${API_BASE_URL}/dathang`, requestBody, {
        
        
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(requestBody);

    setSuccessMessage('Đặt hàng thành công!');
    console.log('Order response:', response.data);

    if (response.data.redirect_url) {
      window.location.href = response.data.redirect_url;
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Lỗi khi đặt hàng';
    setError(msg);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="space-y-6 text-sm">
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
            <span>{shipping.toLocaleString()}đ</span>
          </div>

          <div className="flex justify-between font-semibold text-lg text-brand pt-3">
            <span>Tổng thanh toán:</span>
            <span>{finalTotal.toLocaleString()}đ</span>
          </div>
        </div>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}

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
    </div>
  );
}
