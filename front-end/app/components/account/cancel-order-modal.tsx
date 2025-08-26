"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"

interface CancelOrderModalProps {
    isVisible: boolean
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
    isCancelling: boolean
    orderId: number
}

const CANCEL_REASONS = [
    "Đổi ý không muốn mua nữa",
    "Tìm được sản phẩm tốt hơn với giá rẻ hơn",
    "Thông tin sản phẩm không chính xác",
    "Thời gian giao hàng quá lâu",
    "Muốn thay đổi địa chỉ giao hàng",
    "Muốn thay đổi phương thức thanh toán",
    "Đặt nhầm sản phẩm",
    "Lý do khác",
]

export default function CancelOrderModal({
    isVisible,
    onClose,
    onConfirm,
    isCancelling,
    orderId,
}: CancelOrderModalProps) {
    const [selectedReason, setSelectedReason] = useState("")
    const [customReason, setCustomReason] = useState("")
    const [isCustom, setIsCustom] = useState(false)
    const [popup, setPopup] = useState<{ type: "success" | "error"; message: string } | null>(null)

    if (!isVisible) return null

    const handleReasonSelect = (reason: string) => {
        if (reason === "Lý do khác") {
            setIsCustom(true)
            setSelectedReason("")
        } else {
            setIsCustom(false)
            setSelectedReason(reason)
            setCustomReason("")
        }
    }

    const handleConfirm = async () => {
        const finalReason = isCustom ? customReason.trim() : selectedReason
        if (!finalReason) {
            setPopup({ type: "error", message: "Vui lòng chọn hoặc nhập lý do hủy đơn" })
            setTimeout(() => setPopup(null), 3000)
            return
        }

        try {
            await onConfirm(finalReason)
            setPopup({ type: "success", message: "Đơn hàng đã được hủy thành công!" })
            setTimeout(() => {
                setPopup(null)
                onClose()
            }, 2000)
        } catch (error) {
            setPopup({ type: "error", message: "Có lỗi xảy ra khi hủy đơn hàng" })
            setTimeout(() => setPopup(null), 3000)
        }
    }

    const canConfirm = isCustom ? customReason.trim().length > 0 : selectedReason.length > 0

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-xl max-w-sm w-full max-h-[80vh] shadow-2xl relative z-[10000] flex flex-col">
                    {/* Header - Fixed */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Hủy đơn hàng</h3>
                                <p className="text-xs text-gray-600">Đơn hàng #{orderId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            disabled={isCancelling}
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-3">Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này:</p>

                            <div className="space-y-2">
                                {CANCEL_REASONS.map((reason) => (
                                    <label
                                        key={reason}
                                        className={`flex items-start p-2 rounded-lg border cursor-pointer transition-colors ${(reason === "Lý do khác" && isCustom) || selectedReason === reason
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                        onClick={() => handleReasonSelect(reason)}
                                    >
                                        <input
                                            type="radio"
                                            name="cancelReason"
                                            value={reason}
                                            checked={(reason === "Lý do khác" && isCustom) || selectedReason === reason}
                                            onChange={() => handleReasonSelect(reason)}
                                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 mt-0.5 flex-shrink-0"
                                            disabled={isCancelling}
                                        />
                                        <span className="ml-2 text-xs text-gray-700 leading-relaxed">{reason}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Custom reason input */}
                            {isCustom && (
                                <div className="mt-3">
                                    <textarea
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Vui lòng nhập lý do cụ thể..."
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-xs"
                                        rows={3}
                                        maxLength={200}
                                        disabled={isCancelling}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{customReason.length}/200 ký tự</p>
                                </div>
                            )}
                        </div>

                        {/* Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-semibold mb-1">Lưu ý:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                                        <li>Đơn hàng sẽ được hủy ngay lập tức</li>
                                        <li>Nếu đã thanh toán, tiền sẽ được hoàn lại trong 3-7 ngày</li>
                                        <li>Bạn không thể hoàn tác sau khi xác nhận</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="flex gap-2 p-4 border-t border-gray-200 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                            disabled={isCancelling}
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!canConfirm || isCancelling}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${canConfirm && !isCancelling
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </button>
                    </div>
                </div>
            </div>

        </>
    )
}
