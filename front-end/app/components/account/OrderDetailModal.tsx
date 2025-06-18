import Image from "next/image";
import { Order, OrderStatus } from "../../../types/oder";
import { formatImageUrl, translateOrderStatus, statusColors } from "../../../types/utils";

interface OrderDetailModalProps {
    order: Order | null;
    isVisible: boolean;
    onClose: () => void;
    onShowConfirmCancel: (orderId: number) => void;
    isCancelling: boolean;
}

export default function OrderDetailModal({
    order,
    isVisible,
    onClose,
    onShowConfirmCancel,
    isCancelling,
}: OrderDetailModalProps) {
    if (!isVisible || !order) return null;

    console.log("Trạng thái đơn hàng: ", order.order_status);
    console.log("Trạng thái giao hàng: ", order.shipping_status);

    // Hàm lấy màu trạng thái với xử lý case-insensitive (giống code thứ 2)
    const getStatusColor = (status: string) => {
        const cleanStatus = status?.toString().trim().toLowerCase();

        const matchingKey = Object.keys(statusColors).find(
            key => key.toLowerCase() === cleanStatus
        );

        if (matchingKey) {
            const color = statusColors[matchingKey as OrderStatus];
            return color;
        }

        return 'bg-gray-200 text-gray-800'; // Default color
    };
    

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-hidden">
            <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#db4444] to-[#c13838]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">
                            Chi tiết đơn hàng #{order.id}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                Thông tin đơn hàng
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày đặt:</span>
                                    <span className="font-medium text-black">
                                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Trạng thái:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                        {translateOrderStatus(order.order_status as OrderStatus)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thanh toán:</span>
                                    <span className="font-medium text-black">
                                        {order.payment_method}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                Địa chỉ giao hàng
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {order.shipping_address}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800">
                                Danh sách sản phẩm
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thông tin
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đơn giá
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số lượng
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cửa hàng
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.order_details.map((detail, index) => (
                                        <tr
                                            key={detail.id}
                                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Image
                                                        src={formatImageUrl(detail.product.image)}
                                                        alt={detail.product.name}
                                                        width={60}
                                                        height={60}
                                                        className="rounded-md border border-gray-200 object-cover"
                                                    />
                                                    <div className="ml-3 max-w-[200px]">
                                                        <div
                                                            className="text-sm font-medium text-gray-900 truncate"
                                                            title={detail.product.name}
                                                        >
                                                            {detail.product.name}
                                                        </div>
                                                        {detail.product.description && (
                                                            <div
                                                                className="text-xs text-gray-500 truncate"
                                                                title={detail.product.description}
                                                            >
                                                                {detail.product.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {detail.product.value1 ? (
                                                        <div className="mb-1">
                                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                                {detail.product.value1}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-400">Không có giá trị 1</div>
                                                    )}

                                                    {detail.product.value2 ? (
                                                        <div>
                                                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                                {detail.product.value2}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-400">Không có giá trị 2</div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {parseFloat(detail.price_at_time).toLocaleString()}₫
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {detail.quantity}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                                                    Cửa hàng #{detail.product.shop_id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-sm font-bold text-red-600">
                                                    {parseFloat(detail.subtotal).toLocaleString()}₫
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border">
                        <div className="flex justify-between items-center">
                            <div className="text-lg font-semibold text-gray-700">
                                Tổng cộng đơn hàng:
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                {parseFloat(order.final_amount).toLocaleString()}₫
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end gap-4">
                        {order.order_status.toLowerCase() !== "canceled" && (
                            <button
                                className={`px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium ${isCancelling ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => onShowConfirmCancel(order.id)}
                                disabled={isCancelling}
                            >
                                Hủy đơn
                            </button>
                        )}
                        <button
                            className="px-6 py-3 bg-[#db4444] text-white rounded-lg hover:bg-[#c13838] transition-colors font-medium"
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