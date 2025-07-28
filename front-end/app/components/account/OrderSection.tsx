"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { API_BASE_URL } from "@/utils/api"
import { useRouter } from "next/navigation"
import type { Order } from "../../../types/oder"
import OrderFilterTabs from "./OrderFilterTabs"
import OrderListItem from "./OrderListItem"
import OrderDetailModal from "./OrderDetailModal"
import RefundRequestModal from "./refund-request-modal"
import { OrderStatus } from "../../../types/oder" // Declare OrderStatus here

export default function OrderSection() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 3
  const totalPages = Math.ceil(filteredOrders.length / perPage)
  const [popupVisible, setPopupVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [orderToRefund, setOrderToRefund] = useState<Order | null>(null)
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  const token = Cookies.get("authToken")

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = Array.isArray(res.data.orders) ? res.data.orders : []
      setOrders(data)
      filterOrders(activeTab, data)
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders(activeTab, orders)
  }, [activeTab, orders])

  // Ngăn body cuộn khi popup hiển thị
  useEffect(() => {
    if (popupVisible || showRefundModal) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [popupVisible, showRefundModal])

  const filterOrders = (status: string, sourceOrders?: Order[]) => {
    const list = sourceOrders || orders
    setActiveTab(status)
    let filtered: Order[] = []

    if (status === "all") {
      filtered = list
    } else if (status === "processing") {
      filtered = list.filter((o) => o.order_status === "Pending" || o.order_status === "order confirmation")
    } else if (status === "shipping") {
      filtered = list.filter((o) => o.order_status === "Shipped")
    } else if (status === "delivered") {
      filtered = list.filter((o) => o.order_status === "Delivered")
    } else if (status === "canceled") {
      filtered = list.filter((o) => o.order_status === "Canceled")
    } else if (status === "return_refund") {  // Gộp Trả hàng và Hoàn tiền
      filtered = list.filter((o) => o.order_status === "Return Requested" || o.order_status === "Returning" || o.order_status === "Refunded")
    }

    setFilteredOrders(filtered)
    setCurrentPage(1)
  }


  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setPopupVisible(true)
  }

  const closePopup = () => {
    setPopupVisible(false)
    setSelectedOrder(null)
  }

  // Handle cancel order based on status
  const handleCancelOrder = async (orderId: number, reason: string) => {
    setIsCancelling(true)
    try {
      await axios.patch(
        `${API_BASE_URL}/cancel/${orderId}`,
        { reason }, // Send the reason to the backend
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update the order status in the local state
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, order_status: OrderStatus.Canceled } : order)),
      )

      // Update selected order if it's the one being cancelled
      setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, order_status: OrderStatus.Canceled } : prev))

      alert("Đơn hàng đã được hủy thành công!")
    } catch (err) {
      console.error("❌ Hủy đơn hàng thất bại:", err)
      alert("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRefundRequest = (order: Order) => {
    setOrderToRefund(order)
    setShowRefundModal(true)
  }

const handleSubmitRefund = async (refundData: { reason: string; images: File[] }) => {
  if (!orderToRefund || isProcessingRefund) return;

  setIsProcessingRefund(true);

  try {
    const imageUrls: string[] = [];

    // Step 1: Upload từng ảnh → nhận URL
    for (const image of refundData.images) {
      const imgForm = new FormData();
      imgForm.append("image", image);

      console.log("📤 Uploading image:", image); // Xem file ảnh đang upload

      const res = await axios.post(`${API_BASE_URL}/upload-refund-image`, imgForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploaded = res.data?.images?.[0];

      console.log("✅ Image uploaded, got URL:", uploaded);

      if (uploaded) {
        imageUrls.push(uploaded);
      } else {
        throw new Error("Không nhận được URL ảnh sau khi upload");
      }
    }

    // ✅ Step 2: Gửi reason + danh sách URL ảnh (images)
    const payload = {
      reason: refundData.reason,
      images: imageUrls,
    };

    console.log("📦 Payload gửi qua API hoàn đơn:", payload);

    const response = await axios.post(`${API_BASE_URL}/orders/${orderToRefund.id}/refund`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Phản hồi từ API hoàn đơn:", response.data);

    // Step 3: UI cập nhật
    setOrders((prev) =>
      prev.map((o) => (o.id === orderToRefund.id ? { ...o, refund_requested: true } : o))
    );
    setShowRefundModal(false);
    setOrderToRefund(null);
    alert("✅ Yêu cầu hoàn đơn đã được gửi thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi gửi yêu cầu hoàn đơn:", err);
    alert("Đã xảy ra lỗi khi gửi yêu cầu hoàn đơn.");
  } finally {
    setIsProcessingRefund(false);
  }
};


  const handleReorder = async (order: Order) => {
    if (!token) return
    try {
      const response = await axios.post(
        `${API_BASE_URL}/reorder/${order.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      router.push(response.data.redirect_url)
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error)
    }
  }

  const currentOrders = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-brand mb-4 text-center">Đơn mua của tôi</h2>
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
                  onCancelOrder={handleCancelOrder}
                  onRefundRequest={handleSubmitRefund}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-xl text-gray-600 hover:bg-[#db4444] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>
              <span className="text-sm text-gray-500">
                Trang <span className="font-semibold text-gray-700">{currentPage}</span> / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
          onShowConfirmCancel={null}
          onCancelOrder={handleCancelOrder}
          onRefundRequest={handleRefundRequest}
          isCancelling={isCancelling}
        />
      )}

      {showRefundModal && orderToRefund && (
        <RefundRequestModal
          order={orderToRefund}
          isVisible={showRefundModal}
          onClose={() => {
            setShowRefundModal(false)
            setOrderToRefund(null)
          }}
          onSubmit={handleSubmitRefund}
          isProcessing={isProcessingRefund}
        />
      )}
    </div>
  )
}
