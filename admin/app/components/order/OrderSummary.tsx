export default function OrderSummary({ order }: { order: any }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền hàng:</span>
                    <span>{Number(order.final_amount).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span>0 đ</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Thuế:</span>
                    <span>0 đ</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span>0 đ</span>
                </div>
                <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Tổng cộng:</span>
                        <span className="text-red-600">{Number(order.final_amount).toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
