interface ConfirmCancelModalProps {
    isVisible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isCancelling: boolean;
}

export default function ConfirmCancelModal({
    isVisible,
    onConfirm,
    onCancel,
    isCancelling,
}: ConfirmCancelModalProps) {
    if (!isVisible) return null; // Không hiển thị modal nếu isVisible là false

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Xác nhận hủy đơn hàng
                </h3>
                <p className="text-gray-600 mb-6">
                    Bạn có chắc chắn muốn hủy đơn hàng này không? <br />
                    Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-center gap-4">
                    {/* Nút "Không" */}
                    <button
                        onClick={onCancel} // Gọi hàm onCancel khi nhấn "Không"
                        className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        disabled={isCancelling} // Vô hiệu hóa khi đang hủy
                    >
                        Không
                    </button>
                    {/* Nút "Có, hủy đơn" */}
                    <button
                        onClick={onConfirm} // Gọi hàm onConfirm khi nhấn "Có, hủy đơn"
                        className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium ${isCancelling ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isCancelling} // Vô hiệu hóa khi đang hủy
                    >
                        {isCancelling ? "Đang xử lý..." : "Có, hủy đơn"} {/* Thay đổi nội dung khi hủy */}
                    </button>
                </div>
            </div>
        </div>
    );
}
