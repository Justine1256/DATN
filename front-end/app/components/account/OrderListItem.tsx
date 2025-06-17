import { useState } from "react";
import Image from "next/image";
import { Order, OrderStatus } from "../../../types/oder";
import { formatImageUrl, statusColors, translateOrderStatus, groupByShop } from "../../../types/utils";

interface OrderListItemProps {
    order: Order;
    onViewDetails: (order: Order) => void;
    onReorder: (order: Order) => void;
}

export default function OrderListItem({
    order,
    onViewDetails,
    onReorder,
}: OrderListItemProps) {
    const [addToCartSuccess, setAddToCartSuccess] = useState(false);

    const handleReorder = (order: Order) => {
        if (order.order_status.toLowerCase() === "canceled") {
            onReorder(order);  // Thực hiện đặt lại ngay lập tức
            setAddToCartSuccess(true);  // Hiển thị thông báo thành công
            setTimeout(() => {
                setAddToCartSuccess(false);
                // Sau khi hoàn tất, chuyển hướng đến trang giỏ hàng (nếu cần)
                window.location.href = "/checkout"; // Chuyển hướng bằng JavaScript
            }, 1500);
        } else {
            alert("Đơn hàng này không thể đặt lại.");
        }
    };

    return (
        <div className="border rounded-lg p-6 shadow-lg bg-white hover:shadow-xl transition-shadow">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-black">Mã đơn hàng: #{order.id}</h3>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${Object.values(OrderStatus).includes(order.order_status as OrderStatus) // Kiểm tra nếu trạng thái hợp lệ
                                    ? statusColors[order.order_status as OrderStatus]
                                    : 'bg-gray-200 text-gray-800'
                                }`}
                        >
                            {translateOrderStatus(order.order_status as OrderStatus)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs font-medium">Ngày đặt</span>
                            <span className="font-semibold text-black">
                                {new Date(order.created_at).toLocaleDateString("vi-VN")}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs font-medium">Trạng thái</span>
                            <span
                                className={`font-semibold text-black ${statusColors[order.order_status as OrderStatus]}`}
                            >
                                {translateOrderStatus(order.order_status as OrderStatus)}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs font-medium">Thanh toán</span>
                            <span className="font-semibold text-black">{order.payment_method}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs font-medium">Giao hàng</span>
                            <span className="font-semibold text-black">{order.shipping_status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products by Shop */}
            {Object.entries(groupByShop(order.order_details)).map(([shopId, details]) => (
                <div key={shopId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-6 bg-[#db4444] rounded-full"></div>
                        <h4 className="font-semibold text-black text-lg">Cửa hàng #{shopId}</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-4">
                            {details.map((detail) => (
                                <div key={detail.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <Image
                                            src={formatImageUrl(detail.product.image)}
                                            alt={detail.product.name}
                                            width={80}
                                            height={80}
                                            className="rounded-lg border border-gray-200 object-cover"
                                        />
                                        <div className="flex flex-col flex-1">
                                            <h5 className="font-medium text-black text-base mb-2">{detail.product.name}</h5>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    Số lượng: {detail.quantity}
                                                </span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {parseFloat(detail.price_at_time).toLocaleString()} ₫/sp
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-red-600">
                                            {parseFloat(detail.subtotal).toLocaleString()}₫
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <div className="text-2xl font-bold text-red-600">
                        {parseFloat(order.final_amount).toLocaleString()}₫
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-6 py-2 bg-[#db4444] text-white rounded-lg hover:bg-[#c13838] transition-colors font-medium"
                        onClick={() => onViewDetails(order)}
                    >
                        Xem chi tiết
                    </button>
                    {order.order_status.toLowerCase() === "canceled" && (
                        <button
                            className="px-6 py-2 bg-[#db4444] text-white rounded-lg hover:bg-[#c13838] transition-colors font-medium"
                            onClick={() => handleReorder(order)} // Tự động đặt lại đơn hàng
                        >
                            Đặt lại
                        </button>
                    )}
                </div>
            </div>

            {addToCartSuccess && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-green-500 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
                    ✔ Đã thêm vào giỏ hàng!
                </div>
            )}
        </div>
    );
}
