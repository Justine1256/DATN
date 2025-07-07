import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "../../../types/oder";
import OrderFilterTabs from "./OrderFilterTabs";
import OrderListItem from "./OrderListItem";
import OrderDetailModal from "./OrderDetailModal";
import ConfirmCancelModal from "./ConfirmCancelModal";

export default function OrderSection() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false);
  const [orderToCancelId, setOrderToCancelId] = useState<number | null>(null);

  const token = Cookies.get("authToken");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];
      setOrders(data);

      filterOrders(activeTab, data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Khi đổi tab, re-filter theo danh sách hiện tại
  useEffect(() => {
    filterOrders(activeTab, orders);
  }, [activeTab, orders]);

  const filterOrders = (status: string, sourceOrders?: Order[]) => {
    const list = sourceOrders || orders;
    setActiveTab(status);

    if (status === "all") {
      setFilteredOrders(list);
    } else if (status === "processing") {
      const filtered = list.filter(order =>
        order.order_status === "Pending" || order.order_status === "order confirmation"
      );
      setFilteredOrders(filtered);
    } else if (status === "shipping") {
      const filtered = list.filter(order => order.order_status === "Shipped");
      setFilteredOrders(filtered);
    } else if (status === "delivered") {
      const filtered = list.filter(order => order.order_status === "Delivered");
      setFilteredOrders(filtered);
    } else if (status === "canceled") {
      const filtered = list.filter(order => order.order_status === "Canceled");
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders([]);
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedOrder(null);
  };

  const handleShowConfirmCancel = (orderId: number) => {
    setOrderToCancelId(orderId);
    setShowConfirmCancelPopup(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancelId || isCancelling) return;

    setIsCancelling(true);
    setShowConfirmCancelPopup(false);

    try {
      await axios.patch(
        `${API_BASE_URL}/cancel/${orderToCancelId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(prev =>
        prev.map(order =>
          order.id === orderToCancelId
            ? { ...order, order_status: OrderStatus.Canceled }
            : order
        )
      );

      setSelectedOrder(prev =>
        prev ? { ...prev, order_status: OrderStatus.Canceled } : null
      );
    } catch (err) {
      console.error("❌ Hủy đơn hàng thất bại:", err);
    } finally {
      setIsCancelling(false);
      setOrderToCancelId(null);
    }
  };

  const handleReorder = async (order: Order) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/reorder/${order.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(response.data.redirect_url);
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-brand mb-4 text-center">
          Đơn mua của tôi
        </h2>

        <OrderFilterTabs activeTab={activeTab} onFilterChange={filterOrders} />

        {loading ? (
          <p className="text-center text-gray-500">Đang tải đơn hàng...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-md">
            <p className="text-lg text-gray-500">Không có đơn hàng phù hợp.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderListItem
                key={order.id}
                order={order}
                onViewDetails={handleViewOrderDetails}
                onReorder={handleReorder}
              />
            ))}
          </div>
        )}
      </div>

      {popupVisible && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isVisible={popupVisible}
          onClose={closePopup}
          onShowConfirmCancel={handleShowConfirmCancel}
          isCancelling={isCancelling}
        />
      )}

      {showConfirmCancelPopup && (
        <ConfirmCancelModal
          isVisible={showConfirmCancelPopup}
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowConfirmCancelPopup(false)}
          isCancelling={isCancelling}
        />
      )}
    </div>
  );
}
