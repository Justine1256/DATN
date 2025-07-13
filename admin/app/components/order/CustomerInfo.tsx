import { Mail, Phone, MapPin } from "lucide-react";

export default function CustomerInfo({ order }: { order: any }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
            <div className="flex items-center gap-3 mb-4">
                <img
                    src={order.buyer.avatar}
                    alt={order.buyer.name}
                    className="w-12 h-12 rounded-full object-cover bg-gray-100"
                />
                <div>
                    <div className="font-medium text-gray-900">{order.buyer.name}</div>
                    <div className="text-sm text-gray-500">Hạng {order.buyer.rank}</div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-blue-600">{order.buyer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.buyer.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm mt-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{order.shipping_address}</span>
                </div>
            </div>
        </div>
    );
}
