'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { Tag, Gift, Calendar, Clock, Copy, Check } from 'lucide-react';

interface Voucher {
  id: number;
  code: string;
  discount_value: number;
  discount_type: 'fixed' | 'percent';
  max_discount_value?: number | null;
  min_order_value: number;
  is_free_shipping: number;
  usage_limit: number;
  usage_count: number;
  start_date: string;
  end_date: string;
}

interface VoucherUser {
  id: number;
  voucher_id: number;
  created_at: string;
  voucher: Voucher;
}

export default function MyVouchersPage() {
  const [voucherUsers, setVoucherUsers] = useState<VoucherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const token = Cookies.get('authToken');
        const res = await axios.get(`${API_BASE_URL}/my-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVoucherUsers(res.data.data);
      } catch (err) {
        console.error('Error fetching vouchers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setPopupType('success');
      setPopupMessage('Đã sao chép mã');
      setShowPopup(true);
      setTimeout(() => {
        setCopied(null);
        setShowPopup(false);
      }, 2000);
    } catch {
      setPopupType('error');
      setPopupMessage('Không thể sao chép mã');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  const isExpired = (end: string) => new Date(end) < new Date();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Popup thông báo */}
        {showPopup && (
          <div
            className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-fadeIn
            ${popupType === 'success'
                ? 'bg-white text-black border-green-500'
                : 'bg-white text-red-600 border-red-500'
              }`}
          >
            {popupMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div className="ml-6">
            <h1 className="text-3xl font-bold text-red-500 mb-1">Voucher đã lưu</h1>
            <p className="text-gray-600">Các mã giảm giá bạn đã lưu vào tài khoản</p>
          </div>
        </div>

        {/* Nội dung voucher */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Đang tải...</p>
          </div>
        ) : voucherUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Bạn chưa lưu mã giảm giá nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {voucherUsers.map((vu) => {
              const { voucher } = vu;
              const expired = isExpired(voucher.end_date);
              const usedUp = voucher.usage_count >= voucher.usage_limit;
              const isValid = !expired && !usedUp;

              return (
                <div
                  key={vu.id}
                  className={`relative bg-white border border-gray-200 rounded-xl h-fit transition-all duration-200 ${isValid ? 'hover:border-red-300' : ''
                    } ${expired || usedUp ? 'opacity-60' : ''}`}
                >
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${isValid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {expired
                        ? 'Hết hạn'
                        : usedUp
                          ? 'Hết lượt'
                          : 'Còn Hạn'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3 pt-2">
                      <div className="flex-1 mr-2">
                        <div className="inline-block bg-red-50 border border-red-200 rounded-md px-2 py-1">
                          <span className="text-red-600 font-bold text-sm tracking-wide">
                            {voucher.code}
                          </span>
                        </div>
                      </div>
                      <button
                        className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${isValid
                          ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                          : 'text-gray-400 cursor-not-allowed'
                          }`}
                        onClick={() => handleCopy(voucher.code, vu.id)}
                        disabled={!isValid}
                      >
                        {copied === vu.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center text-gray-700">
                        <Gift className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate">
                            {voucher.discount_type === 'percent'
                              ? `Giảm ${voucher.discount_value}%`
                              : `Giảm ${formatCurrency(voucher.discount_value)}`}
                          </div>
                          {voucher.max_discount_value && voucher.discount_type === 'percent' && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              Tối đa {formatCurrency(Number(voucher.max_discount_value))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span>HSD: {formatDate(voucher.end_date)}</span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span>Đã lưu: {formatDate(vu.created_at)}</span>
                      </div>

                      <div>
                        <span>Đơn tối thiểu: </span>
                        <span className="font-medium">{formatCurrency(voucher.min_order_value)}</span>
                      </div>

                      {voucher.is_free_shipping === 1 && (
                        <div className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-md">
                          Miễn phí ship
                        </div>
                      )}
                    </div>

                    <button
                      className={`w-full py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isValid
                        ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      disabled={!isValid}
                    >
                      {isValid ? 'Sử dụng ngay' : 'Không thể sử dụng'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
