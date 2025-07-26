import React from 'react';
import OrderActions from './OrderActions'; // Import OrderActions component

interface Order {
    id: number;
    status: string;
    customer: string;
    createdAt: string;
    refundStatus: string;
}

interface OrderTableProps {
    orders: Order[];
    loading: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, loading }) => {
    // Các hàm xử lý cho các hành động
    const handleRefundRequest = (orderId: number) => {
        console.log(`Request refund for order ${orderId}`);
        // Gọi API hoàn đơn ở đây
    };

    const handleRefundApprove = (orderId: number) => {
        console.log(`Approve refund for order ${orderId}`);
        // Gọi API duyệt hoàn đơn ở đây
    };

    const handleRefundReject = (orderId: number) => {
        console.log(`Reject refund for order ${orderId}`);
        // Gọi API từ chối hoàn đơn ở đây
    };

    const handleCancelOrder = (orderId: number) => {
        console.log(`Cancel order ${orderId}`);
        // Gọi API hủy đơn ở đây
    };

    if (loading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <table className="min-w-full table-auto">
            <thead>
                <tr>
                    <th>ID Đơn hàng</th>
                    <th>Trạng thái</th>
                    <th>Khách hàng</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.status}</td>
                        <td>{order.customer}</td>
                        <td>{order.createdAt}</td>
                        <td>
                            {/* Gán các hàm xử lý vào OrderActions */}
                            <OrderActions
                                orderId={order.id}
                                onRefundRequest={handleRefundRequest}
                                onRefundApprove={handleRefundApprove}
                                onRefundReject={handleRefundReject}
                                onCancelOrder={handleCancelOrder}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default OrderTable;
