'use client';

import React, { useEffect, useState } from 'react';
import VoucherShipCard, { VoucherShip } from './VoucherCard';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function VoucherList() {
    const [vouchers, setVouchers] = useState<VoucherShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = Cookies.get("authToken");

    // ✅ Fetch danh sách voucher khi có token
    useEffect(() => {
        if (!token) {
            setError("❌ Bạn cần đăng nhập để xem và lưu mã giảm giá.");
            setLoading(false);
            return;
        }

        axios.get("http://localhost:8000/api/vouchers", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        })
            .then(res => {
                setVouchers(res.data);
            })
            .catch(err => {
                console.error("❌ Lỗi khi lấy voucher:", err);
                setError("Không thể tải danh sách mã giảm giá.");
            })
            .finally(() => setLoading(false));
    }, [token]);

    // ✅ Hàm lưu mã giảm giá
    const handleSaveVoucher = async (voucherId: number) => {
        if (!token) return alert("⚠️ Bạn cần đăng nhập");

        try {
            await axios.post("http://localhost:8000/api/user-vouchers",
                { voucherId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("✔️ Đã lưu mã thành công!");
        } catch (err) {
            console.error("❌ Lỗi lưu mã:", err);
            alert("❌ Không thể lưu mã giảm giá.");
        }
    };

    return (
        <div className="py-10 px-4 max-w-[1170px] mx-auto">
            <h2 className="text-2xl font-bold mb-6">Danh sách Mã Giảm Giá</h2>

            {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vouchers.map(voucher => (
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
