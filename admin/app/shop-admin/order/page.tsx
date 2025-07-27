"use client"
import { useState, useMemo, useEffect } from "react"
import {
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Tooltip,
  Spin,
  message,
  Modal,
  Dropdown,
  DatePicker,
  Statistic,
  Badge,
  Image,
  Descriptions,
  Timeline,
  Tabs,
} from "antd"
import {
  SearchOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FilterOutlined,
  DownOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import type { MenuProps } from "antd"
import dayjs from "dayjs"
import Cookies from "js-cookie"

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { confirm } = Modal

// API Response interfaces
interface APIBuyer {
  id: number
  name: string
  email: string
  phone: string
}

interface APIShop {
  id: number
  name: string
}

interface APIOrder {
  id: number
  buyer: APIBuyer
  shop: APIShop
  final_amount: string
  payment_method: string
  payment_status: string
  order_status: string
  order_admin_status: string
  shipping_status: string
  shipping_address: string
  transaction_id: string | null
  canceled_by: string | null
  reconciliation_status: string
  return_status: string
  cancel_status: string
  cancel_reason: string | null
  rejection_reason: string | null
  created_at: string
  confirmed_at: string | null
  shipping_started_at: string | null
  canceled_at: string | null
  return_confirmed_at: string | null
  reconciled_at: string | null
  delivered_at: string | null
  total_products: number
}

interface APIResponse {
  orders: APIOrder[]
}

// Internal interfaces (converted from API)
interface OrderItem {
  id: string
  productName: string
  productImage: string
  quantity: number
  price: number
  total: number
  variant?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  avatar?: string
}

interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  ward: string
  district: string
  province: string
}

interface OrderData {
  id: string
  orderNumber: string
  customer: Customer
  items: OrderItem[]
  status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod: "cod" | "bank_transfer" | "e_wallet" | "credit_card"
  shippingAddress: ShippingAddress
  shippingFee: number
  discount: number
  subtotal: number
  total: number
  orderDate: string
  confirmedDate?: string
  shippedDate?: string
  deliveredDate?: string
  notes?: string
  shopName: string
  shopId: string
  originalData?: APIOrder
}

// Fixed interface for cancel order - API still requires cancel_type
interface CancelOrderData {
  cancel_reason: string
  cancel_type: "Seller" | "Payment Gateway" | "Customer Refused Delivery" | "System"
}

const token = Cookies.get("token")

// API Service
const orderService = {
  async fetchOrders(): Promise<APIResponse> {
    try {
      const response = await fetch("https://api.marketo.info.vn/api/shopadmin/show/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching orders:", error)
      throw error // Throw error instead of returning mock data
    }
  },
  async updateOrderStatus(orderId: number, orderAdminStatus: string, reconciliationStatus?: string): Promise<any> {
    try {
      const body: any = {
        order_admin_status: orderAdminStatus,
      }

      if (reconciliationStatus) {
        body.reconciliation_status = reconciliationStatus
      }

      console.log("Calling API:", `https://api.marketo.info.vn/api/shop/orders/${orderId}/status`)
      console.log("Request body:", body)
      console.log("Token:", token)

      const response = await fetch(`https://api.marketo.info.vn/api/shop/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("Error response:", errorData)
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Success response:", result)
      return result
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    }
  },
  async cancelOrder(orderId: number, cancelData: CancelOrderData): Promise<any> {
    try {
      const response = await fetch(`https://api.marketo.info.vn/api/shop/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(cancelData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error canceling order:", error)
      throw error
    }
  },
}

// Generate items based on total_products - simplified without mock products
const generateMockItems = (totalProducts: number, totalAmount: number, orderId: number): OrderItem[] => {
  const items: OrderItem[] = []

  for (let i = 0; i < totalProducts; i++) {
    const price = Math.floor(totalAmount / totalProducts)

    items.push({
      id: `ITEM${orderId}_${i + 1}`,
      productName: `Sản phẩm ${i + 1}`,
      productImage: "/placeholder.svg?height=60&width=60&text=Product",
      quantity: 1,
      price,
      total: price,
    })
  }

  return items
}

// Conversion functions
const convertAPIToOrderData = (apiOrder: APIOrder): OrderData => {
  // Parse address
  const addressParts = apiOrder.shipping_address.split(", ")
  const address = addressParts[0] || ""
  const ward = addressParts[1] || ""
  const district = addressParts[2] || ""
  const province = addressParts[3] || ""

  // Convert status based on order_status from API
  const convertStatus = (status: string): OrderData["status"] => {
    switch (status.toLowerCase()) {
      case "pending":
        return "pending"
      case "order confirmation":
        return "confirmed"
      case "shipped":
        return "shipping"
      case "delivered":
        return "delivered"
      case "canceled":
        return "cancelled"
      case "return requested":
      case "returning":
      case "refunded":
        return "returned"
      default:
        return "pending"
    }
  }

  // Convert payment method
  const convertPaymentMethod = (method: string): OrderData["paymentMethod"] => {
    switch (method.toLowerCase()) {
      case "cod":
        return "cod"
      case "vnpay":
        return "e_wallet"
      default:
        return "cod"
    }
  }

  // Convert payment status based on API payment_status
  const convertPaymentStatus = (paymentStatus: string, orderStatus: string): OrderData["paymentStatus"] => {
    switch (paymentStatus.toLowerCase()) {
      case "completed":
        return "paid"
      case "failed":
        return "failed"
      case "pending":
        return orderStatus.toLowerCase() === "canceled" ? "failed" : "pending"
      default:
        return "pending"
    }
  }

  const totalAmount = Number.parseFloat(apiOrder.final_amount)
  const items = generateMockItems(apiOrder.total_products, totalAmount, apiOrder.id)
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const shippingFee = Math.max(0, totalAmount - subtotal)

  return {
    id: `ORDER${apiOrder.id}`,
    orderNumber: `ORD${String(apiOrder.id).padStart(6, "0")}`,
    customer: {
      id: `CUST${apiOrder.buyer.id}`,
      name: apiOrder.buyer.name,
      phone: apiOrder.buyer.phone,
      email: apiOrder.buyer.email,
    },
    items,
    status: convertStatus(apiOrder.order_status),
    paymentStatus: convertPaymentStatus(apiOrder.payment_status, apiOrder.order_status),
    paymentMethod: convertPaymentMethod(apiOrder.payment_method),
    shippingAddress: {
      fullName: apiOrder.buyer.name,
      phone: apiOrder.buyer.phone,
      address,
      ward,
      district,
      province,
    },
    shippingFee,
    discount: 0,
    subtotal,
    total: totalAmount,
    orderDate: apiOrder.created_at,
    confirmedDate: apiOrder.confirmed_at || undefined,
    shippedDate: apiOrder.shipping_started_at || undefined,
    deliveredDate: apiOrder.delivered_at || undefined,
    notes: apiOrder.cancel_reason || apiOrder.rejection_reason || undefined,
    shopName: apiOrder.shop.name,
    shopId: `SHOP${apiOrder.shop.id}`,
    originalData: apiOrder,
  }
}

export default function OrderManagementPage() {
  const [allOrders, setAllOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")

  // Fixed state for cancel order - include cancel_type with default value
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<OrderData | null>(null)
  const [cancelForm, setCancelForm] = useState<CancelOrderData>({
    cancel_reason: "",
    cancel_type: "Seller", // Default value for API requirement
  })

  useEffect(() => {
    console.log("Current token:", token)
    if (!token) {
      message.error("Không tìm thấy token xác thực")
    }
  }, [])

  // Fetch data from API
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const apiResponse = await orderService.fetchOrders()
      const convertedOrders = apiResponse.orders.map(convertAPIToOrderData)
      setAllOrders(convertedOrders)
      message.success(`Đã tải ${convertedOrders.length} đơn hàng`)
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu đơn hàng")
      console.error("Error fetching orders:", error)
      setAllOrders([]) // Set empty array instead of mock data
    } finally {
      setLoading(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter data
  const filteredData = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        searchText === "" ||
        order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer.phone.includes(searchText) ||
        order.id.includes(searchText)

      const matchesStatus = activeTab === "all" || order.status === activeTab

      const matchesPaymentStatus = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter

      const matchesPaymentMethod = paymentMethodFilter === "all" || order.paymentMethod === paymentMethodFilter

      const matchesDateRange =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (dayjs(order.orderDate).isAfter(dateRange[0].startOf("day")) &&
          dayjs(order.orderDate).isBefore(dateRange[1].endOf("day")))

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesDateRange
    })
  }, [allOrders, searchText, activeTab, paymentStatusFilter, paymentMethodFilter, dateRange])

  const handleReset = () => {
    setSearchText("")
    setActiveTab("all")
    setPaymentStatusFilter("all")
    setPaymentMethodFilter("all")
    setDateRange(null)
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderData["status"]) => {
    const order = allOrders.find((o) => o.id === orderId)
    if (!order || !order.originalData) {
      message.error("Không tìm thấy thông tin đơn hàng")
      return
    }

    // Map internal status to API admin status - Updated to match your database
    const statusToAdminStatusMap: Record<OrderData["status"], string> = {
      pending: "Pending Processing",
      confirmed: "Processing",
      processing: "Ready for Shipment",
      shipping: "Shipping",
      delivered: "Delivered",
      cancelled: "Cancelled by Seller",
      returned: "Returned - Completed",
    }

    const adminStatus = statusToAdminStatusMap[newStatus]
    if (!adminStatus) {
      message.error("Trạng thái không hợp lệ")
      return
    }

    console.log("Attempting to update order:", {
      orderId: order.originalData.id,
      currentStatus: order.originalData.order_admin_status,
      newStatus: adminStatus,
    })

    confirm({
      title: "Xác nhận cập nhật trạng thái",
      content: `Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này thành "${getStatusText(newStatus)}"?`,
      onOk: async () => {
        console.log("Confirm OK clicked - starting update process")
        try {
          setActionLoading(orderId)
          console.log("About to call updateOrderStatus API...")

          const result = await orderService.updateOrderStatus(order.originalData!.id, adminStatus)
          console.log("Update result:", result)

          // Update local state
          setAllOrders((prevOrders) =>
            prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
          )
          message.success("Cập nhật trạng thái thành công")

          // Refresh data to get latest from server
          setTimeout(() => {
            fetchOrders()
          }, 1000)
        } catch (error: any) {
          console.error("Update failed:", error)
          message.error(`Lỗi: ${error.message || "Không thể cập nhật trạng thái"}`)
        } finally {
          console.log("Finally block - clearing loading state")
          setActionLoading(null)
        }
      },
      onCancel: () => {
        console.log("Confirm cancelled")
      },
    })
  }

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    confirm({
      title: "Xác nhận xóa đơn hàng",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa đơn hàng "{orderNumber}"?</p>
          <p style={{ color: "red", fontWeight: "bold" }}>Hành động này không thể hoàn tác!</p>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        try {
          setActionLoading(orderId)
          // TODO: Call API to delete order
          await new Promise((resolve) => setTimeout(resolve, 1000))

          setAllOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))
          message.success("Xóa đơn hàng thành công")
        } catch (error) {
          message.error("Lỗi khi xóa đơn hàng")
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  // Fixed handle cancel order function - ensure cancel_type is sent
  const handleCancelOrder = async () => {
    if (!orderToCancel) return

    // Validate cancel reason
    if (!cancelForm.cancel_reason.trim()) {
      message.error("Vui lòng nhập lý do hủy đơn hàng")
      return
    }

    try {
      setActionLoading(orderToCancel.id)
      const originalOrderId = orderToCancel.originalData?.id

      if (!originalOrderId) {
        throw new Error("Không tìm thấy ID đơn hàng gốc")
      }

      // Ensure both fields are sent to API
      const cancelData: CancelOrderData = {
        cancel_reason: cancelForm.cancel_reason.trim(),
        cancel_type: cancelForm.cancel_type, // This is required by API
      }

      await orderService.cancelOrder(originalOrderId, cancelData)

      // Update local state
      setAllOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderToCancel.id
            ? {
                ...order,
                status: "cancelled",
                paymentStatus: "refunded",
                notes: cancelForm.cancel_reason,
              }
            : order,
        ),
      )

      message.success("Hủy đơn hàng thành công")
      setCancelModalVisible(false)
      setOrderToCancel(null)
      setCancelForm({ cancel_reason: "", cancel_type: "Seller" })
    } catch (error: any) {
      message.error(error.message || "Lỗi khi hủy đơn hàng")
    } finally {
      setActionLoading(null)
    }
  }

  // Updated show cancel modal function
  const showCancelModal = (order: OrderData) => {
    // Kiểm tra trạng thái có thể hủy
    if (order.status === "delivered" || order.status === "cancelled") {
      message.warning("Không thể hủy đơn hàng đã giao hoặc đã hủy")
      return
    }

    setOrderToCancel(order)
    setCancelModalVisible(true)
  }

  const getStatusColor = (status: OrderData["status"]) => {
    const colors = {
      pending: "orange",
      confirmed: "blue",
      processing: "cyan",
      shipping: "purple",
      delivered: "green",
      cancelled: "red",
      returned: "magenta",
    }
    return colors[status] || "default"
  }

  const getStatusText = (status: OrderData["status"]) => {
    const texts = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
      returned: "Đã trả",
    }
    return texts[status] || status
  }

  const getPaymentStatusColor = (status: OrderData["paymentStatus"]) => {
    const colors = {
      pending: "orange",
      paid: "green",
      failed: "red",
      refunded: "purple",
    }
    return colors[status] || "default"
  }

  const getPaymentStatusText = (status: OrderData["paymentStatus"]) => {
    const texts = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán thất bại",
      refunded: "Đã hoàn tiền",
    }
    return texts[status] || status
  }

  const getPaymentMethodText = (method: OrderData["paymentMethod"]) => {
    const texts = {
      cod: "Thanh toán khi nhận hàng",
      bank_transfer: "Chuyển khoản ngân hàng",
      e_wallet: "Ví điện tử",
      credit_card: "Thẻ tín dụng",
    }
    return texts[method] || method
  }

  const getActionItems = (record: OrderData): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "Xem chi tiết",
      onClick: () => showOrderDetail(record),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Chỉnh sửa",
      disabled: ["delivered", "cancelled", "returned"].includes(record.status),
    },
    {
      key: "cancel",
      icon: <DeleteOutlined />,
      label: "Hủy đơn hàng",
      disabled: ["delivered", "cancelled", "returned"].includes(record.status),
      onClick: () => showCancelModal(record),
    },
    {
      key: "print",
      icon: <PrinterOutlined />,
      label: "In đơn hàng",
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Xóa đơn hàng",
      danger: true,
      onClick: () => handleDeleteOrder(record.id, record.orderNumber),
    },
  ]

  const columns: ColumnsType<OrderData> = [
    {
      title: "Đơn hàng",
      key: "order",
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <Tooltip title={record.orderNumber}>{record.orderNumber}</Tooltip>
          </div>
          <div style={{ color: "#666", fontSize: "12px", marginBottom: 2 }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(record.orderDate).format("DD/MM/YYYY HH:mm")}
          </div>
          <div style={{ color: "#666", fontSize: "11px" }}>{record.shopName}</div>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 140,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <UserOutlined style={{ marginRight: 4 }} />
            <Tooltip title={record.customer.name}>{record.customer.name}</Tooltip>
          </div>
          <div style={{ color: "#666", fontSize: "12px" }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.customer.phone}
          </div>
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items",
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Badge count={record.items.length} size="small">
              <ShoppingCartOutlined style={{ marginRight: 4 }} />
              <span style={{ fontSize: "12px" }}>{record.items.length} sản phẩm</span>
            </Badge>
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.items[0]?.productName}
            {record.items.length > 1 && ` +${record.items.length - 1} khác`}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái xử lý",
      key: "orderStatus",
      width: 100,
      render: (_, record) => {
        const isDisabled = ["delivered", "cancelled", "returned"].includes(record.status)

        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "pending",
                  label: "Chờ xử lý",
                  disabled: record.status === "pending",
                  onClick: () => handleUpdateOrderStatus(record.id, "pending"),
                },
                {
                  key: "confirmed",
                  label: "Đang xử lý",
                  disabled: record.status === "confirmed",
                  onClick: () => handleUpdateOrderStatus(record.id, "confirmed"),
                },
                {
                  key: "processing",
                  label: "Đã xử lý",
                  disabled: record.status === "processing",
                  onClick: () => handleUpdateOrderStatus(record.id, "processing"),
                },
                {
                  key: "shipping",
                  label: "Đang giao hàng",
                  disabled: record.status === "shipping",
                  onClick: () => handleUpdateOrderStatus(record.id, "shipping"),
                },
                {
                  key: "delivered",
                  label: "Đã giao hàng",
                  disabled: record.status === "delivered",
                  onClick: () => handleUpdateOrderStatus(record.id, "delivered"),
                },
                {
                  key: "cancelled",
                  label: "Hủy bởi Seller",
                  disabled: record.status === "cancelled",
                  onClick: () => handleUpdateOrderStatus(record.id, "cancelled"),
                },
                {
                  key: "returned",
                  label: "Đã trả hàng",
                  disabled: record.status === "returned",
                  onClick: () => handleUpdateOrderStatus(record.id, "returned"),
                },
              ],
            }}
            trigger={["click"]}
            disabled={isDisabled}
          >
            <Tag
              color={getStatusColor(record.status)}
              style={{
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                width: "fit-content",
              }}
            >
              {getStatusText(record.status)}
              {!isDisabled && <DownOutlined style={{ fontSize: "10px" }} />}
            </Tag>
          </Dropdown>
        )
      },
    },
    {
      title: "Thanh toán",
      key: "paymentStatus",
      width: 100,
      render: (_, record) => (
        <Tag color={getPaymentStatusColor(record.paymentStatus)}>{getPaymentStatusText(record.paymentStatus)}</Tag>
      ),
    },
    {
      title: "Tổng tiền",
      key: "total",
      width: 100,
      render: (_, record) => {
        return (
          <div>
            <div style={{ fontWeight: "bold", color: "#f5222d" }}>
              <Tooltip title={`${record.total.toLocaleString("vi-VN")} ₫`}>
                {record.total > 1000000000
                  ? `${(record.total / 1000000000).toFixed(1)}B ₫`
                  : record.total > 1000000
                    ? `${(record.total / 1000000).toFixed(1)}M ₫`
                    : `${(record.total / 1000).toFixed(0)}K ₫`}
              </Tooltip>
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>{getPaymentMethodText(record.paymentMethod)}</div>
          </div>
        )
      },
      sorter: (a: OrderData, b: OrderData) => a.total - b.total,
    },
    {
      title: "Địa chỉ",
      key: "address",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: 2 }}>{record.shippingAddress.fullName}</div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            <Tooltip
              title={`${record.shippingAddress.address}, ${record.shippingAddress.ward}, ${record.shippingAddress.district}, ${record.shippingAddress.province}`}
            >
              {record.shippingAddress.province}
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 60,
      render: (_, record: OrderData) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={["click"]} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} loading={actionLoading === record.id} />
        </Dropdown>
      ),
    },
  ]

  const showOrderDetail = (order: OrderData) => {
    setSelectedOrder(order)
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedOrder(null)
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  // Statistics
  const stats = useMemo(() => {
    const total = filteredData.length
    const pending = filteredData.filter((o) => o.status === "pending").length
    const processing = filteredData.filter((o) => o.status === "processing" || o.status === "confirmed").length
    const shipping = filteredData.filter((o) => o.status === "shipping").length
    const delivered = filteredData.filter((o) => o.status === "delivered").length
    const cancelled = filteredData.filter((o) => o.status === "cancelled").length
    const totalRevenue = filteredData.reduce((sum, order) => sum + order.total, 0)
    const avgOrderValue = total > 0 ? totalRevenue / total : 0

    return { total, pending, processing, shipping, delivered, cancelled, totalRevenue, avgOrderValue }
  }, [filteredData])

  return (
    <div style={{ padding: "2px" }}>
      {/* Statistics Overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Tổng đơn hàng"
              value={stats.total}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Chờ xử lý"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Đang xử lý"
              value={stats.processing}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Đang giao"
              value={stats.shipping}
              prefix={<TruckOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Hoàn thành"
              value={stats.delivered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Doanh thu"
              value={
                stats.totalRevenue > 1000000000
                  ? `${(stats.totalRevenue / 1000000000).toFixed(1)}B`
                  : stats.totalRevenue > 1000000
                    ? `${(stats.totalRevenue / 1000000).toFixed(1)}M`
                    : `${(stats.totalRevenue / 1000).toFixed(0)}K`
              }
              prefix={<DollarOutlined />}
              suffix="₫"
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 0 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Trạng thái thanh toán"
              value={paymentStatusFilter}
              onChange={setPaymentStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="failed">Thất bại</Option>
              <Option value="refunded">Đã hoàn tiền</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Phương thức thanh toán"
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="cod">COD</Option>
              <Option value="bank_transfer">Chuyển khoản</Option>
              <Option value="e_wallet">Ví điện tử</Option>
              <Option value="credit_card">Thẻ tín dụng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Space wrap>
              <Button icon={<FilterOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
              >
                Làm mới
              </Button>
              <Button icon={<PrinterOutlined />}>In đơn hàng</Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Text type="secondary">
              Hiển thị {filteredData.length} / {allOrders.length} đơn hàng
              {stats.totalRevenue > 0 && (
                <span style={{ marginLeft: 16 }}>
                  • Tổng doanh thu:{" "}
                  <Text strong>
                    {stats.totalRevenue > 1000000000
                      ? `${(stats.totalRevenue / 1000000000).toFixed(1)}B ₫`
                      : stats.totalRevenue > 1000000
                        ? `${(stats.totalRevenue / 1000000).toFixed(1)}M ₫`
                        : `${(stats.totalRevenue / 1000).toFixed(0)}K ₫`}
                  </Text>
                  • Giá trị TB:{" "}
                  <Text strong>
                    {stats.avgOrderValue > 1000000
                      ? `${(stats.avgOrderValue / 1000000).toFixed(1)}M ₫`
                      : `${(stats.avgOrderValue / 1000).toFixed(0)}K ₫`}
                  </Text>
                </span>
              )}
            </Text>
          </Col>
        </Row>

        {/* Status Tabs */}
        <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              {
                key: "all",
                label: (
                  <span>
                    <span style={{ color: "#666" }}>⚪</span> Tất cả ({allOrders.length})
                  </span>
                ),
              },
              {
                key: "pending",
                label: (
                  <span>
                    <span style={{ color: "#faad14" }}>🟡</span> Chờ xác nhận (
                    {allOrders.filter((o) => o.status === "pending").length})
                  </span>
                ),
              },
              {
                key: "confirmed",
                label: (
                  <span>
                    <span style={{ color: "#1890ff" }}>🔵</span> Đã xác nhận (
                    {allOrders.filter((o) => o.status === "confirmed").length})
                  </span>
                ),
              },
              {
                key: "processing",
                label: (
                  <span>
                    <span style={{ color: "#13c2c2" }}>🟢</span> Đang xử lý (
                    {allOrders.filter((o) => o.status === "processing").length})
                  </span>
                ),
              },
              {
                key: "shipping",
                label: (
                  <span>
                    <span style={{ color: "#722ed1" }}>🟣</span> Đang giao (
                    {allOrders.filter((o) => o.status === "shipping").length})
                  </span>
                ),
              },
              {
                key: "delivered",
                label: (
                  <span>
                    <span style={{ color: "#52c41a" }}>✅</span> Đã giao (
                    {allOrders.filter((o) => o.status === "delivered").length})
                  </span>
                ),
              },
              {
                key: "cancelled",
                label: (
                  <span>
                    <span style={{ color: "#f5222d" }}>❌</span> Đã hủy (
                    {allOrders.filter((o) => o.status === "cancelled").length})
                  </span>
                ),
              },
              {
                key: "returned",
                label: (
                  <span>
                    <span style={{ color: "#eb2f96" }}>↩️</span> Đã trả (
                    {allOrders.filter((o) => o.status === "returned").length})
                  </span>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card style={{ marginTop: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
            }}
            size="middle"
            scroll={{ x: "max-content" }}
          />
        </Spin>
      </Card>

      {/* Cancel Order Modal - UI simplified but API gets required fields */}
      <Modal
        title="Hủy đơn hàng"
        open={cancelModalVisible}
        onOk={handleCancelOrder}
        onCancel={() => {
          setCancelModalVisible(false)
          setOrderToCancel(null)
          setCancelForm({ cancel_reason: "", cancel_type: "Seller" })
        }}
        okText="Xác nhận hủy"
        cancelText="Hủy bỏ"
        okButtonProps={{
          danger: true,
          loading: actionLoading === orderToCancel?.id,
          disabled: !cancelForm.cancel_reason.trim(),
        }}
        width={600}
      >
        {orderToCancel && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Đơn hàng: </Text>
              <Text>{orderToCancel.orderNumber}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Khách hàng: </Text>
              <Text>{orderToCancel.customer.name}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Tổng tiền: </Text>
              <Text style={{ color: "#f5222d" }}>{orderToCancel.total.toLocaleString("vi-VN")} ₫</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>
                Lý do hủy: <span style={{ color: "#f5222d" }}>*</span>
              </Text>
              <Input.TextArea
                value={cancelForm.cancel_reason}
                onChange={(e) => setCancelForm({ ...cancelForm, cancel_reason: e.target.value })}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={4}
                maxLength={255}
                showCount
                style={{ marginTop: 8 }}
                status={!cancelForm.cancel_reason.trim() ? "error" : ""}
              />
              {!cancelForm.cancel_reason.trim() && (
                <Text type="danger" style={{ fontSize: "12px" }}>
                  Vui lòng nhập lý do hủy đơn hàng
                </Text>
              )}
            </div>
            <div
              style={{
                padding: 12,
                backgroundColor: "#fff2f0",
                border: "1px solid #ffccc7",
                borderRadius: 6,
                marginTop: 16,
              }}
            >
              <Text type="danger" style={{ fontWeight: "bold" }}>
                ⚠️ Cảnh báo: Hành động này sẽ hủy đơn hàng và không thể hoàn tác!
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          title={
            <Space>
              <ShoppingCartOutlined />
              <span>Chi tiết đơn hàng {selectedOrder.orderNumber}</span>
              <Tag color={getStatusColor(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</Tag>
            </Space>
          }
          open={isModalVisible}
          onCancel={handleCloseModal}
          width={1000}
          footer={[
            <Button key="print" icon={<PrinterOutlined />}>
              In đơn hàng
            </Button>,
            <Button key="export" icon={<DownloadOutlined />}>
              Xuất PDF
            </Button>,
            <Button key="close" onClick={handleCloseModal}>
              Đóng
            </Button>,
          ]}
        >
          <Row gutter={24}>
            <Col span={16}>
              {/* Order Items */}
              <Card title="Sản phẩm đặt hàng" size="small" style={{ marginBottom: 16 }}>
                {selectedOrder.items.map((item) => (
                  <Row
                    key={item.id}
                    style={{ marginBottom: 12, padding: 8, border: "1px solid #f0f0f0", borderRadius: 4 }}
                  >
                    <Col span={4}>
                      <Image src={item.productImage || "/placeholder.svg"} width={50} height={50} />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontWeight: 500 }}>{item.productName}</div>
                      {item.variant && <div style={{ fontSize: 12, color: "#666" }}>{item.variant}</div>}
                    </Col>
                    <Col span={4} style={{ textAlign: "center" }}>
                      <div>SL: {item.quantity}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{item.price.toLocaleString("vi-VN")} ₫</div>
                    </Col>
                    <Col span={4} style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "#f5222d" }}>{item.total.toLocaleString("vi-VN")} ₫</div>
                    </Col>
                  </Row>
                ))}

                {/* Order Summary */}
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, marginTop: 12 }}>
                  <Row justify="end">
                    <Col span={8}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span>Tạm tính:</span>
                        <span>{selectedOrder.subtotal.toLocaleString("vi-VN")} ₫</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span>Phí vận chuyển:</span>
                        <span>{selectedOrder.shippingFee.toLocaleString("vi-VN")} ₫</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                            color: "#52c41a",
                          }}
                        >
                          <span>Giảm giá:</span>
                          <span>-{selectedOrder.discount.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: "bold",
                          fontSize: 16,
                          borderTop: "1px solid #f0f0f0",
                          paddingTop: 8,
                        }}
                      >
                        <span>Tổng cộng:</span>
                        <span style={{ color: "#f5222d" }}>{selectedOrder.total.toLocaleString("vi-VN")} ₫</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>

              {/* Order Timeline */}
              <Card title="Lịch sử đơn hàng" size="small">
                <Timeline>
                  <Timeline.Item color="blue" dot={<CalendarOutlined />}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Đặt hàng</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {dayjs(selectedOrder.orderDate).format("DD/MM/YYYY HH:mm")}
                      </div>
                    </div>
                  </Timeline.Item>
                  {selectedOrder.confirmedDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Xác nhận đơn hàng</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {dayjs(selectedOrder.confirmedDate).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </Timeline.Item>
                  )}
                  {selectedOrder.shippedDate && (
                    <Timeline.Item color="purple" dot={<TruckOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Bắt đầu giao hàng</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {dayjs(selectedOrder.shippedDate).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </Timeline.Item>
                  )}
                  {selectedOrder.deliveredDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Giao hàng thành công</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {dayjs(selectedOrder.deliveredDate).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </Col>

            <Col span={8}>
              {/* Customer Info */}
              <Card title="Thông tin khách hàng" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Tên khách hàng">{selectedOrder.customer.name}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{selectedOrder.customer.phone}</Descriptions.Item>
                  <Descriptions.Item label="Email">{selectedOrder.customer.email}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Shipping Address */}
              <Card title="Địa chỉ giao hàng" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Người nhận">{selectedOrder.shippingAddress.fullName}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{selectedOrder.shippingAddress.phone}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.ward},{" "}
                    {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.province}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Payment Info */}
              <Card title="Thông tin thanh toán" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Phương thức">
                    {getPaymentMethodText(selectedOrder.paymentMethod)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {getPaymentStatusText(selectedOrder.paymentStatus)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền">
                    <Text strong style={{ color: "#f5222d" }}>
                      {selectedOrder.total.toLocaleString("vi-VN")} ₫
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card title="Ghi chú" size="small">
                  <Text>{selectedOrder.notes}</Text>
                </Card>
              )}

              {/* API Data Debug */}
              {selectedOrder.originalData && (
                <Card title="Dữ liệu API gốc" size="small" style={{ marginTop: 16 }}>
                  <pre style={{ fontSize: 10, maxHeight: 200, overflow: "auto" }}>
                    {JSON.stringify(selectedOrder.originalData, null, 2)}
                  </pre>
                </Card>
              )}
            </Col>
          </Row>
        </Modal>
      )}
    </div>
  )
}
