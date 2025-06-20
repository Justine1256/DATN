import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "../../../types/oder"; // Đảm bảo Order được khai báo đúng
import OrderFilterTabs from "./OrderFilterTabs";
import OrderListItem from "./OrderListItem";
import OrderDetailModal from "./OrderDetailModal";
import ConfirmCancelModal from "./ConfirmCancelModal";

export default function OrderSection() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);  // Khai báo kiểu dữ liệu là Order
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]); // Khai báo kiểu dữ liệu là Order
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // Thêm | null
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false);
  const [orderToCancelId, setOrderToCancelId] = useState<number | null>(null);
  

  const token = Cookies.get("authToken"); // Lấy token từ Cookies một lần

  const fetchOrders = async () => {
    setLoading(true); // Bắt đầu loading
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];
      console.log("Fetched orders:", data);
      setOrders(data); // Lưu vào state orders
      if (activeTab === "all") {
        setFilteredOrders(data); // Nếu tab hiện tại là "all", lọc theo tất cả đơn hàng
      } else {
        // Lọc theo trạng thái đơn hàng
        const filteredData = data.filter((order: Order) => order.order_status.toLowerCase() === activeTab); // Khai báo kiểu cho order
        setFilteredOrders(filteredData);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const filterOrders = (status: string) => {
    setActiveTab(status);
    if (status === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order: Order) => order.order_status.toLowerCase() === status  // Khai báo kiểu cho order
      );
      setFilteredOrders(filtered);
    }
  };

  const handleViewOrderDetails = (order: Order) => { // Thêm kiểu Order cho tham số
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderToCancelId
            ? { ...order, order_status: OrderStatus.Canceled } // Dùng OrderStatus enum
            : order
        )
      );

      setFilteredOrders((prevFilteredOrders) =>
        prevFilteredOrders.map((order) =>
          order.id === orderToCancelId
            ? { ...order, order_status: OrderStatus.Canceled } // Dùng OrderStatus enum
            : order
        )
      );

      setSelectedOrder((prevSelected) =>
        prevSelected ? { ...prevSelected, order_status: OrderStatus.Canceled } : null
      );
    } catch (err) {
      console.error("❌ Hủy đơn hàng thất bại:", err);
    } finally {
      setIsCancelling(false);
      setOrderToCancelId(null);
    }
  };

  // Đặt lại đơn hàng và thêm vào giỏ hàng
  const handleReorder = async (order: Order) => { 
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/reorder/${order.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

    router.push(response.data.redirect_url);
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto  px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-[#db4444] mb-4 text-center">
          Đơn mua của tôi
        </h2>

        {/* Order filter tabs */}
        <OrderFilterTabs activeTab={activeTab} onFilterChange={filterOrders} />

        {/* Loading state */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải đơn hàng...</p>
        ) : filteredOrders.length === 0 ? (
          // Empty state when no orders match the filter
          <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-md">
            <p className="text-lg text-gray-500">Không có đơn hàng phù hợp.</p>
          </div>
        ) : (
          // Display filtered orders
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => ( // Added type `Order` for better typing
              <div key={order.id}>
                <OrderListItem
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewOrderDetails}
                  onReorder={handleReorder}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for order details */}
      {popupVisible && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isVisible={popupVisible}
          onClose={closePopup}
          onShowConfirmCancel={handleShowConfirmCancel}
          isCancelling={isCancelling}
        />
      )}

      {/* Popup for confirming order cancellation */}
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
