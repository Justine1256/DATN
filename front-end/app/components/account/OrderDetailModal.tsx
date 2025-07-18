import Image from "next/image";
import { Order, OrderStatus } from "../../../types/oder";
import { formatImageUrl, translateOrderStatus } from "../../../types/utils";

interface OrderDetailModalProps {
    order: Order | null;
    isVisible: boolean;
    onClose: () => void;
    onShowConfirmCancel: (orderId: number) => void;
    isCancelling: boolean;
}
const getStatusColor = (status: string) => {
    const cleanStatus = status?.toString().trim();

    switch (cleanStatus) {
        case "Pending":
        case "order confirmation":
            return "bg-yellow-100 text-yellow-800";
        case "Shipped":
            return "bg-blue-100 text-blue-800";
        case "Delivered":
            return "bg-green-100 text-green-800";
        case "Canceled":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-200 text-gray-800";
    }
};

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
                                                    {detail.product ? (
                                                        <Image
                                                            src={formatImageUrl(detail.product.image)}
                                                            alt={detail.product.name}
                                                            width={60}
                                                            height={60}
                                                            className="rounded-md border border-gray-200 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-[60px] h-[60px] bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 border">
                                                            Không có ảnh
                                                        </div>
                                                    )}

                                                    <div className="ml-3 max-w-[200px]">
                                                        <div
                                                            className="text-sm font-medium text-gray-900 truncate"
                                                            title={detail.product?.name || "Sản phẩm không xác định"}

                                                        >
                                                            {detail.product?.name || "Sản phẩm đã bị xoá"}

                                                        </div>
                                                        {detail.product?.description ? (
                                                            <div
                                                                className="text-xs text-gray-500 truncate"
                                                                title={detail.product.description}
                                                            >
                                                                {detail.product.description}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400">Không có mô tả</div>
                                                        )}

                                                    </div>
                                                </div>
                                            </td>
                                           <td className="px-4 py-4">
  <div className="text-sm text-gray-900 flex flex-col gap-1">
    {detail.product_value
      ? detail.product_value.split(' - ').map((v, i) => (
          <div
            key={i}
            className={`inline-block text-xs px-2 py-1 rounded-full 
              ${i === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
          >
            {v}
          </div>
        ))
      : (
        <div className="text-xs text-gray-400">Không có biến thể</div>
      )
    }
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
                                                        {/* Lấy tên cửa hàng từ order.shop_name */}
                                                        {order.shop_name ? `Cửa hàng ${order.shop_name}` : 'Không rõ cửa hàng'}
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
                        {(order.order_status === "Pending" || order.order_status === "order confirmation") && (

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