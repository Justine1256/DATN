import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/utils/api";
import Image from "next/image";

const statusLabel = {
    Pending: "Đang chờ xử lý",
    "order confirmation": "Đã xác nhận",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Canceled: "Đã hủy"
} as const;

const shippingStatusLabel = {
    Pending: "Chờ xử lý",
    Shipping: "Đang giao",
    Delivered: "Đã giao"
} as const;

async function getOrder(id: string, token: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/order/${id}`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (!res.ok) throw new Error("HTTP error");
        const data = await res.json();
        return data?.order;
    } catch (err) {
        console.error("❌ Lỗi getOrder:", err);
        return null;
    }
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    
    if (!token) {
        console.error("Không tìm thấy token");
        return notFound();
    }

    const order = await getOrder(params.id, token);

    if (!order || !order.id) {
        console.error("Không tìm thấy đơn hàng");
        return notFound();
    }

    return (
        <div className="p-10 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
                Chi tiết đơn hàng #{order.id}
            </h1>

            <div className="bg-white p-6 rounded-xl shadow border space-y-4 mb-8">
                <p><strong>Ngày đặt:</strong> {order.created_at}</p>
                <p><strong>Địa chỉ giao:</strong> {order.shipping_address}</p>
                <p><strong>Phương thức thanh toán:</strong> {order.payment_method}</p>
                <p><strong>Trạng thái thanh toán:</strong> {order.payment_status}</p>
                <p><strong>Trạng thái đơn hàng:</strong> {statusLabel[order.order_status as keyof typeof statusLabel]}</p>
                <p><strong>Trạng thái giao hàng:</strong> {shippingStatusLabel[order.shipping_status as keyof typeof shippingStatusLabel]}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border">
                <h2 className="text-xl font-semibold mb-4">Danh sách sản phẩm</h2>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-left">Sản phẩm</th>
                            <th className="p-3 text-left">Biến thể</th>
                            <th className="p-3 text-center">Giá</th>
                            <th className="p-3 text-center">SL</th>
                            <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.products.map((product: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 flex items-center gap-3">
                                    <Image
                                        src={product.image || "/default-product.png"}
                                        alt={product.name || "Sản phẩm"}
                                        width={50}
                                        height={50}
                                        className="rounded border object-cover"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-800">{product.name ?? "Không rõ tên"}</div>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-600">
                                    {product.value1 || product.value2
                                        ? `${product.value1 ?? ""} ${product.value2 ?? ""}`.trim()
                                        : "—"}
                                </td>
                                <td className="p-3 text-center">
                                    {parseFloat(product.price_at_time).toLocaleString()} đ
                                </td>
                                <td className="p-3 text-center">{product.quantity}</td>
                                <td className="p-3 text-right font-semibold text-red-600">
                                    {parseFloat(product.subtotal).toLocaleString()} đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Tổng tiền ở dưới */}
                <div className="flex justify-end mt-6">
                    <div className="text-lg font-semibold text-gray-700">
                        Tổng cộng: <span className="text-2xl font-bold text-red-600">{Number(order.final_amount).toLocaleString("vi-VN")} đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
