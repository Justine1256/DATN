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
import ReportModal from "./reportmodal"
export default function OrderSection() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [reportedOrderIds, setReportedOrderIds] = useState<number[]>([]);

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
  const [popup, setPopup] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const token = Cookies.get("authToken")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportedOrder, setReportedOrder] = useState<Order | null>(null)
  const [isReporting, setIsReporting] = useState(false)

  const handleSubmitReport = (data: { reason: string; images: File[] }) => {
    if (!reportedOrder) return
    handleReportShop(reportedOrder, data)
    setReportedOrder(null)
    setShowReportModal(false)
  }
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
    const list = sourceOrders || orders;
    setActiveTab(status);
    let filtered: Order[] = [];

    if (status === "all") {
      filtered = list;
    } else if (status === "processing") {
      filtered = list.filter(
        (o) => o.order_status === "Pending" || o.order_status === "order confirmation"
      );
    } else if (status === "shipping") {
      filtered = list.filter((o) => o.order_status === "Shipped");
    } else if (status === "delivered") {
      filtered = list.filter((o) => o.order_status === "Delivered");
    } else if (status === "canceled") {
      filtered = list.filter((o) => o.order_status === "Canceled");
    } else if (status === "return_refund") {
      filtered = list.filter((o) =>
        [
          "Return Requested",
          "Return Approved",
          "Return Rejected",
          "Returning",
          "Refunded"
        ].includes(o.order_status)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };



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
 const handleReportShop = async (
  order: Order,
  reportData: { reason: string; images: File[] }
) => {
  if (isProcessingRefund) return;

  try {
    setIsProcessingRefund(true);

    const imageUrls: string[] = [];

    // ✅ 1. Upload từng ảnh tố cáo
    for (const image of reportData.images) {
      const formData = new FormData();
      formData.append("image", image);

      const uploadRes = await axios.post(
        `${API_BASE_URL}/upload-refund-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = uploadRes.data?.images?.[0];
      if (uploadedUrl) {
        imageUrls.push(uploadedUrl);
      } else {
        throw new Error("Không thể upload ảnh");
      }
    }

    // ✅ 2. Gửi yêu cầu tố cáo
    const payload = {
      reason: reportData.reason,
      images: imageUrls,
    };

    const response = await axios.post(
      `${API_BASE_URL}/reports/${order.id}/report-refund`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );


    // ✅ 3. Cập nhật trạng thái UI
    order.reported = true;
    setReportedOrderIds((prev) => [...prev, order.id]);

    setPopup({ type: "success", message: "✅ Đã gửi tố cáo thành công!" });
  } catch (error: any) {
    const msg = error?.response?.data?.message || "";

    if (msg.includes("đã được tố cáo")) {
      // Nếu đã tố cáo trước đó → cập nhật cờ
      order.reported = true;
      setPopup({ type: "error", message: "Đơn hàng này đã được tố cáo trước đó!" });
    } else {
      console.error("❌ Gửi tố cáo thất bại:", error);
      setPopup({ type: "error", message: "Không thể gửi tố cáo. Vui lòng thử lại!" });
    }
  } finally {
    setTimeout(() => setPopup(null), 3000);
    setIsProcessingRefund(false);
  }
};


const handleSubmitRefund = async (refundData: { reason: string; images: File[] }) => {
  // Không có orderToRefund thì bỏ qua
  if (!orderToRefund) {
    console.warn("⚠️ Không có orderToRefund để gửi hoàn đơn.");
    return;
  }

  // Tránh bấm nhiều lần
  if (isProcessingRefund) {
    console.warn("⚠️ Đang xử lý hoàn đơn, vui lòng chờ...");
    return;
  }

  setIsProcessingRefund(true);

  try {
    // 1) Upload ảnh song song (nếu có)
    const imageUrls: string[] = await (async () => {
      if (!refundData.images || refundData.images.length === 0) return [];

      // Tạo các promise upload cho từng ảnh
      const uploadPromises = refundData.images.map(async (image) => {
        const formData = new FormData();
        formData.append("image", image);

        const res = await axios.post(
          `${API_BASE_URL}/upload-refund-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const uploadedUrl = res.data?.images?.[0];
        if (!uploadedUrl) throw new Error("Không thể upload ảnh");
        return uploadedUrl as string;
      });

      // Chờ tất cả upload xong
      return await Promise.all(uploadPromises);
    })();

    // 2) Gọi API gửi yêu cầu hoàn đơn
    const payload = {
      reason: refundData.reason,
      images: imageUrls,
    };

    await axios.post(
      `${API_BASE_URL}/orders/${orderToRefund.id}/refund`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 3) Cập nhật UI/State
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderToRefund.id ? { ...o, refund_requested: true } : o
      )
    );

    setShowRefundModal(false);
    setOrderToRefund(null);

    setPopup({
      type: "success",
      message: "✅ Yêu cầu hoàn đơn đã được gửi thành công!",
    });
    setTimeout(() => setPopup(null), 3000);
  } catch (err: any) {
    // Lấy message từ server nếu có
    const serverMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Đã xảy ra lỗi khi gửi yêu cầu hoàn đơn.";

    console.error("❌ Lỗi khi gửi yêu cầu hoàn đơn:", err);

    // Hiển thị popup trượt ngang (bạn đã có CSS/animation sẵn)
    setPopup({ type: "error", message: serverMsg });
    setTimeout(() => setPopup(null), 3000);
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
          <div className="flex justify-center items-center h-[300px]">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
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
                  reportedOrderIds={reportedOrderIds}
                  onViewDetails={handleViewOrderDetails}
                  onReorder={handleReorder}
                  onCancelOrder={handleCancelOrder}
                  onRefundRequest={(order, refundData) => {
                    setOrderToRefund(order);
                    handleSubmitRefund(refundData);
                  }}
                  onReportShop={handleReportShop}
                  onClickRefund={() => {
                    setOrderToRefund(order)
                    setShowRefundModal(true)
                  }}
                  onClickReport={() => {
                    setReportedOrder(order)
                    setShowReportModal(true)
                  }}
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
          onShowConfirmCancel={() => { }} // ✅ sửa tại đây
          onCancelOrder={handleCancelOrder}
          onRefundRequest={handleRefundRequest}
          isCancelling={isCancelling}
        />
      )}

      {showReportModal && reportedOrder && (
        <ReportModal
          order={reportedOrder}
          isVisible={showReportModal}
          onClose={() => {
            setShowReportModal(false)
            setReportedOrder(null)
          }}
          onSubmit={handleSubmitReport}
          isProcessing={isReporting}
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
      {popup && (
        <div
          className={`fixed top-30 right-5 z-[10001] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade
      ${popup.type === "success"
              ? "bg-white text-black border-green-500"
              : "bg-white text-red-600 border-red-500"
            }`}
        >
          {popup.message}
        </div>
      )}

    </div>
    
  )
}
