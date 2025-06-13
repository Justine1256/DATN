'use client';

import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { useState } from 'react';

interface Props {
  cartItems: {
    id: number;
    quantity: number;
    product: { price: number };
  }[];
  totalPrice: number;
  paymentMethod: string;
  addressId: number | null;
}

export default function OrderSummary({ cartItems, totalPrice, paymentMethod, addressId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const shipping = 20000;
  const discount = 50000;
  const finalTotal = totalPrice + shipping - discount;

  const handlePlaceOrder = async () => {
    if (!addressId) {
      setError('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token') || Cookies.get('authToken');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/dathang`,
        {
          address_id: addressId,
          payment_method: paymentMethod.toUpperCase(), // ví dụ: "COD", "CARD"
          voucher_code: null, // Bạn có thể thêm input chọn mã giảm giá nếu muốn
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Đặt hàng thành công!');
      console.log('Order response:', response.data);
      // Nếu có redirect URL thì xử lý
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
        <h3 className="text-lg font-semibold mb-2">Order summary</h3>
        <div className="border-t border-gray-300 pt-4 space-y-1">
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span>Subtotal:</span>
            <span>{totalPrice.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Shipping:</span>
            <span>{shipping.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Discount:</span>
            <span className="text-green-700">-{discount.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between font-semibold text-lg text-brand pt-3">
            <span>Total:</span>
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
            {loading ? 'Đang xử lý...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
