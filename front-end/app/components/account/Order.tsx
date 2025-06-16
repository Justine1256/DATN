import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { useRouter } from 'next/navigation';

// **Các component được sử dụng**
import { Order } from "../../../types/oder";
import OrderFilterTabs from "./OrderFilterTabs";
import OrderListItem from "./OrderListItem";
import OrderDetailModal from "./OrderDetailModal";
import ConfirmCancelModal from "./ConfirmCancelModal";

// OrderSection.tsx

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

  const token = Cookies.get("authToken");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];
      setOrders(data);
      if (activeTab === "all") {
        setFilteredOrders(data);
      } else {
        setFilteredOrders(data.filter(order => order.order_status.toLowerCase() === activeTab));
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
      setNotificationMessage("Lỗi khi tải đơn hàng. Vui lòng thử lại.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
        prevOrders.map((order) => order.id === orderToCancelId ? { ...order, order_status: "canceled" } : order)
      );
      setFilteredOrders((prevFilteredOrders) =>
        prevFilteredOrders.map((order) => order.id === orderToCancelId ? { ...order, order_status: "canceled" } : order)
      );

      if (selectedOrder && selectedOrder.id === orderToCancelId) {
        setSelectedOrder((prevSelected) =>
          prevSelected ? { ...prevSelected, order_status: "canceled" } : null
        );
      }

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

  const handleReorder = async (order: Order) => {
    const token = localStorage.getItem('authToken') || Cookies.get('authToken');

    // Kiểm tra xem token có hợp lệ không
    if (!token) {
      console.error("User is not authenticated.");
      return; // Nếu không có token, không thực hiện yêu cầu API
    }

    try {
      // Gửi yêu cầu tái tạo đơn hàng
      const response = await axios.post(
        `http://localhost:8000/api/reorder/${order.id}`,
        {}, // Nếu API không yêu cầu body, có thể để trống
        {
          headers: { Authorization: `Bearer ${token}` }, // Gửi token xác thực
        }
      );

      // Kiểm tra phản hồi từ API
      if (response.status === 200) {
        // Kiểm tra xem API có trả về thông tin thành công không
        if (response.data.success) {
          console.log("Đặt lại đơn hàng thành công!");
          router.push(`/checkout?orderId=${order.id}`); // Chuyển hướng người dùng đến trang checkout
        } else {
          console.error("Lỗi khi tái tạo đơn hàng:", response.data.message);
          alert(response.data.message || "Có lỗi khi tạo lại đơn hàng.");
        }
      } else {
        // Xử lý khi status code không phải 200
        console.error(`Lỗi API: ${response.statusText}`);
        alert(`Có lỗi trong quá trình tái tạo đơn hàng: ${response.statusText}`);
      }
    } catch (error) {
      // Nếu có lỗi khi gửi yêu cầu hoặc phản hồi không hợp lệ
      console.error("Có lỗi khi gửi yêu cầu tái tạo đơn hàng:", error);

      // Kiểm tra chi tiết lỗi
      if (error.response) {
        // Lỗi khi có phản hồi từ API
        console.error("Lỗi phản hồi API:", error.response.data);
        alert(`Lỗi: ${error.response.data.message || "Không thể tái tạo đơn hàng."}`);
      } else if (error.request) {
        // Lỗi không nhận được phản hồi từ API
        console.error("Không nhận được phản hồi từ API:", error.request);
        alert("Lỗi kết nối, vui lòng thử lại.");
      } else {
        // Lỗi khác
        console.error("Lỗi khác:", error.message);
        alert("Đã có lỗi, vui lòng thử lại.");
      }
    }
  };
  
  
  

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-10 px-4">
      {/* Popup thông báo */}
      {showNotification && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {notificationMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-[#db4444] mb-4 text-center">
          Đơn mua của tôi
        </h2>

        {/* Lọc đơn hàng */}
        <OrderFilterTabs activeTab={activeTab} onFilterChange={filterOrders} />

        {/* Danh sách đơn hàng */}
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
                  onReorder={handleReorder} // Truyền hàm reorder
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
