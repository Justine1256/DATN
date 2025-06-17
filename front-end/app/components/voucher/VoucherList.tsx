'use client';

import React, { useEffect, useState } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import Cookies from 'js-cookie';
import { API_BASE_URL } from "@/utils/api";
import axios from 'axios';

export default function VoucherList() {
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]); // Lưu trữ voucher
    const [loading, setLoading] = useState(true); // Trạng thái loading
    const [showPopup, setShowPopup] = useState(false); // Trạng thái hiển thị popup
    const [popupMessage, setPopupMessage] = useState(''); // Nội dung của popup

    const token = Cookies.get('authToken'); // Lấy token từ cookie

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        fetchVouchers();
    }, [token]);

    // Hàm tải voucher từ API
    const fetchVouchers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vouchers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            console.log('Dữ liệu trả về:', response.data);

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
                isSaved: v.is_saved || false, // Kiểm tra từ DB xem voucher đã được lưu hay chưa
            }));

            setVouchers(formatted); // Lưu dữ liệu vào state vouchers
        } catch (err) {
            console.error('❌ Lỗi khi lấy voucher:', err);
        } finally {
            setLoading(false);
        }
    };

    // Hàm lưu voucher vào giỏ hàng
    const handleSave = async (voucherId: number) => {
        // Kiểm tra xem voucher đã được lưu chưa từ state
        const existingVoucher = vouchers.find(v => v.id === voucherId);
        if (existingVoucher?.isSaved) {
            setPopupMessage("Voucher này đã có trong giỏ hàng!");
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
                // Cập nhật state ngay lập tức khi lưu thành công
                setVouchers(prev => prev.map(v =>
                    v.id === voucherId ? { ...v, isSaved: true } : v
                ));

                setPopupMessage("Voucher đã được lưu vào giỏ hàng!");
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 3000);

                // Vẫn fetch lại để đồng bộ với server (không bắt buộc)
                fetchVouchers();
            } else {
                setPopupMessage("Lỗi khi lưu voucher, vui lòng thử lại.");
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 3000);
            }
        } catch (error: any) {
            console.error('❌ Lỗi khi lưu voucher:', error);

            // Xử lý lỗi 409 - voucher đã tồn tại trong giỏ hàng
            if (error.response?.status === 409) {
                setPopupMessage("Voucher này đã có trong giỏ hàng!");
                // Cập nhật state để đánh dấu voucher đã được lưu
                setVouchers(prev => prev.map(v =>
                    v.id === voucherId ? { ...v, isSaved: true } : v
                ));
            } else {
                setPopupMessage("Đã xảy ra lỗi khi lưu voucher.");
            }

            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
        }
    };

    return (
        <div className="py-12 px-4 max-w-[1170px] mx-auto">
            {/* Nếu đang tải */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db4444]"></div>
                    <p className="ml-4 text-gray-600">Đang tải mã giảm giá...</p>
                </div>
            )}

            {/* Hiển thị voucher nếu có */}
            {!loading && vouchers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className="animate-in fade-in slide-in-from-bottom duration-500">
                            <VoucherShipCard
                                voucher={voucher}
                                onSave={() => handleSave(voucher.id)} // Gọi handleSave khi nhấn nút lưu
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

            {/* Hiển thị Popup thông báo khi lưu voucher */}
            {showPopup && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-[#DB4444] text-sm px-4 py-3 rounded-lg shadow-lg border-l-4 border-[#DB4444] animate-slideInFade">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#DB4444]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {popupMessage}
                    </div>
                </div>
            )
}
        </div>
    );
}