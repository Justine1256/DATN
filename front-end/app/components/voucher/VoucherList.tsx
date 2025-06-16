'use client';

import React, { useEffect, useState } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import Cookies from 'js-cookie';
import { API_BASE_URL } from "@/utils/api";
import axios from 'axios';

export default function VoucherList() {
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [popupMessage, setPopupMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const token = Cookies.get('authToken');  // Lấy token từ cookie

    // Log token ra console để kiểm tra
    console.log('Token trong cookie:', token);

    // Hiển thị popup trong 2.5s
    const showPopupTemp = (message: string) => {
        setPopupMessage(message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2500);
    };

    useEffect(() => {
        if (!token) {
            setError('❌ Bạn cần đăng nhập để xem và lưu mã giảm giá.');
            setLoading(false);
            return;
        }

        axios
            .get(`${API_BASE_URL}/vouchers`, {
                headers: {
                    Authorization: `Bearer ${token}`,  // Gửi token trong header
                    Accept: 'application/json',
                },
            })
            .then((res) => {
                const formatted: VoucherShip[] = res.data.map((v: any) => ({
                    id: v.id,
                    code: v.code,
                    discountText:
                        v.discount_type === 'percent'
                            ? `Giảm ${v.discount_value}%`
                            : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`,
                    condition: `Đơn từ ${Number(v.min_order_value).toLocaleString('vi-VN')}đ`,
                    expiry: v.end_date?.split('T')[0],
                    imageUrl: '/ship.jpg',
                }));
                setVouchers(formatted);
            })
            .catch((err) => {
                console.error('❌ Lỗi khi lấy voucher:', err);
                setError('Không thể tải danh sách mã giảm giá.');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSaveVoucher = async (voucherId: number) => {
        if (!token) return showPopupTemp('⚠️ Bạn cần đăng nhập');
        console.log('🔑 Token từ Cookie:', token);

        try {
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

            console.log(response.data);

            if (response.data.message === "Lưu voucher thành công") {
                showPopupTemp('✔️ Đã lưu mã thành công!');
            } else {
                showPopupTemp('❌ Không thể lưu mã giảm giá.');
            }
        } catch (err: any) {
            console.error('❌ Lỗi lưu mã:', err);

            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message;

                if (status === 401) {
                    showPopupTemp('⚠️ Bạn cần đăng nhập lại.');
                    setError('❌ Bạn cần đăng nhập lại để lưu mã.');
                } else if (status === 409) {
                    showPopupTemp('⚠️ Bạn đã lưu mã này rồi!');
                } else {
                    console.error('Lỗi từ server:', err.response.data);
                    showPopupTemp('❌ Không thể lưu mã giảm giá.');
                }
            } else {
                showPopupTemp('❌ Không thể kết nối đến server.');
            }
        }
    };


    return (
        <div className="py-10 px-4 max-w-[1170px] mx-auto">
            {/* Popup thông báo */}
            {showPopup && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#db4444] animate-slideInFade">
                    {popupMessage}
                </div>
            )}

            {/* Tiêu đề */}
            <div className="relative flex justify-center items-center mb-12 w-full max-w-[1170px] px-4">
                <div className="relative z-10 bg-gradient-to-r from-[#db4444] to-[#b03030] 
          text-white font-extrabold text-[32px] md:text-[36px] px-10 py-5 
          rounded-full shadow-xl tracking-wide border-[6px] border-white 
          transition duration-500 hover:brightness-110 text-center">
                    Danh sách mã giảm giá
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                        <div className="absolute top-0 left-[-75%] w-[150%] h-full 
              bg-gradient-to-r from-transparent via-white/10 to-transparent 
              transform rotate-12 animate-glow-slide" />
                    </div>
                </div>
            </div>

            {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vouchers.map((voucher) => (
                    <VoucherShipCard
                        key={voucher.id}
                        voucher={voucher}
                        onSave={handleSaveVoucher}
                    />
                ))}
            </div>
        </div>
    );
}
