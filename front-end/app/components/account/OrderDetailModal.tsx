"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "../../../types/oder";
import { formatImageUrl, translateOrderStatus } from "../../../types/utils";
import { X, Package, Calendar, CreditCard, MapPin, Store } from "lucide-react";

interface OrderDetailModalProps {
    order: Order | null;
    isVisible: boolean;
    onClose: () => void;
    onShowConfirmCancel: (orderId: number) => void;
    onCancelOrder: (orderId: number, reason: string) => Promise<void>;
    onRefundRequest: (order: Order) => void; // ✅
    isCancelling: boolean;
}

const getStatusColor = (status: string) => {
    const cleanStatus = status?.toString().trim();
    switch (cleanStatus) {
        case "Pending":
        case "order confirmation":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Shipped":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "Delivered":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Canceled":
            return "bg-red-50 text-red-700 border-red-200";
        case "Return Requested":
            return "bg-orange-50 text-orange-700 border-orange-200";
        case "Return Approved":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "Return Rejected":
            return "bg-red-50 text-red-700 border-red-200";
        case "Returning":
            return "bg-purple-50 text-purple-700 border-purple-200";
        case "Refunded":
            return "bg-green-50 text-green-700 border-green-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
};

export default function OrderDetailModal({
    order,
    isVisible,
    onClose,
    onCancelOrder,
    onShowConfirmCancel,
    isCancelling,
}: OrderDetailModalProps) {
    const router = useRouter();

    if (!isVisible || !order) return null;

    // ==== Helpers lấy slug ====
    const getShopSlug = (detail: any) =>
        detail?.shop_slug ||
        detail?.product?.shop_slug ||
        detail?.product?.shop?.slug ||
        (order as any)?.shop_slug || // fallback theo đơn
        null;

    const getProductSlug = (detail: any) => detail?.product?.slug || null;

    const goProduct = (detail: any) => {
        const shopSlug = getShopSlug(detail);
        const productSlug = getProductSlug(detail);
        if (!shopSlug || !productSlug) return;
        router.push(`/shop/${shopSlug}/product/${productSlug}`);
    };

    const goShop = (detail: any) => {
        const shopSlug = getShopSlug(detail);
        if (!shopSlug) return;
        router.push(`/shop/${shopSlug}`);
    };
    // === Fallback tổng tiền an toàn ===
    const safeFinalAmount = (() => {
        // 1) cộng thành tiền từng dòng
        const sumDetails = (order.order_details || []).reduce((s, d: any) => {
            const sub = Number(d?.subtotal);
            return s + (Number.isFinite(sub) ? sub : 0);
        }, 0);

        // 2) đọc các field nếu backend có trả
        const rawFinal = Number(order.final_amount);
        const ship = Number((order as any).shipping_fee ?? 0);
        const rawDisc = Number(
            (order as any).voucher_discount ??
            (order as any).discount ??
            (order as any).total_discount ??
            (order as any).discount_amount ??
            0
        );

        // 3) nếu server đã tính hợp lệ (>0) thì ưu tiên dùng
        if (Number.isFinite(rawFinal) && rawFinal > 0) return rawFinal;

        // 4) nếu không, tự tính lại: cap discount ≤ sumDetails
        const cappedDisc = Math.max(0, Math.min(rawDisc, sumDetails));
        return Math.max(0, sumDetails - cappedDisc) + (Number.isFinite(ship) ? ship : 0);
    })();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">{/* chừa trống như cũ */}</div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Order Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Thông tin đơn hàng</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày đặt:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Trạng thái:</span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                            order.order_status
                                        )}`}
                                    >
                                        {translateOrderStatus(order.order_status as OrderStatus)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Thanh toán</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phương thức:</span>
                                    <span className="font-medium text-gray-900">{order.payment_method}</span>
                                </div>
                                {/* Giữ nguyên như cũ */}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Giao hàng</h3>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{order.shipping_address}</p>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Store className="w-4 h-4" />
                                Danh sách sản phẩm
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thông tin
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đơn giá
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số lượng
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cửa hàng
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.order_details.map((detail, index) => {
                                        const shopSlug = getShopSlug(detail);
                                        const productSlug = getProductSlug(detail);

                                        return (
                                            <tr
                                                key={detail.id}
                                                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                            >
                                                {/* Ảnh + Tên sản phẩm (click đi tới trang sản phẩm) */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {detail.product ? (
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => goProduct(detail)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        goProduct(detail);
                                                                    }
                                                                }}
                                                                className="cursor-pointer"
                                                                title="Xem chi tiết sản phẩm"
                                                            >
                                                                <Image
                                                                    src={formatImageUrl(detail.product.image) || "/placeholder.svg"}
                                                                    alt={detail.product.name}
                                                                    width={60}
                                                                    height={60}
                                                                    className="rounded-lg border border-gray-200 object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[60px] h-[60px] bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 border border-gray-200">
                                                                Không có ảnh
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            {shopSlug && productSlug ? (
                                                                <Link
                                                                    href={`/shop/${shopSlug}/product/${productSlug}`}
                                                                    className="text-sm font-medium text-gray-900 truncate hover:underline"
                                                                    title={detail.product?.name || "Sản phẩm không xác định"}
                                                                >
                                                                    {detail.product?.name || "Sản phẩm đã bị xoá"}
                                                                </Link>
                                                            ) : (
                                                                <div
                                                                    className="text-sm font-medium text-gray-900 truncate"
                                                                    title={detail.product?.name || "Sản phẩm không xác định"}
                                                                >
                                                                    {detail.product?.name || "Sản phẩm đã bị xoá"}
                                                                </div>
                                                            )}

                                                            {detail.product?.description ? (
                                                                <div
                                                                    className="text-xs text-gray-500 mt-1"
                                                                    title={detail.product.description}
                                                                >
                                                                    {detail.product.description.length > 50 ? (
                                                                        <span>{detail.product.description.slice(0, 50)}...</span>
                                                                    ) : (
                                                                        <span>{detail.product.description}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-400 mt-1">Không có mô tả</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Thông tin biến thể */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {detail.product_value ? (
                                                            detail.product_value.split(" - ").map((v, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`inline-block text-xs px-2 py-1 rounded-full w-fit ${i === 0
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : "bg-emerald-100 text-emerald-700"
                                                                        }`}
                                                                >
                                                                    {v}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Không có biến thể</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Đơn giá */}
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {Number.parseFloat(detail.price_at_time).toLocaleString()}₫
                                                    </div>
                                                </td>

                                                {/* Số lượng */}
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {detail.quantity}
                                                    </div>
                                                </td>

                                                {/* Cửa hàng (click đi tới trang shop) */}
                                                <td className="px-6 py-4 text-center">
                                                    {shopSlug ? (
                                                        <Link
                                                            href={`/shop/${shopSlug}`}
                                                            className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium hover:bg-purple-200 transition"
                                                            title="Xem cửa hàng"
                                                        >
                                                            {order.shop_name ? order.shop_name : shopSlug}
                                                        </Link>
                                                    ) : (
                                                        <span className="inline-block bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                                                            Không rõ cửa hàng
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Thành tiền */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {Number.parseFloat(detail.subtotal).toLocaleString()}₫
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-lg font-semibold text-gray-700">
                                Tổng cộng đơn hàng:
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                {Math.floor(safeFinalAmount).toLocaleString("vi-VN")}₫
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end gap-3">
                        <button
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            onClick={onClose}
                            disabled={isCancelling}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
