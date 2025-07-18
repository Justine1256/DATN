'use client';

import React, { useEffect, useState } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import Cookies from 'js-cookie';
import { API_BASE_URL } from "@/utils/api";
import axios from 'axios';

export default function VoucherList() {
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');

    const token = Cookies.get('authToken');

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        fetchVouchers();
    }, [token]);

    const fetchVouchers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vouchers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const formatted: VoucherShip[] = response.data.map((v: any) => ({
                id: v.id,
                code: v.code,
                discount_value: v.discount_value,
                discount_type: v.discount_type,
                discountText:
                    v.discount_type === 'percent'
                        ? `Giảm ${v.discount_value}%`
                        : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`,
                condition: `Đơn từ ${Number(v.min_order_value).toLocaleString('vi-VN')}đ`,
                expiry: v.end_date?.split('T')[0],
                imageUrl: '/ship.jpg',
                isSaved: v.is_saved || false,
            }));

            setVouchers(formatted);
        } catch (err) {
            console.error('❌ Lỗi khi lấy voucher:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (voucherId: number) => {
        const existingVoucher = vouchers.find(v => v.id === voucherId);
        if (existingVoucher?.isSaved) {
            setPopupMessage("Voucher này đã có trong giỏ hàng!");
            setPopupType('error');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
            return;
        }

        try {
            const token = Cookies.get('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/voucherseve`,
                { voucher_id: voucherId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            if (response.data.success) {
                setVouchers(prev => prev.map(v =>
                    v.id === voucherId ? { ...v, isSaved: true } : v
                ));

                setPopupMessage("Voucher đã được lưu vào giỏ hàng!");
                setPopupType('success');
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 3000);

                // fetchVouchers(); // không cần thiết nếu đã cập nhật local state
            } else {
                setPopupMessage("Lỗi khi lưu voucher, vui lòng thử lại.");
                setPopupType('error');
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 3000);
            }
        } catch (error: any) {
            console.error('❌ Lỗi khi lưu voucher:', error);
            if (error.response?.status === 409) {
                setPopupMessage("Voucher này đã có trong giỏ hàng!");
                setPopupType('error');
                setVouchers(prev => prev.map(v =>
                    v.id === voucherId ? { ...v, isSaved: true } : v
                ));
            } else {
                setPopupMessage("Đã xảy ra lỗi khi lưu voucher.");
                setPopupType('error');
            }

            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
        }
    };

    return (
        <div className="py-4 px-4 max-w-[1170px] mx-auto ">
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db4444]"></div>
                    <p className="ml-4 text-gray-600">Đang tải mã giảm giá...</p>
                </div>
            )}

            {!loading && vouchers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className="animate-in fade-in slide-in-from-bottom duration-500">
                            <VoucherShipCard
                                voucher={vouchers.find(v => v.id === voucher.id)!}
                                onSave={() => handleSave(voucher.id)}
                            />
                        </div>
                    ))}
                </div>
            ) : !loading && vouchers.length === 0 ? (
                <div className="text-center py-20">
                    <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có mã giảm giá</h3>
                    <p className="text-gray-500">Hiện tại chưa có mã giảm giá nào khả dụng.</p>
                </div>
            ) : null}

            {showPopup && (
                <div className={`fixed top-20 right-5 z-[9999] bg-white text-green-600 text-sm px-4 py-3 rounded-lg shadow-lg border-l-4 border-green-600 animate-slideInFade
                    ${popupType === 'success' ? 'text-green-600 border-green-600' : 'text-brand border-[#DB4444]'}`}>
                    <div className="flex items-center">
                        <svg className={`w-5 h-5 mr-2 ${popupType === 'success' ? 'text-green-600' : 'text-brand'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {popupMessage}
                    </div>
                </div>
            )}
        </div>
    );
}
