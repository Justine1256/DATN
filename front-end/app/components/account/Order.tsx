import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";

// Các component được sử dụng

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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false);
  const [orderToCancelId, setOrderToCancelId] = useState<number | null>(null);

  // Chỉ còn state cho thông báo thành công khi thêm vào giỏ hàng
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

  const token = Cookies.get("authToken"); // Lấy token từ Cookies một lần

  const fetchOrders = async () => {
    setLoading(true); // Bắt đầu loading
    console.log('Đang tải đơn hàng...');
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Kiểm tra dữ liệu trả về
      console.log('Dữ liệu trả về từ API:', res.data);

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];

      // Log dữ liệu đã được xử lý
      console.log('Danh sách đơn hàng đã xử lý:', data);

      setOrders(data); // Lưu vào state orders
      if (activeTab === "all") {
        setFilteredOrders(data); // Nếu tab hiện tại là "all", lọc theo tất cả đơn hàng
      } else {
        // Lọc theo trạng thái đơn hàng
        const filteredData = data.filter(order => order.order_status.toLowerCase() === activeTab);
        console.log('Danh sách đơn hàng đã lọc theo trạng thái:', filteredData);
        setFilteredOrders(filteredData);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
      setNotificationMessage("Lỗi khi tải đơn hàng. Vui lòng thử lại.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setLoading(false); // Kết thúc loading
      console.log('Kết thúc tải đơn hàng');
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
        (order) => order.order_status.toLowerCase() === status
      );
      setFilteredOrders(filtered);
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


      setNotificationMessage("Yêu cầu hủy đơn hàng đã được gửi thành công!");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
        closePopup();
      }, 1500);

    } catch (err) {
      console.error("❌ Hủy đơn hàng thất bại:", err);
      setNotificationMessage("Hủy đơn hàng thất bại. Vui lòng thử lại.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setIsCancelling(false);
      setOrderToCancelId(null);
    }
  };

  // Đặt lại đơn hàng và thêm vào giỏ hàng
  const handleReorder = async (order: Order) => {
    if (!token) {
      setNotificationMessage("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      setShowNotification(true);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/reorder/${order.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 🧹 Ẩn đơn cũ khỏi UI
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setFilteredOrders((prev) => prev.filter((o) => o.id !== order.id));

      // ✅ Điều hướng đến trang checkout
      router.push("/checkout");

    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
      setNotificationMessage("Có lỗi xảy ra, vui lòng thử lại.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };


  return (
    <div className="w-full max-w-[1400px] mx-auto mt-10 px-4">
      {/* Popup thông báo chung */}
      {showNotification && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {notificationMessage}
        </div>
      )}

      {/* Popup thành công khi thêm vào giỏ hàng (chỉ hiển thị khi addToCartSuccess là true) */}
      {addToCartSuccess && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-green-500 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
          {notificationMessage} {/* Hiển thị thông báo thành công */}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-[#db4444] mb-4 text-center">
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

      {/* Modal chi tiết đơn hàng */}
      {popupVisible && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isVisible={popupVisible}
          onClose={closePopup}
          onShowConfirmCancel={handleShowConfirmCancel}
          isCancelling={isCancelling}
        />
      )}

      {/* Popup xác nhận hủy đơn hàng */}
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
