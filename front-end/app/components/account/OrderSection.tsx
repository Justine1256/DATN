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

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 3;
  const totalPages = Math.ceil(filteredOrders.length / perPage);

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

  useEffect(() => {
    filterOrders(activeTab, orders);
  }, [activeTab, orders]);

  const filterOrders = (status: string, sourceOrders?: Order[]) => {
    const list = sourceOrders || orders;
    setActiveTab(status);

    let filtered: Order[] = [];
    if (status === "all") filtered = list;
    else if (status === "processing") filtered = list.filter(o => o.order_status === "Pending" || o.order_status === "order confirmation");
    else if (status === "shipping") filtered = list.filter(o => o.order_status === "Shipped");
    else if (status === "delivered") filtered = list.filter(o => o.order_status === "Delivered");
    else if (status === "canceled") filtered = list.filter(o => o.order_status === "Canceled");

    setFilteredOrders(filtered);
    setCurrentPage(1); // reset trang khi filter
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

  // lấy danh sách phân trang
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

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
          <>
            <div className="space-y-4">
              {currentOrders.map((order) => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewOrderDetails}
                  onReorder={handleReorder}
                />
              ))}
            </div>

            {/* Phân trang */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-xl text-gray-600 hover:bg-[#db4444] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    «
                  </button>

                  <span className="text-sm text-gray-500">
                    Trang <span className="font-semibold text-gray-700">{currentPage}</span> / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-xl text-gray-600 hover:bg-[#db4444] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                </div>

          </>
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