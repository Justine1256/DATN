"use client"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Order } from "../../../types/oder"
import { formatImageUrl, translateOrderStatus, groupByShop, translateShippingStatus } from "../../../types/utils"
import ReviewModal from "./ReviewModal"

import CancelOrderModal from "./cancel-order-modal"
import {
    Calendar,
    CreditCard,
    Truck,
    Package,
    Eye,
    Star,
    RotateCcw,
    CheckCircle,
    Clock,
    ShoppingBag,
    AlertCircle,
    Store,
    XCircle,
} from "lucide-react"
import RefundRequestModal from "./refund-request-modal"

interface OrderListItemProps {
    order: Order
    onViewDetails: (order: Order) => void
    onReorder: (order: Order) => void
    onCancelOrder: (orderId: number, reason: string) => void
    onRefundRequest: (order: Order, refundData: { reason: string; images: File[] }) => void;
    onReportShop: (order: Order, data: { reason: string; images: File[] }) => void;
    onClickRefund: () => void;
    reportedOrderIds: number[];
    onClickReport: () => void;


}

export default function OrderListItem({
    order,
    onViewDetails,
    onReorder,
    onCancelOrder,
    onRefundRequest,
    reportedOrderIds,
    onReportShop,
    onClickRefund,
    onClickReport
}: OrderListItemProps) {
    const [addToCartSuccess, setAddToCartSuccess] = useState(false)
    const [showReview, setShowReview] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [showRefundModal, setShowRefundModal] = useState(false)
    const [isProcessingRefund, setIsProcessingRefund] = useState(false)
    const [popup, setPopup] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [showReportModal, setShowReportModal] = useState(false);
    const [isReporting, setIsReporting] = useState(false);

    const router = useRouter()
    const handleGoProduct = (detail: any) => {
        const product = detail?.product;
        if (!product) return;

        const shopSlug =
            detail.shop_slug || product.shop_slug || product.shop?.slug || order.shop_slug;
        const productSlug = product.slug;

        console.log("🔍 shopSlug:", shopSlug);
        console.log("🔍 productSlug:", productSlug);

        // Chỉ điều hướng khi có đủ slug
        if (!shopSlug || !productSlug) return;

        router.push(`/shop/${shopSlug}/product/${productSlug}`);
    };


    // Fallback an toàn cho tổng tiền hiển thị
    const safeFinalAmount = (() => {
        // 1) tổng các dòng
        const sumDetails = (order.order_details || []).reduce((s, d) => {
            const sub = Number(d?.subtotal);
            return s + (Number.isFinite(sub) ? sub : 0);
        }, 0);

        // 2) đọc các field nếu backend có trả
        const rawFinal = Number(order.final_amount);
        const ship = Number(order.shipping_fee ?? 0);
        const rawDisc = Number(
            order.voucher_discount ??
            order.discount ??
            (order as any).total_discount ??
            (order as any).discount_amount ??
            0
        );


        // 3) nếu final_amount hợp lệ (>0) thì ưu tiên dùng
        if (Number.isFinite(rawFinal) && rawFinal > 0) return rawFinal;

        // 4) nếu không, tự tính lại: cap discount ≤ sumDetails
        const cappedDisc = Math.max(0, Math.min(rawDisc, sumDetails));
        return Math.max(0, sumDetails - cappedDisc) + (Number.isFinite(ship) ? ship : 0);
    })();


    const handleReportShop = async (data: { reason: string; images: File[] }) => {
        setIsReporting(true);
        try {
            await onReportShop(order, data);
            setPopup({ type: "success", message: "Đã gửi tố cáo thành công!" });
            setShowReportModal(false);
        } catch (error) {
            setPopup({ type: "error", message: "Tố cáo thất bại. Vui lòng thử lại." });
        } finally {
            setIsReporting(false);
            setTimeout(() => setPopup(null), 3000);
        }
    };

    // Enhanced status colors with gradients
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Pending":
                return {
                    bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
                    text: "text-amber-700",
                    border: "border-amber-200",
                    icon: Clock,
                    iconColor: "text-amber-500",
                };
            case "order confirmation":
                return {
                    bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: CheckCircle,
                    iconColor: "text-blue-500",
                };
            case "Shipped":
                return {
                    bg: "bg-gradient-to-r from-cyan-50 to-blue-50",
                    text: "text-cyan-700",
                    border: "border-cyan-200",
                    icon: Truck,
                    iconColor: "text-cyan-500",
                };
            case "Delivered":
                return {
                    bg: "bg-gradient-to-r from-emerald-50 to-green-50",
                    text: "text-emerald-700",
                    border: "border-emerald-200",
                    icon: Package,
                    iconColor: "text-emerald-500",
                };
            case "Canceled":
                return {
                    bg: "bg-gradient-to-r from-red-50 to-rose-50",
                    text: "text-red-700",
                    border: "border-red-200",
                    icon: XCircle,
                    iconColor: "text-red-500",
                };
            case "Return Requested":
                return {
                    bg: "bg-gradient-to-r from-orange-50 to-amber-50",
                    text: "text-orange-700",
                    border: "border-orange-200",
                    icon: RotateCcw,
                    iconColor: "text-orange-500",
                };
            case "Return Approved": // ✅ Mới thêm
                return {
                    bg: "bg-gradient-to-r from-blue-50 to-sky-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: CheckCircle,
                    iconColor: "text-blue-500",
                };
            case "Return Rejected": // ✅ Mới thêm
                return {
                    bg: "bg-gradient-to-r from-red-50 to-rose-50",
                    text: "text-red-700",
                    border: "border-red-200",
                    icon: XCircle,
                    iconColor: "text-red-500",
                };
            case "Returning":
                return {
                    bg: "bg-gradient-to-r from-purple-50 to-indigo-50",
                    text: "text-purple-700",
                    border: "border-purple-200",
                    icon: Truck,
                    iconColor: "text-purple-500",
                };
            case "Refunded":
                return {
                    bg: "bg-gradient-to-r from-green-50 to-emerald-50",
                    text: "text-green-700",
                    border: "border-green-200",
                    icon: CheckCircle,
                    iconColor: "text-green-500",
                };
            default:
                return {
                    bg: "bg-gradient-to-r from-gray-50 to-slate-50",
                    text: "text-gray-700",
                    border: "border-gray-200",
                    icon: Package,
                    iconColor: "text-gray-500",
                };
        }
    };


    const handleReorder = (order: Order) => {
        if (order.order_status === "Canceled") {
            setAddToCartSuccess(true)

            const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")

            // Push từng item, kiểm tra trùng nếu cần
            cartItems.push(...order.order_details)

            localStorage.setItem("cart", JSON.stringify(cartItems))

            setTimeout(() => {
                setAddToCartSuccess(false)
                router.push("/cart")
            }, 1500)
        } else {
            alert("Đơn hàng này không thể đặt lại.")
        }
    }


    const handleCancelOrder = async (reason: string) => {
        setIsCancelling(true)
        try {
            await onCancelOrder(order.id, reason)
            setShowCancelModal(false)
            setPopup({ type: "success", message: "Đơn hàng đã được hủy thành công!" })
            setTimeout(() => setPopup(null), 3000)
        } catch (error) {
            console.error("Error cancelling order:", error)
            setPopup({ type: "error", message: "Có lỗi xảy ra khi hủy đơn hàng." })
            setTimeout(() => setPopup(null), 3000)
        } finally {
            setIsCancelling(false)
        }
    }

    const handleRefundRequest = async (refundData: { reason: string; images: File[] }) => {
        setIsProcessingRefund(true)
        try {
            await onRefundRequest(order, refundData)
            setShowRefundModal(false)
            setPopup({ type: "success", message: "Yêu cầu hoàn đơn đã được gửi thành công!" })
            setTimeout(() => setPopup(null), 3000)
        } catch (error: any) {
            console.error("Error submitting refund:", error)
            // Hiển thị lỗi từ backend
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu hoàn đơn."
            setPopup({ type: "error", message: errorMessage })
            setTimeout(() => setPopup(null), 3000)
        } finally {
            setIsProcessingRefund(false)
        }
    }

    // Check if order can be cancelled (before shipping)
    const canCancel = order.order_status === "Pending" || order.order_status === "order confirmation"

    // Check if can request refund
    const canRefund =
        order.order_status === "Delivered" &&
        !order.refund_requested &&
        order.order_details.some((detail) => !detail.reviewed); // ✅ rõ nghĩa hơn



    const statusConfig = getStatusConfig(order.order_status)
    const StatusIcon = statusConfig.icon

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 mb-6 group">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#db4444] to-[#c73e3e] rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-900">#{order.id}</h3>
                            </div>
                            <div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            >
                                <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                                <span className="font-semibold text-sm whitespace-nowrap">
                                    {translateOrderStatus(order.order_status)}
                                </span>

                            </div>
                            {/* ✅ Nếu đã gửi yêu cầu và chưa bị từ chối */}
                            {order.refund_requested && order.refund_status !== "Rejected" && (
                                <div className="inline-flex items-center gap-2 text-purple-600 font-semibold px-4 py-3">
                                    <RotateCcw className="w-4 h-4" />
                                    Đã yêu cầu hoàn đơn
                                </div>
                            )}
                        </div>

                        {/* Order Info Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 font-medium block">Ngày đặt</span>
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 font-medium block">Trạng thái</span>
                                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap leading-none">
                                        {translateOrderStatus(order.order_status)}
                                    </span>


                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 font-medium block">Thanh toán</span>
                                    <span className="font-semibold text-gray-900 text-sm">{order.payment_method}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Truck className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 font-medium block">Giao hàng</span>
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {translateShippingStatus(order.shipping_status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="p-6">
                {Object.entries(groupByShop(order.order_details)).map(([shopId, details]) => (
                    <div key={shopId} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#db4444] to-[#c73e3e] rounded-lg flex items-center justify-center">
                                <Store className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">{order.shop_name || "Chưa xác định"}</h4>
                        </div>

                        <div className="space-y-3">
                            {details.map((detail) => (
                                <div
                                    key={detail.id}
                                    onClick={() => handleGoProduct(detail)}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleGoProduct(detail);
                                        }
                                    }}
                                >
                                    <div className="relative">
                                        <Image
                                            src={formatImageUrl(detail.product.image) || "/placeholder.svg"}
                                            alt={detail.product.name}
                                            width={80}
                                            height={80}
                                            className="rounded-xl border-2 border-white object-cover shadow-sm"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2">
                                            {detail.product.name}
                                        </h5>
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                <Package className="w-3 h-3" />
                                                {detail.quantity}
                                            </span>
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                {Number.parseFloat(detail.price_at_time).toLocaleString()}₫
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-bold text-[#db4444]">
                                            {Number.parseFloat(detail.subtotal).toLocaleString()}₫
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-medium">Tổng tiền:</span>
                        <div className="text-2xl font-bold text-[#db4444]">
                            {Math.floor(safeFinalAmount).toLocaleString()}₫
                        </div>

                    </div>

                    <div className="flex gap-3">
                        <button
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#db4444] to-[#c73e3e] text-white rounded-xl hover:from-[#c73e3e] hover:to-[#b83838] transition-all duration-200 font-semibold shadow-lg shadow-red-500/20"
                            onClick={() => onViewDetails(order)}
                        >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                        </button>

                        {/* Cancel Order Button */}
                        {canCancel && (
                            <button
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg shadow-red-500/20"
                                onClick={() => setShowCancelModal(true)}
                            >
                                <XCircle className="w-4 h-4" />
                                Hủy đơn
                            </button>
                        )}

                        {order.order_status === "Delivered" &&
                            (order.order_details.every((detail) => detail.reviewed) ? (
                                <div className="inline-flex items-center gap-2 text-emerald-600 font-semibold px-4 py-3">
                                    <CheckCircle className="w-4 h-4" />
                                    Đã đánh giá
                                </div>
                            ) : (
                                <button
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/20"
                                    onClick={() => setShowReview(true)}
                                >
                                    <Star className="w-4 h-4" />
                                    Đánh giá
                                </button>
                            ))}

                        {/* Refund Button - Chỉ hiện khi có thể hoàn đơn */}
                        {/* Nếu đủ điều kiện hoàn đơn */}
                        {order.order_status === "Delivered" && canRefund && (
                            <button
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition font-semibold"
                                onClick={onClickRefund}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Hoàn đơn
                            </button>
                        )}

                        {/* Nếu đã bị từ chối hoàn đơn */}
                        {(order.order_status === "Return Rejected" || order.refund_status === "Rejected")
                            && !reportedOrderIds.includes(Number(order.id))
 && (
                                <button
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#db4444] hover:bg-[#c73e3e] text-white rounded-xl transition font-semibold shadow-md"
                                    onClick={onClickReport}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Tố cáo shop
                                </button>
                            )}








                        {order.order_status === "Canceled" && (
                            <button
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/20"
                                onClick={() => handleReorder(order)}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Đặt lại
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {addToCartSuccess && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-emerald-600 text-sm px-6 py-4 rounded-xl shadow-2xl border border-emerald-200 animate-slideInFade">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Đã thêm vào giỏ hàng!</span>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ReviewModal order={order} isVisible={showReview} onClose={() => setShowReview(false)} />

            <CancelOrderModal
                isVisible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelOrder}
                isCancelling={isCancelling}
                orderId={order.id}
            />

            {/* Popup Notification */}
        {popup && (
  <div
    className={`fixed top-[140px] right-5 z-[9999] text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade ${
      popup.type === "success"
        ? "bg-green-100 text-green-800 border-green-500"
        : "bg-red-100 text-red-800 border-red-500"
    }`}
  >
    {popup.message}
  </div>
)}


        </div>
    )
}
