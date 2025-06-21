'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import { Tag, Gift, Calendar, Clock, Copy, Check, Star } from 'lucide-react';

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
  created_at: string; // thời gian người dùng lưu
  voucher: Voucher;
}

export default function MyVouchersPage() {
  const [voucherUsers, setVoucherUsers] = useState<VoucherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);

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
      setTimeout(() => setCopied(null), 2000);
    } catch {
      alert('Không thể sao chép mã');
    }
  };

  const isExpired = (end: string) => new Date(end) < new Date();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-red-500 rounded-xl">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-red-500">Voucher đã lưu</h1>
            <p className="text-gray-500 text-sm">Các mã giảm giá bạn đã lưu vào tài khoản</p>
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : voucherUsers.length === 0 ? (
          <p className="text-gray-500">Bạn chưa lưu mã giảm giá nào.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voucherUsers.map((vu) => {
              const { voucher } = vu;
              const expired = isExpired(voucher.end_date);
              const usedUp = voucher.usage_count >= voucher.usage_limit;

              return (
                <div
                  key={vu.id}
                  className={`relative border rounded-xl p-4 shadow-sm bg-white ${
                    expired || usedUp ? 'opacity-60' : ''
                  }`}
                >
                  <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full text-white font-medium bg-gray-500">
                    {expired
                      ? 'Đã hết hạn'
                      : usedUp
                      ? 'Đã hết lượt'
                      : 'Còn hiệu lực'}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-red-500 bg-red-100 px-3 py-1 rounded-md">
                      {voucher.code}
                    </span>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleCopy(voucher.code, vu.id)}
                      disabled={expired || usedUp}
                    >
                      {copied === vu.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-red-400" />
                      {voucher.discount_type === 'percent'
                        ? `Giảm ${voucher.discount_value}%`
                        : `Giảm ${formatCurrency(voucher.discount_value)}`}
                      {voucher.max_discount_value && voucher.discount_type === 'percent' && (
                        <span className="text-xs text-gray-500">
                          (tối đa {formatCurrency(Number(voucher.max_discount_value))})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      HSD: {formatDate(voucher.end_date)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Đã lưu lúc: {formatDate(vu.created_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Đơn tối thiểu: {formatCurrency(voucher.min_order_value)}
                    </div>
                    {voucher.is_free_shipping === 1 && (
                      <div className="text-xs text-green-500 font-medium">Miễn phí vận chuyển</div>
                    )}
                  </div>

                  <button
                    className={`w-full mt-4 py-2 rounded-md text-sm font-semibold ${
                      expired || usedUp
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    disabled={expired || usedUp}
                  >
                    {expired || usedUp ? 'Không thể sử dụng' : 'Sử dụng ngay'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
