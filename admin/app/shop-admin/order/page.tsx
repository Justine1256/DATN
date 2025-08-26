"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"

const { Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

// ===================== API types =====================
interface APIBuyer {
  id: number
  name: string
  email: string
  phone: string
  avatar?: string
}

interface APIShop {
  id: number
  name: string
}

type APIShippingAddress = {
  full_name?: string
  address?: string
  ward?: string
  district?: string
  province?: string
  city?: string
  phone?: string
  email?: string
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
  shipping_address: string | APIShippingAddress
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

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page?: number
}

// ⬇️ summary từ BE
interface APISummary {
  total_orders: number
  revenue_total: number
  order_status_counts: Record<string, number>
}

interface APIResponse {
  orders: APIOrder[]
  pagination: PaginationMeta
  summary?: APISummary
}

interface OrderDetailAPI {
  order: {
    id: number
    user_id: number
    shop_id: number
    final_amount: string
    total_amount: string
    payment_method: string
    payment_status: string
    reconciliation_status: string
    return_status: string
    transaction_id: string | null
    order_status: string
    confirmed_at: string | null
    shipping_started_at: string | null
    canceled_at: string | null
    return_confirmed_at: string | null
    reconciled_at: string | null
    delivered_at: string | null
    order_admin_status: string
    cancel_status: string
    cancel_reason: string | null
    rejection_reason: string | null
    canceled_by: string | null
    shipping_status: string
    shipping_address: string
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  details: Array<{
    id: number
    order_id: number
    product_id: number
    price_at_time: string
    quantity: number
    subtotal: string
    variant_id: number | null
    product_option: string
    product_value: string
    product_name: string
    product_image: string
  }>
}

// ===================== Internal types =====================
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

interface CancelOrderData {
  cancel_reason: string
  cancel_type: "Seller" | "Payment Gateway" | "Customer Refused Delivery" | "System"
}

// ===================== Helpers =====================
const parseShippingAddress = (raw: string | APIShippingAddress | null | undefined) => {
  const empty = { fullName: "", phone: "", address: "", ward: "", district: "", province: "", email: "" }
  if (!raw) return empty

  if (typeof raw === "object") {
    const a = raw as APIShippingAddress
    return {
      fullName: a.full_name ?? "",
      phone: a.phone ?? "",
      address: a.address ?? "",
      ward: a.ward ?? "",
      district: a.district ?? "",
      province: a.province ?? a.city ?? "",
      email: a.email ?? "",
    }
  }

  const s = raw.trim()
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const a = JSON.parse(s) as APIShippingAddress
      return {
        fullName: a.full_name ?? "",
        phone: a.phone ?? "",
        address: a.address ?? "",
        ward: a.ward ?? "",
        district: a.district ?? "",
        province: a.province ?? a.city ?? "",
        email: a.email ?? "",
      }
    } catch {}
  }

  const parts = s.split(",").map((p) => p.trim())
  return {
    fullName: "",
    phone: "",
    address: parts[0] || "",
    ward: parts[1] || "",
    district: parts[2] || "",
    province: parts[3] || "",
    email: "",
  }
}

// Map UI -> BE cho filter
const uiPaymentStatusToApi = (v: string) =>
  v === "pending" ? "Pending" :
  v === "paid"    ? "Completed" :
  v === "failed"  ? "Failed" :
  v === "refunded"? "Refunded" : undefined

const uiPaymentMethodToApi = (v: string) =>
  v === "cod"          ? "COD" :
  v === "vnpay"       ? "VNPAY" : undefined

const orderService = {
  // ================= SERVER FILTER =================
  async fetchOrders(params: {
    page?: number
    perPage?: number
    status?: string
    withProducts?: boolean
    search?: string
    paymentStatus?: string
    paymentMethod?: string
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<APIResponse> {
    const token = Cookies.get("authToken")
    const {
      page = 1,
      perPage = 20,
      status,
      withProducts = false,
      search,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
    } = params

    const qs = new URLSearchParams()
    qs.set("page", String(page))
    qs.set("per_page", String(perPage))
    if (status) qs.set("status", status) // order_admin_status
    if (withProducts) qs.set("with_products", "1")

    // new filters -> BE
    if (search) qs.set("search", search)
    if (paymentStatus) qs.set("payment_status", paymentStatus)
    if (paymentMethod) qs.set("payment_method", paymentMethod)
    if (dateFrom) qs.set("date_from", dateFrom)
    if (dateTo) qs.set("date_to", dateTo)

    const url = `${API_BASE_URL}/shopadmin/show/orders?${qs.toString()}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return (await response.json()) as APIResponse
  },

  // ✅ Cho phép truyền orderAdminStatus optional; chỉ add key khi có
  async updateOrderStatus(orderId: number, orderAdminStatus?: string, reconciliationStatus?: string): Promise<any> {
    const token = Cookies.get("authToken")
    if (!token) throw new Error("Không tìm thấy token xác thực")

    const body: any = {}
    if (typeof orderAdminStatus !== "undefined") body.order_admin_status = orderAdminStatus
    if (reconciliationStatus) body.reconciliation_status = reconciliationStatus

    const response = await fetch(`${API_BASE_URL}/shop/orders/${orderId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text()
      try {
        const j = JSON.parse(text)
        throw new Error(j.message || `HTTP error! status: ${response.status}`)
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }
    const responseText = await response.text()
    try {
      return JSON.parse(responseText)
    } catch {
      return { success: true, message: "Status updated successfully" }
    }
  },

  // giữ nguyên — BE chưa hỗ trợ, FE sẽ warning nếu gọi
  async updatePaymentStatus(orderId: number, paymentStatus: "Pending" | "Completed" | "Failed") {
    const token = Cookies.get("authToken")
    const response = await fetch(`${API_BASE_URL}/shop/orders/${orderId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ payment_status: paymentStatus }),
    })
    if (!response.ok) {
      const text = await response.text()
      try {
        const j = JSON.parse(text)
        throw new Error(j.message || `HTTP error! status: ${response.status}`)
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }
    return await response.json().catch(() => ({}))
  },

  async cancelOrder(orderId: number, cancelData: CancelOrderData): Promise<any> {
    const token = Cookies.get("authToken")
    const response = await fetch(`${API_BASE_URL}/shop/orders/${orderId}/cancel`, {
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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  async fetchOrderDetail(orderId: number): Promise<OrderDetailAPI> {
    const token = Cookies.get("authToken")
    const response = await fetch(`${API_BASE_URL}/showdh/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  },
}

// Generate items based on total_products (placeholder nếu BE không trả products)
const generateMockItems = (totalProducts: number, totalAmount: number, orderId: number): OrderItem[] => {
  const items: OrderItem[] = []
  for (let i = 0; i < totalProducts; i++) {
    const price = Math.floor(totalAmount / (totalProducts || 1))
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

const formatAddress = (a: ShippingAddress) => [a.address, a.ward, a.district, a.province].filter(Boolean).join(", ")

const convertAPIToOrderData = (apiOrder: APIOrder): OrderData => {
  const addr = parseShippingAddress(apiOrder.shipping_address as any)

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

  const convertPaymentMethod = (method: string): OrderData["paymentMethod"] => {
    switch (method.toLowerCase()) {
      case "cod":
        return "cod"
      case "vnpay":
        return "e_wallet"
      case "bank_transfer":
        return "bank_transfer"
      case "credit_card":
        return "credit_card"
      default:
        return "cod"
    }
  }

  const convertPaymentStatus = (paymentStatus: string, orderStatus: string): OrderData["paymentStatus"] => {
    switch (paymentStatus.toLowerCase()) {
      case "completed":
        return "paid"
      case "failed":
        return "failed"
      case "pending":
        return orderStatus.toLowerCase() === "canceled" ? "failed" : "pending"
      case "refunded":
        return "refunded"
      default:
        return "pending"
    }
  }

  const totalAmount = Number.parseFloat(apiOrder.final_amount || "0")
  const items = generateMockItems(apiOrder.total_products || 0, totalAmount, apiOrder.id)
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const shippingFee = Math.max(0, totalAmount - subtotal)

  // ✅ Nếu đã đối soát -> coi như ĐÃ THANH TOÁN ở UI
  const reconciled =
    (apiOrder.reconciliation_status || "").toLowerCase() === "done" ||
    apiOrder.order_admin_status === "Reconciled"

  const computedPayment = convertPaymentStatus(apiOrder.payment_status, apiOrder.order_status)
  const paymentStatusFinal: OrderData["paymentStatus"] = reconciled ? "paid" : computedPayment

  return {
    id: `ORDER${apiOrder.id}`,
    orderNumber: `ORD${String(apiOrder.id).padStart(6, "0")}`,
    customer: {
      id: `CUST${apiOrder.buyer.id}`,
      name: apiOrder.buyer.name,
      phone: apiOrder.buyer.phone,
      email: apiOrder.buyer.email,
      avatar: apiOrder.buyer.avatar,
    },
    items,
    status: convertStatus(apiOrder.order_status),
    paymentStatus: paymentStatusFinal,
    paymentMethod: convertPaymentMethod(apiOrder.payment_method),
    shippingAddress: {
      fullName: addr.fullName || apiOrder.buyer.name,
      phone: addr.phone || apiOrder.buyer.phone,
      address: addr.address,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
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

// map tab -> order_admin_status (filter server)
const adminStatusByTab: Record<string, string | undefined> = {
  all: undefined,
  pending: "Pending Processing",
  confirmed: "Processing",
  processing: "Ready for Shipment",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled by Seller",
  returned: "Returned - Completed",
}

// meta để hiển thị order_status_counts từ BE
const orderStatusMeta: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  Delivered: { label: "Đã giao", color: "#52c41a", icon: <CheckCircleOutlined /> },
  Pending: { label: "Chờ xác nhận", color: "#faad14", icon: <ClockCircleOutlined /> },
  Shipped: { label: "Đang giao", color: "#722ed1", icon: <TruckOutlined /> },
  Canceled: { label: "Đã hủy", color: "#f5222d", icon: <DeleteOutlined /> },
  Returning: { label: "Đang hoàn hàng", color: "#722ed1", icon: <TruckOutlined /> },
  Refunded: { label: "Đã hoàn tiền", color: "#722ed1", icon: <DollarOutlined /> },
  "Return Requested": { label: "Yêu cầu trả hàng", color: "#eb2f96", icon: <ExclamationCircleOutlined /> },
}

const toApiPayment: Record<OrderData["paymentStatus"], "Pending" | "Completed" | "Failed" | "Refunded"> = {
  pending: "Pending",
  paid: "Completed",
  failed: "Failed",
  refunded: "Refunded",
}

const canEditPayment = (status: OrderData["status"]) =>
  ["processing", "shipping", "delivered"].includes(status)

// ===================== Component =====================
export default function OrderManagementPage() {
  const [allOrders, setAllOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)

  // SERVER FILTER state
  const [searchText, setSearchText] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("pending") // mặc định "Chờ xác nhận"
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<OrderData | null>(null)
  const [cancelForm, setCancelForm] = useState<CancelOrderData>({ cancel_reason: "", cancel_type: "Seller" })
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    orderId: string
    newStatus: OrderData["status"]
    adminStatus: string
    orderNumber: string
  } | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderDetailAPI | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // server pagination
  const [serverPage, setServerPage] = useState(1)
  const [serverPageSize, setServerPageSize] = useState(20)
  const [serverTotal, setServerTotal] = useState(0)
  const [serverLastPage, setServerLastPage] = useState(1)

  // summary từ server
  const [serverSummary, setServerSummary] = useState<APISummary | null>(null)

  useEffect(() => {
    const token = Cookies.get("authToken")
    if (!token) message.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.")
  }, [])

  // Helper build params từ UI state -> BE params
  const buildServerFilters = () => {
    const statusParam = adminStatusByTab[activeTab]
    const paymentStatus = uiPaymentStatusToApi(paymentStatusFilter)
    const paymentMethod = uiPaymentMethodToApi(paymentMethodFilter)

    const dateFrom = dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : undefined
    const dateTo   = dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : undefined

    const search = searchText.trim() || undefined

    return { status: statusParam, paymentStatus, paymentMethod, dateFrom, dateTo, search }
  }

  // FETCH - dùng filter từ BE
  const fetchOrders = async (page = 1, perPage = serverPageSize) => {
    setLoading(true)
    try {
      const filters = buildServerFilters()
      const apiResponse = await orderService.fetchOrders({
        page,
        perPage,
        withProducts: false,
        ...filters, // ⬅️ SERVER FILTER
      })

      const convertedOrders = apiResponse.orders.map(convertAPIToOrderData)
      setAllOrders(convertedOrders)

      setServerPage(apiResponse.pagination.current_page)
      setServerPageSize(apiResponse.pagination.per_page ?? perPage ?? serverPageSize)
      setServerTotal(apiResponse.pagination.total)
      setServerLastPage(apiResponse.pagination.last_page)

      setServerSummary(apiResponse.summary ?? null)
    } catch (error: any) {
      message.error(`Lỗi khi tải dữ liệu đơn hàng: ${error.message}`)
      setAllOrders([])
      setServerTotal(0)
      setServerSummary(null)
    } finally {
      setLoading(false)
    }
  }

  // lần đầu
  useEffect(() => {
    fetchOrders(1, serverPageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // đổi TAB -> gọi BE
  useEffect(() => {
    fetchOrders(1, serverPageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // đổi FILTER -> gọi BE (debounce nhẹ cho search)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrders(1, serverPageSize)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, paymentStatusFilter, paymentMethodFilter, dateRange])

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderData["status"]) => {
    const order = allOrders.find((o) => o.id === orderId)
    if (!order || !order.originalData) {
      message.error("Không tìm thấy thông tin đơn hàng")
      return
    }

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

    setPendingStatusUpdate({ orderId, newStatus, adminStatus, orderNumber: order.orderNumber })
    setConfirmModalVisible(true)
  }

  const executeStatusUpdate = async (
    orderId: string,
    newStatus: OrderData["status"],
    adminStatus: string,
    order: OrderData,
  ) => {
    try {
      setActionLoading(orderId)
      await orderService.updateOrderStatus(order.originalData!.id, adminStatus)
      // refresh list từ BE để đồng bộ phân trang / filter
      await fetchOrders(serverPage, serverPageSize)
      message.success("Cập nhật trạng thái thành công")
    } catch (error: any) {
      message.error(error.message || "Không thể cập nhật trạng thái")
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return
    const { orderId, newStatus, adminStatus } = pendingStatusUpdate
    const order = allOrders.find((o) => o.id === orderId)
    if (order) await executeStatusUpdate(orderId, newStatus, adminStatus, order)
    setConfirmModalVisible(false)
    setPendingStatusUpdate(null)
  }

  const handleCancelStatusUpdate = () => {
    setConfirmModalVisible(false)
    setPendingStatusUpdate(null)
  }

  // =========== Payment status update ===========
  const handleUpdatePaymentStatus = async (record: OrderData, next: OrderData["paymentStatus"]) => {
    // Không cho set "refunded" tại đây (BE chưa có)
    if (next === "refunded") {
      message.info("Trạng thái 'Đã hoàn tiền' không thể cập nhật trực tiếp tại đây.")
      return
    }
    try {
      setActionLoading(record.id)

      if (next === "paid") {
        // ✅ Gửi reconciliation lên BE (chỉ reconciliation_status, không gửi order_admin_status)
        await orderService.updateOrderStatus(record.originalData!.id, undefined, "Done")

        // Optimistic UI: set paid ngay
        setAllOrders(prev => prev.map(o => (o.id === record.id ? { ...o, paymentStatus: "paid" } : o)))
      } else {
        // Các trạng thái khác giữ nguyên hành vi cũ (BE có thể chưa hỗ trợ)
        const apiVal = toApiPayment[next] as "Pending" | "Completed" | "Failed"
        await orderService.updatePaymentStatus(record.originalData!.id, apiVal)
      }

      // Đồng bộ lại với BE để cập nhật reconciliation_status / admin_status …
      await fetchOrders(serverPage, serverPageSize)

      message.success(next === "paid"
        ? "Đối soát thành công, đã đánh dấu ĐÃ THANH TOÁN"
        : "Cập nhật trạng thái thanh toán thành công")
    } catch (e: any) {
      message.warning(e?.message || "Không thể cập nhật trạng thái thanh toán.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset = () => {
    setSearchText("")
    setPaymentStatusFilter("all")
    setPaymentMethodFilter("all")
    setDateRange(null)
  }

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    Modal.confirm({
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
          await new Promise((resolve) => setTimeout(resolve, 1000))
          // Sau khi xóa ở BE (nếu có), gọi lại list để đồng bộ phân trang
          await fetchOrders(serverPage, serverPageSize)
          message.success("Xóa đơn hàng thành công")
        } catch {
          message.error("Lỗi khi xóa đơn hàng")
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handleCancelOrder = async () => {
    if (!orderToCancel) return
    if (!cancelForm.cancel_reason.trim()) {
      message.error("Vui lòng nhập lý do hủy đơn hàng")
      return
    }

    try {
      setActionLoading(orderToCancel.id)
      const originalOrderId = orderToCancel.originalData?.id
      if (!originalOrderId) throw new Error("Không tìm thấy ID đơn hàng gốc")

      const cancelData: CancelOrderData = {
        cancel_reason: cancelForm.cancel_reason.trim(),
        cancel_type: cancelForm.cancel_type,
      }

      await orderService.cancelOrder(originalOrderId, cancelData)

      // refresh từ server để đúng phân trang
      await fetchOrders(serverPage, serverPageSize)

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

  const showCancelModal = (order: OrderData) => {
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
    } as const
    return (colors as any)[status] || "default"
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
    } as const
    return (texts as any)[status] || status
  }

  const getPaymentStatusColor = (status: OrderData["paymentStatus"]) => {
    const colors = {
      pending: "orange",
      paid: "green",
      failed: "red",
      refunded: "purple",
    } as const
    return (colors as any)[status] || "default"
  }

  const getPaymentStatusText = (status: OrderData["paymentStatus"]) => {
    const texts = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán thất bại",
      refunded: "Đã hoàn tiền",
    } as const
    return (texts as any)[status] || status
  }

const getPaymentMethodText = (method: OrderData["paymentMethod"]) => {
  const texts = {
    cod: "COD",
    vnpay: "VNPAY",               // ⬅️ đổi từ “Ví điện tử” -> “VNPAY”
  } as const
  return (texts as any)[method] || method
}


  const getActionItems = (record: OrderData): MenuProps["items"] => [
    { key: "view", icon: <EyeOutlined />, label: "Xem chi tiết", onClick: () => showOrderDetail(record) },
    { key: "edit", icon: <EditOutlined />, label: "Chỉnh sửa", disabled: ["delivered", "cancelled", "returned"].includes(record.status) },
    {
      key: "cancel",
      icon: <DeleteOutlined />,
      label: "Hủy đơn hàng",
      disabled: ["delivered", "cancelled", "returned"].includes(record.status),
      onClick: () => showCancelModal(record),
    },
    { key: "print", icon: <PrinterOutlined />, label: "In đơn hàng" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Xóa đơn hàng", danger: true, onClick: () => handleDeleteOrder(record.id, record.orderNumber) },
  ]

  // Dropdown cho TRẠNG THÁI XỬ LÝ
  const renderStatusDropdown = (record: OrderData) => {
    const isDisabled = ["delivered", "cancelled", "returned"].includes(record.status)
    const handleStatusClick = (newStatus: OrderData["status"]) => handleUpdateOrderStatus(record.id, newStatus)

    return (
      <Dropdown
        menu={{
          items: [
            { key: "pending", label: "Chờ xử lý", disabled: record.status === "pending", onClick: () => handleStatusClick("pending") },
            { key: "confirmed", label: "Đang xử lý", disabled: record.status === "confirmed", onClick: () => handleStatusClick("confirmed") },
            { key: "processing", label: "Đã xử lý", disabled: record.status === "processing", onClick: () => handleStatusClick("processing") },
            { key: "shipping", label: "Đang giao hàng", disabled: record.status === "shipping", onClick: () => handleStatusClick("shipping") },
            { key: "delivered", label: "Đã giao hàng", disabled: record.status === "delivered", onClick: () => handleStatusClick("delivered") },
            { key: "cancelled", label: "Hủy bởi Seller", disabled: record.status === "cancelled", onClick: () => handleStatusClick("cancelled") },
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
  }

  // Dropdown cho THANH TOÁN
  const renderPaymentDropdown = (record: OrderData) => {
    const editableBase = canEditPayment(record.status)
    // Khóa nếu UI đã paid hoặc BE đã đối soát/đã Reconciled
    const alreadyReconciled =
      record.originalData?.reconciliation_status === "Done" ||
      record.originalData?.order_admin_status === "Reconciled"

    const isLockedPaid = record.paymentStatus === "paid" || alreadyReconciled
    const editable = editableBase && !isLockedPaid

    const items: MenuProps["items"] = [
      {
        key: "pending",
        label: "Chờ thanh toán",
        disabled: record.paymentStatus === "pending",
        onClick: () => handleUpdatePaymentStatus(record, "pending"),
      },
      {
        key: "paid",
        label: "Đã thanh toán",
        disabled: record.paymentStatus === "paid",
        onClick: () => handleUpdatePaymentStatus(record, "paid"),
      },
      // {
      //   key: "failed",
      //   label: "Thanh toán thất bại",
      //   disabled: record.paymentStatus === "failed",
      //   onClick: () => handleUpdatePaymentStatus(record, "failed"),
      // },
    ]

    return (
      <Tooltip title={isLockedPaid ? "Đã thanh toán/đối soát - không thể chỉnh sửa" : undefined}>
        <Dropdown menu={{ items }} trigger={["click"]} disabled={!editable}>
          <Tag
            color={getPaymentStatusColor(record.paymentStatus)}
            style={{
              cursor: editable ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              width: "fit-content",
              opacity: editable ? 1 : 0.7,
            }}
          >
            {getPaymentStatusText(record.paymentStatus)}
            {editable && <DownOutlined style={{ fontSize: 10 }} />}
          </Tag>
        </Dropdown>
      </Tooltip>
    )
  }

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
    { title: "Trạng thái xử lý", key: "orderStatus", width: 120, render: (_, record) => renderStatusDropdown(record) },
    { title: "Thanh toán", key: "paymentStatus", width: 120, render: (_, record) => renderPaymentDropdown(record) },
    {
      title: "Tổng tiền",
      key: "total",
      width: 110,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#f5222d" }}>
            <Tooltip title={`${record.total.toLocaleString("vi-VN")} ₫`}>
              {record.total > 1_000_000_000
                ? `${(record.total / 1_000_000_000).toFixed(1)}B ₫`
                : record.total > 1_000_000
                ? `${(record.total / 1_000_000).toFixed(1)}M ₫`
                : `${(record.total / 1_000).toFixed(0)}K ₫`}
            </Tooltip>
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>{getPaymentMethodText(record.paymentMethod)}</div>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      key: "address",
      width: 140,
      render: (_, record) => {
        const full = formatAddress(record.shippingAddress)
        const short =
          record.shippingAddress.province ||
          record.shippingAddress.district ||
          record.shippingAddress.ward ||
          record.shippingAddress.address ||
          "-"
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{record.shippingAddress.fullName}</div>
            <div style={{ fontSize: 11, color: "#666" }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              <Tooltip title={full}>{short}</Tooltip>
            </div>
          </div>
        )
      },
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

  const showOrderDetail = async (order: OrderData) => {
    setSelectedOrder(order)
    setIsModalVisible(true)
    setDetailLoading(true)
    try {
      if (order.originalData?.id) {
        const detail = await orderService.fetchOrderDetail(order.originalData.id)
        setOrderDetail(detail)
      }
    } catch (error: any) {
      message.error(`Lỗi khi tải chi tiết đơn hàng: ${error.message}`)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedOrder(null)
    setOrderDetail(null)
  }

  const handleRefresh = () => {
    fetchOrders(serverPage, serverPageSize)
  }

  const handlePrintOrder = () => {
    if (isModalVisible && selectedOrder) {
      const printContent = (document.querySelector(".ant-modal-body") as HTMLElement | null)?.innerHTML
      const printWindow = window.open("", "_blank")
      if (printWindow && printContent) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Chi tiết đơn hàng ${selectedOrder.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .ant-card { border: 1px solid #d9d9d9; margin-bottom: 16px; }
                .ant-card-head { background: #fafafa; padding: 8px 16px; border-bottom: 1px solid #d9d9d9; font-weight: bold; }
                .ant-card-body { padding: 16px; }
                .ant-row { display: flex; margin-bottom: 8px; }
                .ant-col { flex: 1; }
                .ant-image img, img {
                  max-width: 50px !important;
                  max-height: 50px !important;
                  width: 50px !important;
                  height: 50px !important;
                  object-fit: cover !important;
                  display: block !important;
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              <h2>Chi tiết đơn hàng ${selectedOrder.orderNumber}</h2>
              ${printContent}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 1000)
        }
      }
    } else {
      window.print()
    }
  }

  return (
    <div style={{ padding: "2px" }}>
      <style jsx global>{`
        @media print {
          body > div:not(.ant-table-wrapper) {
            display: none !important;
          }
          .ant-modal-mask,
          .ant-modal-wrap {
            position: static !important;
          }
          .ant-modal {
            position: static !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .ant-modal-content {
            box-shadow: none !important;
          }
          .ant-modal-header,
          .ant-modal-footer {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        .ant-btn-primary {
          background-color: #db4444 !important;
          border-color: #db4444 !important;
        }
        .ant-btn-primary:hover {
          background-color: #c73e3e !important;
          border-color: #c73e3e !important;
        }
        .ant-btn:not(.ant-btn-primary):not(.ant-btn-danger):not(.ant-btn-text) {
          border-color: #db4444 !important;
          color: #db4444 !important;
        }
        .ant-btn:not(.ant-btn-primary):not(.ant-btn-danger):not(.ant-btn-text):hover {
          border-color: #c73e3e !important;
          color: #c73e3e !important;
        }
      `}</style>

      {/* ====== SERVER SUMMARY (không tính FE) ====== */}
      {serverSummary && (
        <>
          {/* Hàng 1: Tổng đơn + Tổng doanh thu */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Card size="small">
                <Statistic
                  title="Tổng đơn"
                  value={serverSummary.total_orders ?? 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small">
                <Statistic
                  title="Tổng doanh thu"
                  value={serverSummary.revenue_total ?? 0}
                  prefix={<DollarOutlined />}
                  suffix="₫"
                  valueStyle={{ color: "#f5222d" }}
                  formatter={(val) => <span>{(Number(val) || 0).toLocaleString("vi-VN")}</span>}
                />
              </Card>
            </Col>
          </Row>

          {/* Hàng 2: 5 trạng thái */}
          <Row gutter={16} wrap style={{ marginBottom: 24 }}>
            {["Delivered", "Pending", "Return Requested", "Canceled", "Returning"].map((key) => {
              const meta = orderStatusMeta[key] ?? { label: key, color: "#595959", icon: null }
              const count = serverSummary.order_status_counts?.[key] ?? 0
              return (
                <Col key={key} flex="1 0 20%">
                  <Card size="small">
                    <Statistic title={meta.label} value={count} prefix={meta.icon} valueStyle={{ color: meta.color }} />
                  </Card>
                </Col>
              )
            })}
          </Row>
        </>
      )}

      {/* ====== Filters ====== */}
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
            <Select placeholder="Trạng thái thanh toán" value={paymentStatusFilter} onChange={setPaymentStatusFilter} style={{ width: "100%" }}>
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
  <Option value="e_wallet">VNPAY</Option>
</Select>

          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <RangePicker value={dateRange} onChange={setDateRange} format="DD/MM/YYYY" placeholder={["Từ ngày", "Đến ngày"]} style={{ width: "100%" }} />
          </Col>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Space wrap>
              <Button icon={<FilterOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}>
                Làm mới
              </Button>
              <Button icon={<PrinterOutlined />} className="no-print" onClick={handlePrintOrder}>
                In đơn hàng
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Text type="secondary">Hiển thị {allOrders.length} / {serverTotal} đơn hàng • Trang {serverPage}/{serverLastPage}</Text>
          </Col>
        </Row>

        {/* Status Tabs (filter server) */}
        <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => { setActiveTab(k); setServerPage(1); }}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              { key: "pending",    label: <span><span style={{ color: "#faad14" }}>🟡</span> Chờ xác nhận</span> },
              { key: "confirmed",  label: <span><span style={{ color: "#1890ff" }}>🔵</span> Đã xác nhận</span> },
              { key: "processing", label: <span><span style={{ color: "#13c2c2" }}>🟢</span> Đang xử lý</span> },
              { key: "shipping",   label: <span><span style={{ color: "#722ed1" }}>🟣</span> Đang giao</span> },
              { key: "delivered",  label: <span><span style={{ color: "#52c41a" }}>✅</span> Đã giao</span> },
              { key: "cancelled",  label: <span><span style={{ color: "#f5222d" }}>❌</span> Đã hủy</span> },
              { key: "returned",   label: <span><span style={{ color: "#eb2f96" }}>↩️</span> Đã trả</span> },
              { key: "all",        label: <span><span style={{ color: "#666" }}>⚪</span> Tất cả</span> },
            ]}
          />
        </div>
      </Card>

      {/* ====== Orders Table ====== */}
      <Card style={{ marginTop: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={allOrders}  // ⬅️ KHÔNG lọc FE, dữ liệu đã được BE lọc
            rowKey="id"
            pagination={{
              current: serverPage,
              pageSize: serverPageSize,
              total: serverTotal,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
            }}
            onChange={(pg) => {
              const nextPage = pg.current ?? 1
              const nextSize = pg.pageSize ?? serverPageSize
              setServerPage(nextPage)
              setServerPageSize(nextSize)
              fetchOrders(nextPage, nextSize) // giữ nguyên filter server
            }}
            size="middle"
            scroll={{ x: "max-content" }}
          />
        </Spin>
      </Card>

      {/* ====== Confirm Modal ====== */}
      <Modal
        title="Xác nhận cập nhật trạng thái"
        open={confirmModalVisible}
        onOk={handleConfirmStatusUpdate}
        onCancel={handleCancelStatusUpdate}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okButtonProps={{ loading: actionLoading === pendingStatusUpdate?.orderId }}
      >
        {pendingStatusUpdate && (
          <div>
            <p>
              Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng <strong>{pendingStatusUpdate.orderNumber}</strong> thành{" "}
              <strong>"{getStatusText(pendingStatusUpdate.newStatus)}"</strong>?
            </p>
          </div>
        )}
      </Modal>

      {/* ====== Cancel Order Modal ====== */}
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
            <div style={{ padding: 12, backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: 6, marginTop: 16 }}>
              <Text type="danger" style={{ fontWeight: "bold" }}>
                ⚠️ Cảnh báo: Hành động này sẽ hủy đơn hàng và không thể hoàn tác!
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* ====== Order Detail Modal ====== */}
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
            <Button key="print" icon={<PrinterOutlined />} onClick={handlePrintOrder}>
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
              <Card title="Sản phẩm đặt hàng" size="small" style={{ marginBottom: 16 }}>
                <Spin spinning={detailLoading}>
                  {orderDetail?.details
                    ? orderDetail.details.map((item) => (
                        <Row key={item.id} style={{ marginBottom: 12, padding: 8, border: "1px solid #f0f0f0", borderRadius: 4 }}>
                          <Col span={4}>
                            <Image
                              src={
                                item.product_image
                                  ? item.product_image.startsWith("http") || item.product_image.startsWith("/")
                                    ? item.product_image
                                    : `${STATIC_BASE_URL}/${item.product_image}`
                                  : `/placeholder.svg?height=60&width=60&text=Product${item.product_id}`
                              }
                              width={50}
                              height={50}
                              alt={`Product ${item.product_id}`}
                              fallback="/placeholder.svg?height=60&width=60&text=Error"
                            />
                          </Col>
                          <Col span={12}>
                            <div style={{ fontWeight: 500 }}>{item.product_name || `Sản phẩm ID: ${item.product_id}`}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {item.product_option}: {item.product_value}
                            </div>
                          </Col>
                          <Col span={4} style={{ textAlign: "center" }}>
                            <div>SL: {item.quantity}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{Number(item.price_at_time).toLocaleString("vi-VN")} ₫</div>
                          </Col>
                          <Col span={4} style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "bold", color: "#f5222d" }}>{Number(item.subtotal).toLocaleString("vi-VN")} ₫</div>
                          </Col>
                        </Row>
                      ))
                    : selectedOrder?.items.map((item) => (
                        <Row key={item.id} style={{ marginBottom: 12, padding: 8, border: "1px solid #f0f0f0", borderRadius: 4 }}>
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
                </Spin>

                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, marginTop: 12 }}>
                  <Row justify="end">
                    <Col span={8}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span>Tạm tính:</span>
                        <span>
                          {orderDetail?.order
                            ? Number(orderDetail.order.total_amount).toLocaleString("vi-VN")
                            : selectedOrder?.subtotal.toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span>Phí vận chuyển:</span>
                        <span>
                          {orderDetail?.order
                            ? (Number(orderDetail.order.final_amount) - Number(orderDetail.order.total_amount)).toLocaleString("vi-VN")
                            : selectedOrder?.shippingFee.toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 16, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                        <span>Tổng cộng:</span>
                        <span style={{ color: "#f5222d" }}>
                          {orderDetail?.order ? Number(orderDetail.order.final_amount).toLocaleString("vi-VN") : selectedOrder?.total.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>

              <Card title="Lịch sử đơn hàng" size="small">
                <Timeline>
                  <Timeline.Item color="blue" dot={<CalendarOutlined />}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Đặt hàng</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{dayjs(selectedOrder.orderDate).format("DD/MM/YYYY HH:mm")}</div>
                    </div>
                  </Timeline.Item>
                  {selectedOrder.confirmedDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Xác nhận đơn hàng</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{dayjs(selectedOrder.confirmedDate).format("DD/MM/YYYY HH:mm")}</div>
                      </div>
                    </Timeline.Item>
                  )}
                  {selectedOrder.shippedDate && (
                    <Timeline.Item color="purple" dot={<TruckOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Bắt đầu giao hàng</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{dayjs(selectedOrder.shippedDate).format("DD/MM/YYYY HH:mm")}</div>
                      </div>
                    </Timeline.Item>
                  )}
                  {selectedOrder.deliveredDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Giao hàng thành công</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{dayjs(selectedOrder.deliveredDate).format("DD/MM/YYYY HH:mm")}</div>
                      </div>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </Col>

            <Col span={8}>
              <Card title="Thông tin khách hàng" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Tên khách hàng">{selectedOrder.customer.name}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{selectedOrder.customer.phone}</Descriptions.Item>
                  <Descriptions.Item label="Email">{selectedOrder.customer.email}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Địa chỉ giao hàng" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Người nhận">{selectedOrder.shippingAddress.fullName}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{selectedOrder.shippingAddress.phone}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district},{" "}
                    {selectedOrder.shippingAddress.province}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Thông tin thanh toán" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Phương thức">{getPaymentMethodText(selectedOrder.paymentMethod)}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getPaymentStatusColor(selectedOrder.paymentStatus)}>{getPaymentStatusText(selectedOrder.paymentStatus)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền">
                    <Text strong style={{ color: "#f5222d" }}>{selectedOrder.total.toLocaleString("vi-VN")} ₫</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {selectedOrder.notes && (
                <Card title="Ghi chú" size="small">
                  <Text>{selectedOrder.notes}</Text>
                </Card>
              )}
            </Col>
          </Row>
        </Modal>
      )}
    </div>
  )
}
