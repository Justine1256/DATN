"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { STATIC_BASE_URL } from "@/utils/api";
import { Diamond, Medal, Crown, User } from "lucide-react";

type Product = {
    id: number;
    image: string | string[];
    name: string;
    price_at_time: string;
    quantity: number;
    subtotal: string;
};

export default function OrderDetailView({
    isOpen,
    onClose,
    buyer,
    products,
    shippingStatus,
    selectedOrderId,
    onExportInvoice,
}: {
    isOpen: boolean;
    onClose: () => void;
    buyer?: any;
    products: Product[];
    shippingStatus: "Pending" | "Shipping" | "Delivered" | "Failed";
    selectedOrderId: number;
    onExportInvoice: () => void;
}) {
    const shippingConfig = {
        Pending: { label: "Chờ giao", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
        Shipping: { label: "Đang giao", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
        Delivered: { label: "Đã giao", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
        Failed: { label: "Giao thất bại", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
    } as const;

    const rankMap: Record<string, { label: string; icon: any; color: string }> = {
        member: { label: "Thành viên", icon: <User className="w-4 h-4" />, color: "text-gray-600" },
        gold: { label: "Vàng", icon: <Crown className="w-4 h-4 text-yellow-500" />, color: "text-yellow-600" },
        silver: { label: "Bạc", icon: <Medal className="w-4 h-4 text-gray-400" />, color: "text-gray-500" },
        bronze: { label: "Đồng", icon: <Medal className="w-4 h-4 text-amber-700" />, color: "text-amber-700" },
        diamond: { label: "Kim cương", icon: <Diamond className="w-4 h-4 text-blue-400" />, color: "text-blue-500" },
    };

    const rankInfo = buyer?.rank ? rankMap[buyer.rank] || rankMap["member"] : rankMap["member"];

    const getImageUrls = (input: string | string[], baseUrl = STATIC_BASE_URL) => {
        if (!input) return [];
        if (typeof input === "string") {
            return input.includes(",") ? input.split(",").map((i) => `${baseUrl}/${i.trim()}`) : [`${baseUrl}/${input.trim()}`];
        }
        return input.map((i) => `${baseUrl}/${i.trim()}`);
    };

    const totalAmount = Array.isArray(products)
        ? products.reduce((acc, p) => acc + parseInt(p.subtotal), 0)
        : 0;

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-8 pb-20">
            <div className="bg-white rounded-3xl w-full max-w-6xl mx-4 p-8 relative border border-gray-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl transition-colors duration-200"
                >
                    ✕
                </button>

                {/* Header: Mã đơn hàng + gạch dưới */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng #{selectedOrderId}</h2>
                    <div className="w-20 h-1 bg-[#db4444] rounded-full mt-2"></div>
                </div>

                {/* Buyer Info */}
                <div className="mb-8 border border-gray-200 rounded-2xl p-8 bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Thông tin người mua</h3>

                    {buyer ? (
                        <div className="max-w-4xl mx-auto flex items-center gap-8">
                            {/* Avatar + Rank */}
                            <div className="relative shrink-0">
                                <Image
                                    src={`${STATIC_BASE_URL}/${buyer.avatar}`}
                                    alt="Avatar"
                                    width={100}
                                    height={100}
                                    className="rounded-full "
                                />
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 border-2 border-gray-200">
                                    {rankInfo.icon}
                                </div>
                            </div>

                            {/* Info section (aligned vertically center with avatar) */}
                            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                                <div className="text-center sm:text-left">
                                    <p className="text-sm text-gray-500">Tên khách hàng</p>
                                    <p className="font-semibold text-gray-900">{buyer.name}</p>
                                </div>
                                <div className="text-center sm:text-left break-all">
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-semibold text-gray-900">{buyer.email}</p>
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-sm text-gray-500">Số điện thoại</p>
                                    <p className="font-semibold text-gray-900">{buyer.phone}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">Không có thông tin người mua</p>
                    )}
                </div>


                {/* Product Table */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản phẩm đặt hàng</h3>
                    <div className="rounded-2xl overflow-hidden border border-gray-200">
                        <table className="w-full text-sm bg-white">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th className="py-4 px-6 text-left font-semibold">Sản phẩm</th>
                                    <th className="py-4 px-6 text-center font-semibold">Số lượng</th>
                                    <th className="py-4 px-6 text-center font-semibold">Đơn giá</th>
                                    <th className="py-4 px-6 text-center font-semibold">Thành tiền</th>
                                    <th className="py-4 px-6 text-center font-semibold">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p, index) => {
                                    const imageUrls = getImageUrls(p.image);
                                    return (
                                        <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <Image
                                                        src={imageUrls[0] || "/placeholder.png"}
                                                        alt={p.name}
                                                        width={50}
                                                        height={50}
                                                        className="rounded-xl border border-gray-200"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-900 mb-1">{p.name}</div>
                                                        <div className="text-xs text-gray-500">Mã SP: {p.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                    {p.quantity}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-medium text-gray-900">
                                                {parseInt(p.price_at_time).toLocaleString()} ₫
                                            </td>
                                            <td className="py-4 px-6 text-center font-semibold text-gray-900">
                                                {parseInt(p.subtotal).toLocaleString()} ₫
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full border text-xs font-medium
                                                    ${shippingConfig[shippingStatus].bg} 
                                                    ${shippingConfig[shippingStatus].text} 
                                                    ${shippingConfig[shippingStatus].border}`}>
                                                    {shippingConfig[shippingStatus].label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Total Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">Tổng số sản phẩm: {products.length}</p>
                            <p className="text-sm text-gray-600">Tổng số lượng: {products.reduce((acc, p) => acc + p.quantity, 0)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Tổng cộng thanh toán</p>
                            <p className="text-2xl font-bold text-red-600">
                                {totalAmount.toLocaleString()} ₫
                            </p>
                        </div>
                    </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-end">
                    <button
                        onClick={onExportInvoice}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-xl transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Xuất hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
}
