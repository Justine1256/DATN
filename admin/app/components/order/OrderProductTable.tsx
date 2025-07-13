"use client";
import Image from "next/image";

export default function OrderProductTable({ products }: { products: any[] }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow border mt-6">
            <h2 className="text-xl font-semibold mb-4">Sản phẩm</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-3 text-left">Tên sản phẩm & Kích thước</th>
                            <th className="p-3 text-center">Trạng thái</th>
                            <th className="p-3 text-center">Số lượng</th>
                            <th className="p-3 text-right">Giá</th>
                            <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 flex items-center gap-3">
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_STATIC_URL}/${p.image}`}
                                        alt={p.name}
                                        width={48}
                                        height={48}
                                        className="rounded border object-cover bg-gray-100"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-800">{p.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {p.value1 || p.value2 ? `Kích thước: ${p.value1 ?? ""} ${p.value2 ?? ""}`.trim() : ""}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${p.status === "Ready" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                        {p.status === "Ready" ? "Sẵn sàng" : "Bao bì"}
                                    </span>
                                </td>
                                <td className="p-3 text-center">{p.quantity}</td>
                                <td className="p-3 text-right">{parseFloat(p.price_at_time ?? p.subtotal).toLocaleString("vi-VN")} đ</td>
                                <td className="p-3 text-right font-semibold text-gray-800">
                                    {parseFloat(p.subtotal).toLocaleString("vi-VN")} đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
