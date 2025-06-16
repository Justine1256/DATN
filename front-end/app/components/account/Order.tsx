import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import Image from "next/image";

// Định nghĩa lại các Interface (giữ nguyên từ lần trước)
interface Product {
  id: number;
  name: string;
  quantity: number;
  price_at_time: string;
  image: string[];
  shop_id: number;
  description?: string;
  option1?: string;
  option2?: string;
  category_id?: number;
}

interface OrderDetail {
  id: number;
  order_id: number;
  price_at_time: string;
  quantity: number;
  subtotal: string;
  product: Product;
}

interface Order {
  id: number;
  final_amount: string;
  order_status: string; // "processing", "shipping", "delivered", "canceled", "pending"
  shipping_status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  shipping_address: string;
  order_details: OrderDetail[];
}

// Hàm format URL hình ảnh (giữ nguyên)
const formatImageUrl = (img: unknown): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== "string" || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  if (img.startsWith("http")) return img;
  return img.startsWith("/")
    ? `${STATIC_BASE_URL}${img}`
    : `${STATIC_BASE_URL}/${img}`;
};

// Định nghĩa màu sắc trạng thái (giữ nguyên)
const statusColors: Record<string, string> = {
  processing: "bg-yellow-200 text-yellow-800", // Đang xử lý
  shipping: "bg-blue-200 text-blue-800", // Đang giao
  delivered: "bg-green-200 text-green-800", // Đã giao
  canceled: "bg-red-200 text-red-800", // Đã hủy
  pending: "bg-gray-200 text-gray-800", // Đang chờ xử lý (nếu có)
};

// Hàm dịch trạng thái sang tiếng Việt (giữ nguyên)
const translateOrderStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case "processing":
      return "Đang xử lý";
    case "shipping":
      return "Đang giao";
    case "delivered":
      return "Đã giao";
    case "canceled":
      return "Đã hủy";
    case "pending":
      return "Đang chờ";
    default:
      return status;
  }
};

export default function OrderSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false); // Trạng thái hiển thị popup chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // Đơn hàng được chọn để hiển thị chi tiết
  const [showNotification, setShowNotification] = useState(false); // Trạng thái hiển thị popup thông báo
  const [notificationMessage, setNotificationMessage] = useState(""); // Nội dung popup thông báo
  const [isCancelling, setIsCancelling] = useState(false); // Trạng thái đang hủy đơn hàng
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false); // Trạng thái hiển thị popup xác nhận hủy
  const [orderToCancelId, setOrderToCancelId] = useState<number | null>(null); // ID đơn hàng cần xác nhận hủy

  const token = Cookies.get("authToken");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orderall`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data.orders) ? res.data.orders : [];
      setOrders(data);
      // Áp dụng lại bộ lọc hiện tại sau khi fetchOrders
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

  // Hàm lọc đơn hàng theo trạng thái
  const filterOrders = (status: string) => {
    setActiveTab(status); // Cập nhật tab đang hoạt động
    if (status === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) => order.order_status.toLowerCase() === status
      );
      setFilteredOrders(filtered);
    }
  };

  // Hàm xử lý khi xem chi tiết đơn hàng
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setPopupVisible(true);
  };

  // Hàm đóng popup chi tiết đơn hàng
  const closePopup = () => {
    setPopupVisible(false);
    setSelectedOrder(null);
  };

  // Hàm hiển thị popup xác nhận hủy đơn
  const handleShowConfirmCancel = (orderId: number) => {
    setOrderToCancelId(orderId);
    setShowConfirmCancelPopup(true);
  };

  // Hàm xử lý xác nhận hủy đơn hàng
  const handleConfirmCancel = async () => {
    if (!orderToCancelId || isCancelling) return;

    setIsCancelling(true);
    setShowConfirmCancelPopup(false); // Đóng popup xác nhận ngay lập tức

    try {
      await axios.patch(
        `${API_BASE_URL}/cancel/${orderToCancelId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Cập nhật trạng thái đơn hàng cục bộ trong cả orders và filteredOrders
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderToCancelId ? { ...order, order_status: "canceled" } : order
        )
      );
      setFilteredOrders(prevFilteredOrders =>
        prevFilteredOrders.map(order =>
          order.id === orderToCancelId ? { ...order, order_status: "canceled" } : order
        )
      );

      // Cập nhật trạng thái của selectedOrder nếu đang hiển thị popup chi tiết của đơn hàng đó
      if (selectedOrder && selectedOrder.id === orderToCancelId) {
        setSelectedOrder(prevSelected => prevSelected ? { ...prevSelected, order_status: "canceled" } : null);
      }

      setNotificationMessage("Yêu cầu hủy đơn hàng đã được gửi thành công!");
      setShowNotification(true);

      // Đóng popup chi tiết sau một khoảng thời gian ngắn để người dùng kịp thấy thông báo
      setTimeout(() => {
        setShowNotification(false);
        closePopup(); // Đóng popup chi tiết
      }, 1500); // Giữ thông báo và popup thêm 1.5 giây

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

  // Group order details by shop id (giữ nguyên)
  const groupByShop = (orderDetails: OrderDetail[]) => {
    const grouped: Record<number, OrderDetail[]> = {};
    orderDetails.forEach((detail) => {
      if (!grouped[detail.product.shop_id]) {
        grouped[detail.product.shop_id] = [];
      }
      grouped[detail.product.shop_id].push(detail);
    });
    return grouped;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-10 px-4">
      {/* Popup thông báo (giữ nguyên) */}
      {showNotification && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {notificationMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[500px]">
        <h2 className="text-xl font-semibold text-[#db4444] mb-4 text-center">
          Đơn mua của tôi
        </h2>

        {/* Phần lọc đơn hàng theo trạng thái (giữ nguyên) */}
        <div className="flex justify-center mb-6 gap-4">
          <button
            onClick={() => filterOrders("all")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${activeTab === "all"
                ? "bg-[#db4444] text-white"
                : "bg-gray-200 text-black"
              } hover:bg-[#db4444] hover:text-white hover:scale-105`}
          >
            Tất cả
          </button>
          <button
            onClick={() => filterOrders("processing")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${activeTab === "processing"
                ? "bg-[#db4444] text-white"
                : "bg-gray-200 text-black"
              } hover:bg-[#db4444] hover:text-white hover:scale-105`}
          >
            Đang xử lý
          </button>
          <button
            onClick={() => filterOrders("shipping")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${activeTab === "shipping"
                ? "bg-[#db4444] text-white"
                : "bg-gray-200 text-black"
              } hover:bg-[#db4444] hover:text-white hover:scale-105`}
          >
            Đang giao
          </button>
          <button
            onClick={() => filterOrders("delivered")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${activeTab === "delivered"
                ? "bg-[#db4444] text-white"
                : "bg-gray-200 text-black"
              } hover:bg-[#db4444] hover:text-white hover:scale-105`}
          >
            Đã giao
          </button>
          <button
            onClick={() => filterOrders("canceled")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out ${activeTab === "canceled"
                ? "bg-[#db4444] text-white"
                : "bg-gray-200 text-black"
              } hover:bg-[#db4444] hover:text-white hover:scale-105`}
          >
            Đã hủy
          </button>
        </div>

        {/* Danh sách đơn hàng (giữ nguyên logic) */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải đơn hàng...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-md">
            <p className="text-lg text-gray-500">Không có đơn hàng phù hợp.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-6 shadow-lg bg-white hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg text-black">
                        Mã đơn hàng: #{order.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.order_status.toLowerCase()]
                          }`}
                      >
                        {translateOrderStatus(order.order_status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-medium">
                          Ngày đặt
                        </span>
                        <span className="font-semibold text-black">
                          {new Date(order.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-medium">
                          Trạng thái
                        </span>
                        <span className="font-semibold text-black">
                          {translateOrderStatus(order.order_status)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-medium">
                          Thanh toán
                        </span>
                        <span className="font-semibold text-black">
                          {order.payment_method}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-medium">
                          Giao hàng
                        </span>
                        <span className="font-semibold text-black">
                          {order.shipping_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products by Shop */}
                {Object.entries(groupByShop(order.order_details)).map(
                  ([shopId, details]) => (
                    <div key={shopId} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-6 bg-[#db4444] rounded-full"></div>
                        <h4 className="font-semibold text-black text-lg">
                          Cửa hàng #{shopId}
                        </h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-4">
                          {details.map((detail) => (
                            <div
                              key={detail.id}
                              className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
                            >
                              <div className="flex items-center space-x-4 flex-1">
                                <Image
                                  src={formatImageUrl(detail.product.image)}
                                  alt={detail.product.name}
                                  width={80}
                                  height={80}
                                  className="rounded-lg border border-gray-200 object-cover"
                                />
                                <div className="flex flex-col flex-1">
                                  <h5 className="font-medium text-black text-base mb-2">
                                    {detail.product.name}
                                  </h5>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      Số lượng: {detail.quantity}
                                    </span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {parseFloat(
                                        detail.price_at_time
                                      ).toLocaleString()}
                                      ₫/sp
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600">
                                  {parseFloat(detail.subtotal).toLocaleString()}
                                  ₫
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <div className="text-2xl font-bold text-red-600">
                      {parseFloat(order.final_amount).toLocaleString()}₫
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-6 py-2 bg-[#db4444] text-white rounded-lg hover:bg-[#c13838] transition-colors font-medium"
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup chi tiết đơn hàng */}
      {popupVisible && selectedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#db4444] to-[#c13838]">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Chi tiết đơn hàng #{selectedOrder.id}
                </h2>
                <button
                  onClick={closePopup}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                    Thông tin đơn hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày đặt:</span>
                      <span className="font-medium text-black">
                        {new Date(selectedOrder.created_at).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedOrder.order_status.toLowerCase()]
                          }`}
                      >
                        {translateOrderStatus(selectedOrder.order_status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thanh toán:</span>
                      <span className="font-medium text-black">
                        {selectedOrder.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giao hàng:</span>
                      <span className="font-medium text-black">
                        {selectedOrder.shipping_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                    Địa chỉ giao hàng
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedOrder.shipping_address}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">
                    Danh sách sản phẩm
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thông tin
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cửa hàng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.order_details.map((detail, index) => (
                        <tr
                          key={detail.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Image
                                src={formatImageUrl(detail.product.image)}
                                alt={detail.product.name}
                                width={60}
                                height={60}
                                className="rounded-md border border-gray-200 object-cover"
                              />
                              <div className="ml-3 max-w-[200px]">
                                <div
                                  className="text-sm font-medium text-gray-900 truncate"
                                  title={detail.product.name}
                                >
                                  {detail.product.name}
                                </div>
                                {detail.product.description && (
                                  <div
                                    className="text-xs text-gray-500 truncate"
                                    title={detail.product.description}
                                  >
                                    {detail.product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {detail.product.option1 && (
                                <div className="mb-1">
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {detail.product.option1}
                                  </span>
                                </div>
                              )}
                              {detail.product.option2 && (
                                <div>
                                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {detail.product.option2}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {parseFloat(
                                detail.price_at_time
                              ).toLocaleString()}
                              ₫
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {detail.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                              Cửa hàng #{detail.product.shop_id}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-bold text-red-600">
                              {parseFloat(detail.subtotal).toLocaleString()}₫
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-gray-700">
                    Tổng cộng đơn hàng:
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {parseFloat(selectedOrder.final_amount).toLocaleString()}₫
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-4">
                {selectedOrder.order_status.toLowerCase() !== "canceled" && (
                  <button
                    className={`px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleShowConfirmCancel(selectedOrder.id)} // Gọi hàm hiển thị popup xác nhận
                    disabled={isCancelling}
                  >
                    Hủy đơn
                  </button>
                )}
                <button
                  className="px-6 py-3 bg-[#db4444] text-white rounded-lg hover:bg-[#c13838] transition-colors font-medium"
                  onClick={closePopup}
                  disabled={isCancelling}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận hủy đơn hàng */}
      {showConfirmCancelPopup && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Xác nhận hủy đơn hàng
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng này không?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmCancelPopup(false)} // Đóng popup xác nhận
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                disabled={isCancelling}
              >
                Không
              </button>
              <button
                onClick={handleConfirmCancel} // Gọi hàm xử lý hủy đơn hàng
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang xử lý...' : 'Có, hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}