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
        // Kiểm tra xem voucher đã được lưu chưa
        const existingVoucher = vouchers.find(v => v.id === voucherId);
        if (existingVoucher?.isSaved) {
            setPopupMessage("Voucher này đã được lưu trước đó.");
            setShowPopup(true);
            return; // Dừng lại nếu voucher đã được lưu
        }

        try {
            const token = Cookies.get('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/vouchersave`,
                { voucherId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            if (response.data.success) {
                setPopupMessage("Voucher đã được lưu vào giỏ hàng!");
                setShowPopup(true);
                fetchVouchers(); // Tải lại vouchers để cập nhật trạng thái isSaved
            } else {
                setPopupMessage("Lỗi khi lưu voucher, vui lòng thử lại.");
                setShowPopup(true);
            }
        } catch (error) {
            console.error('❌ Lỗi khi lưu voucher:', error);
            setPopupMessage("Đã xảy ra lỗi khi lưu voucher.");
            setShowPopup(true);
        }
    };

    return (
        <div className="py-12 px-4 max-w-[1170px] mx-auto">
            {/* Nếu đang tải */}
            {loading && <p>Đang tải mã giảm giá...</p>}

            {/* Hiển thị voucher nếu có */}
            {vouchers.length > 0 ? (
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
            ) : (
                <p>Không có mã giảm giá nào khả dụng.</p>
            )}

            {/* Hiển thị Popup thông báo khi lưu voucher */}
            {showPopup && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
                    {popupMessage}
                </div>
            )}
        </div>
    );
}
