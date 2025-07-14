"use client";

import type { Order } from "../../ts/oder";
type Shop = {
    name: string;
    phone: string;
    email: string;
};

export default function OrderInvoice({
    order,
    shop
}: {
    order: Order;
    shop: Shop;
}) {
    const totalAmount = order.products.reduce(
        (acc: number, p) => acc + parseInt(p.subtotal),
        0
    );

    return (
        <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-200 rounded-xl shadow space-y-6 text-sm">
            <div className="bg-[#db4444] text-white p-4 rounded-t-xl text-center">
                <h1 className="text-lg font-bold">{shop.name}</h1>
                <div className="text-xs">#{order.id} | {new Date(order.created_at).toLocaleDateString()}</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h2 className="font-bold text-gray-800 mb-1">HÓA ĐƠN CHO:</h2>
                    <div className="text-gray-700">{order.buyer.name}</div>
                    <div className="text-gray-700">{order.buyer.phone}</div>
                    <div className="text-gray-700">{order.buyer.email}</div>
                </div>
                <div>
                    <h2 className="font-bold text-gray-800 mb-1">THANH TOÁN CHO:</h2>
                    <div className="text-gray-700">{shop.name}</div>
                    <div className="text-gray-700">{shop.phone}</div>
                    <div className="text-gray-700">{shop.email}</div>
                </div>
            </div>

            <table className="w-full mt-6 text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="text-left py-3 px-2">MÔ TẢ</th>
                        <th className="text-center py-3 px-2 w-20">SL</th>
                        <th className="text-center py-3 px-2 w-24">ĐƠN GIÁ</th>
                        <th className="text-right py-3 px-2 w-28">THÀNH TIỀN</th>
                    </tr>
                </thead>
                <tbody>
                    {order.products.map((product, index) => (
                        <tr key={product.id || index} className="border-b ">
                            <td className="py-2">{product.name}</td>
                            <td className="py-2 text-center">{product.quantity}</td>
                            <td className="py-2 text-center">
                                {parseInt(product.price_at_time).toLocaleString()} ₫
                            </td>
                            <td className="py-2 text-right font-semibold">
                                {parseInt(product.subtotal).toLocaleString()} ₫
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-50 border-t border-[#db4444]">
                        <td colSpan={3} className="py-4 pr-4 text-right font-semibold text-gray-800">
                            Tổng cộng:
                        </td>
                        <td className="py-4 text-right font-bold text-[#db4444]">
                            {totalAmount.toLocaleString()} ₫
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div className="flex justify-end text-xs text-gray-600 pt-8">
                <div className="space-y-2 text-right">
                    <div>Khách hàng ký & ghi rõ họ tên</div>
                    <div className="font-bold text-gray-800">{order.buyer.name}</div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-500 pt-6 border-t">
                Cảm ơn quý khách đã mua hàng!<br />
                Hàng đã bán không đổi trả (trừ lỗi từ nhà sản xuất)
            </div>
        </div>
    );
}
