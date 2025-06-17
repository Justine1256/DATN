'use client';

import React, { useEffect, useState } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import axios from 'axios';

export default function VoucherList() {
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' as 'success' | 'error' | 'warning'
    });

    const token = Cookies.get('authToken');

    // Enhanced notification system with different types
    const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    useEffect(() => {
        if (!token) {
            setError('Bạn cần đăng nhập để xem và lưu mã giảm giá.');
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
                isSaved: false,
            }));

            await checkSavedVouchers(formatted);
        } catch (err) {
            console.error('❌ Lỗi khi lấy voucher:', err);
            setError('Không thể tải danh sách mã giảm giá.');
        } finally {
            setLoading(false);
        }
    };

    const checkSavedVouchers = async (formatted: VoucherShip[]) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/saved-vouchers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const savedVoucherIds = response.data.map((v: any) => v.voucher_id);
            const updatedVouchers = formatted.map(voucher => ({
                ...voucher,
                isSaved: savedVoucherIds.includes(voucher.id),
            }));
            setVouchers(updatedVouchers);
        } catch (err) {
            console.error('❌ Lỗi khi kiểm tra voucher đã lưu:', err);
            setError('Không thể kiểm tra trạng thái lưu mã giảm giá.');
        }
    };

    const handleSaveVoucher = async (voucherId: number) => {
        if (!token) {
            showNotification('Bạn cần đăng nhập để lưu voucher', 'warning');
            return;
        }

        // Optimistic update
        setVouchers(prevVouchers =>
            prevVouchers.map(voucher =>
                voucher.id === voucherId ? { ...voucher, isSaved: true } : voucher
            )
        );

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

            if (response.data.message === "Lưu voucher thành công") {
                showNotification('Đã lưu mã giảm giá thành công!', 'success');
            } else {
                throw new Error('Unexpected response');
            }
        } catch (err: any) {
            // Revert optimistic update
            setVouchers(prevVouchers =>
                prevVouchers.map(voucher =>
                    voucher.id === voucherId ? { ...voucher, isSaved: false } : voucher
                )
            );

            console.error('❌ Lỗi lưu mã:', err);

            if (err.response) {
                const status = err.response.status;
                if (status === 401) {
                    showNotification('Bạn cần đăng nhập lại', 'warning');
                } else if (status === 409) {
                    showNotification('Bạn đã lưu mã này rồi!', 'warning');
                    // Update the voucher as saved since it already exists
                    setVouchers(prevVouchers =>
                        prevVouchers.map(voucher =>
                            voucher.id === voucherId ? { ...voucher, isSaved: true } : voucher
                        )
                    );
                } else {
                    showNotification('Không thể lưu mã giảm giá', 'error');
                }
            } else {
                showNotification('Không thể kết nối đến server', 'error');
            }
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getNotificationStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-800';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    if (loading) {
        return (
            <div className="py-20 px-4 max-w-[1170px] mx-auto">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-red-300 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">Đang tải mã giảm giá...</h3>
                        <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 px-4 max-w-[1170px] mx-auto">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">Có lỗi xảy ra</h3>
                        <p className="text-sm text-gray-600 max-w-md">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
            {/* Enhanced Notification */}
            {notification.show && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
                    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${getNotificationStyles(notification.type)} backdrop-blur-sm`}>
                        {getNotificationIcon(notification.type)}
                        <span className="font-medium">{notification.message}</span>
                        <button
                            onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="py-12 px-4 max-w-[1170px] mx-auto">
                {/* Enhanced Header */}
                <div className="text-center mb-16">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 blur-xl bg-gradient-to-r from-red-400 to-orange-400 opacity-20 rounded-full transform scale-110"></div>
                        <h1 className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent font-bold text-4xl md:text-5xl lg:text-6xl mb-4">
                            Mã Giảm Giá
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Khám phá những ưu đãi tuyệt vời dành riêng cho bạn
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center items-center space-x-8 mt-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">{vouchers.length}</div>
                            <div className="text-sm text-gray-500">Mã khả dụng</div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">{vouchers.filter(v => v.isSaved).length}</div>
                            <div className="text-sm text-gray-500">Đã lưu</div>
                        </div>
                    </div>
                </div>

                {/* Voucher Grid */}
                {vouchers.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {vouchers.map((voucher, index) => (
                            <div
                                key={voucher.id}
                                className="animate-in fade-in slide-in-from-bottom duration-500"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <VoucherShipCard
                                    voucher={voucher}
                                    onSave={handleSaveVoucher}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có mã giảm giá</h3>
                        <p className="text-gray-500">Hiện tại chưa có mã giảm giá nào khả dụng</p>
                    </div>
                )}

                {/* Footer CTA */}
                {vouchers.length > 0 && (
                    <div className="text-center mt-16 pt-8 border-t border-gray-200">
                        <p className="text-gray-600 mb-4">Đã tìm thấy mã giảm giá phù hợp?</p>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span>Về đầu trang</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}