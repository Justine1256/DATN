"use client";
import Image from "next/image";
import { STATIC_BASE_URL } from "@/utils/api";

type Product = {
    id: number;
    image: string | string[];
    name: string;
    price_at_time: string;
    quantity: number;
    subtotal: string;
};

export default function ProductListTable({
    products,
    shippingStatus,
}: {
    products: Product[];
    shippingStatus: "Pending" | "Shipping" | "Delivered" | "Failed";
}) {
    const shippingConfig = {
        Pending: { label: "Chờ giao", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
        Shipping: { label: "Đang giao", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        Delivered: { label: "Đã giao", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
        Failed: { label: "Giao thất bại", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
    } as const;

    const getImageUrls = (input: string | string[], baseUrl = STATIC_BASE_URL) => {
        if (!input) return [];
        if (typeof input === "string") {
            if (input.includes(",")) {
                return input.split(",").map(img => `${baseUrl}/${img.trim()}`);
            }
            return [`${baseUrl}/${input.trim()}`];
        }
        return input.map(img => `${baseUrl}/${img.trim()}`);
    };

    // ✅ Tính tổng
    const totalAmount = products.reduce((acc, p) => acc + parseInt(p.subtotal), 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-full">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-3 px-3 text-left font-semibold text-gray-700 w-[30%]">Sản phẩm</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700 w-[10%]">Số lượng</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700 w-[15%]">Giá</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700 w-[15%]">Tổng</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700 w-[15%]">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => {
                        const imageUrls = getImageUrls(product.image);
                        return (
                            <tr key={product.id} className="border-b border-gray-50 hover:bg-[#fff3f3] transition-colors">
                                <td className="py-3 px-3 flex items-center space-x-3 truncate">
                                    <Image
                                        src={imageUrls[0] || "/placeholder.png"}
                                        alt={product.name}
                                        width={45}
                                        height={45}
                                        className="rounded border border-gray-200"
                                    />
                                    <div className="truncate">
                                        <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                                        <div className="text-xs text-gray-500">ID: {product.id}</div>
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-center font-medium text-gray-900">{product.quantity}</td>
                                <td className="py-3 px-3 text-center text-gray-900">
                                    {parseInt(product.price_at_time).toLocaleString()} ₫
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-gray-900">
                                    {parseInt(product.subtotal).toLocaleString()} ₫
                                </td>
                                <td className="py-3 px-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                                      ${shippingConfig[shippingStatus]?.bg}
                                      ${shippingConfig[shippingStatus]?.text}
                                      ${shippingConfig[shippingStatus]?.border}`}>
                                        {shippingConfig[shippingStatus]?.label}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="border-t bg-gray-50">
                        <td colSpan={3}></td>
                        <td className="py-4 px-3 text-right font-semibold text-gray-900">Tổng cộng:</td>
                        <td className="py-4 px-3 text-center font-bold text-[#db4444]">
                            {totalAmount.toLocaleString()} ₫
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
