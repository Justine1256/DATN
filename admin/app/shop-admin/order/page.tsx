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
  Steps,
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
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import type { MenuProps } from "antd"
import dayjs from "dayjs"

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { confirm } = Modal
const { Step } = Steps

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
}

// Static mock data
const mockOrders: OrderData[] = [
  {
    id: "ORDER001",
    orderNumber: "ORD000001",
    customer: {
      id: "CUST001",
      name: "Nguyễn Văn An",
      phone: "0901234567",
      email: "an.nguyen@email.com",
    },
    items: [
      {
        id: "ITEM001_1",
        productName: "iPhone 15 Pro Max",
        productImage: "/placeholder.svg?height=60&width=60&text=iPhone",
        quantity: 1,
        price: 29990000,
        total: 29990000,
        variant: "256GB - Titan Tự Nhiên",
      },
    ],
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    shippingAddress: {
      fullName: "Nguyễn Văn An",
      phone: "0901234567",
      address: "123 Đường Láng",
      ward: "Phường Láng Thượng",
      district: "Quận Đống Đa",
      province: "Hà Nội",
    },
    shippingFee: 30000,
    discount: 0,
    subtotal: 29990000,
    total: 30020000,
    orderDate: "2024-01-15T10:30:00Z",
    confirmedDate: "2024-01-15T11:00:00Z",
    shippedDate: "2024-01-16T09:00:00Z",
    deliveredDate: "2024-01-18T14:30:00Z",
    shopName: "TechStore Hà Nội",
    shopId: "SHOP001",
  },
  {
    id: "ORDER002",
    orderNumber: "ORD000002",
    customer: {
      id: "CUST002",
      name: "Trần Thị Bình",
      phone: "0912345678",
      email: "binh.tran@email.com",
    },
    items: [
      {
        id: "ITEM002_1",
        productName: "Samsung Galaxy S24",
        productImage: "/placeholder.svg?height=60&width=60&text=Samsung",
        quantity: 1,
        price: 22990000,
        total: 22990000,
      },
      {
        id: "ITEM002_2",
        productName: "AirPods Pro",
        productImage: "/placeholder.svg?height=60&width=60&text=AirPods",
        quantity: 1,
        price: 6990000,
        total: 6990000,
      },
    ],
    status: "shipping",
    paymentStatus: "paid",
    paymentMethod: "e_wallet",
    shippingAddress: {
      fullName: "Trần Thị Bình",
      phone: "0912345678",
      address: "456 Nguyễn Trãi",
      ward: "Phường Thanh Xuân Trung",
      district: "Quận Thanh Xuân",
      province: "Hà Nội",
    },
    shippingFee: 25000,
    discount: 2998000,
    subtotal: 29980000,
    total: 27007000,
    orderDate: "2024-01-20T14:15:00Z",
    confirmedDate: "2024-01-20T15:00:00Z",
    shippedDate: "2024-01-21T08:30:00Z",
    notes: "Giao hàng ngoài giờ hành chính",
    shopName: "Mobile World",
    shopId: "SHOP002",
  },
  {
    id: "ORDER003",
    orderNumber: "ORD000003",
    customer: {
      id: "CUST003",
      name: "Lê Văn Cường",
      phone: "0923456789",
      email: "cuong.le@email.com",
    },
    items: [
      {
        id: "ITEM003_1",
        productName: "MacBook Air M3",
        productImage: "/placeholder.svg?height=60&width=60&text=MacBook",
        quantity: 1,
        price: 34990000,
        total: 34990000,
        variant: "13 inch - 8GB RAM - 256GB SSD",
      },
    ],
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    shippingAddress: {
      fullName: "Lê Văn Cường",
      phone: "0923456789",
      address: "789 Cầu Giấy",
      ward: "Phường Dịch Vọng",
      district: "Quận Cầu Giấy",
      province: "Hà Nội",
    },
    shippingFee: 0,
    discount: 3499000,
    subtotal: 34990000,
    total: 31491000,
    orderDate: "2024-01-22T09:45:00Z",
    confirmedDate: "2024-01-22T10:30:00Z",
    shopName: "FPT Shop",
    shopId: "SHOP003",
  },
  {
    id: "ORDER004",
    orderNumber: "ORD000004",
    customer: {
      id: "CUST004",
      name: "Phạm Thị Dung",
      phone: "0934567890",
      email: "dung.pham@email.com",
    },
    items: [
      {
        id: "ITEM004_1",
        productName: "iPad Pro 12.9",
        productImage: "/placeholder.svg?height=60&width=60&text=iPad",
        quantity: 1,
        price: 26990000,
        total: 26990000,
        variant: "Wi-Fi - 128GB - Xám",
      },
      {
        id: "ITEM004_2",
        productName: "Apple Watch Series 9",
        productImage: "/placeholder.svg?height=60&width=60&text=Watch",
        quantity: 1,
        price: 9990000,
        total: 9990000,
        variant: "41mm - GPS - Dây Sport",
      },
    ],
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cod",
    shippingAddress: {
      fullName: "Phạm Thị Dung",
      phone: "0934567890",
      address: "321 Hoàng Quốc Việt",
      ward: "Phường Nghĩa Đô",
      district: "Quận Cầu Giấy",
      province: "Hà Nội",
    },
    shippingFee: 35000,
    discount: 0,
    subtotal: 36980000,
    total: 37015000,
    orderDate: "2024-01-25T16:20:00Z",
    shopName: "CellphoneS",
    shopId: "SHOP004",
  },
  {
    id: "ORDER005",
    orderNumber: "ORD000005",
    customer: {
      id: "CUST005",
      name: "Hoàng Văn Em",
      phone: "0945678901",
      email: "em.hoang@email.com",
    },
    items: [
      {
        id: "ITEM005_1",
        productName: "Samsung Galaxy S24",
        productImage: "/placeholder.svg?height=60&width=60&text=Samsung",
        quantity: 2,
        price: 22990000,
        total: 45980000,
      },
    ],
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    shippingAddress: {
      fullName: "Hoàng Văn Em",
      phone: "0945678901",
      address: "654 Lê Văn Lương",
      ward: "Phường Nhân Chính",
      district: "Quận Thanh Xuân",
      province: "Hà Nội",
    },
    shippingFee: 40000,
    discount: 4598000,
    subtotal: 45980000,
    total: 41422000,
    orderDate: "2024-01-24T11:10:00Z",
    confirmedDate: "2024-01-24T12:00:00Z",
    shopName: "Thế Giới Di Động",
    shopId: "SHOP005",
  },
  {
    id: "ORDER006",
    orderNumber: "ORD000006",
    customer: {
      id: "CUST001",
      name: "Nguyễn Văn An",
      phone: "0901234567",
      email: "an.nguyen@email.com",
    },
    items: [
      {
        id: "ITEM006_1",
        productName: "AirPods Pro",
        productImage: "/placeholder.svg?height=60&width=60&text=AirPods",
        quantity: 1,
        price: 6990000,
        total: 6990000,
      },
    ],
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "e_wallet",
    shippingAddress: {
      fullName: "Nguyễn Văn An",
      phone: "0901234567",
      address: "123 Đường Láng",
      ward: "Phường Láng Thượng",
      district: "Quận Đống Đa",
      province: "Hà Nội",
    },
    shippingFee: 25000,
    discount: 0,
    subtotal: 6990000,
    total: 7015000,
    orderDate: "2024-01-23T13:45:00Z",
    confirmedDate: "2024-01-23T14:00:00Z",
    notes: "Khách hàng yêu cầu hủy đơn",
    shopName: "Viettel Store",
    shopId: "SHOP006",
  },
  {
    id: "ORDER007",
    orderNumber: "ORD000007",
    customer: {
      id: "CUST002",
      name: "Trần Thị Bình",
      phone: "0912345678",
      email: "binh.tran@email.com",
    },
    items: [
      {
        id: "ITEM007_1",
        productName: "iPhone 15 Pro Max",
        productImage: "/placeholder.svg?height=60&width=60&text=iPhone",
        quantity: 1,
        price: 29990000,
        total: 29990000,
        variant: "512GB - Titan Xanh",
      },
      {
        id: "ITEM007_2",
        productName: "Apple Watch Series 9",
        productImage: "/placeholder.svg?height=60&width=60&text=Watch",
        quantity: 1,
        price: 9990000,
        total: 9990000,
        variant: "45mm - GPS + Cellular",
      },
    ],
    status: "returned",
    paymentStatus: "refunded",
    paymentMethod: "credit_card",
    shippingAddress: {
      fullName: "Trần Thị Bình",
      phone: "0912345678",
      address: "456 Nguyễn Trãi",
      ward: "Phường Thanh Xuân Trung",
      district: "Quận Thanh Xuân",
      province: "Hà Nội",
    },
    shippingFee: 30000,
    discount: 3999000,
    subtotal: 39980000,
    total: 36011000,
    orderDate: "2024-01-18T08:30:00Z",
    confirmedDate: "2024-01-18T09:15:00Z",
    shippedDate: "2024-01-19T10:00:00Z",
    deliveredDate: "2024-01-21T15:30:00Z",
    notes: "Sản phẩm bị lỗi, khách hàng trả lại",
    shopName: "TechStore Hà Nội",
    shopId: "SHOP001",
  },
  {
    id: "ORDER008",
    orderNumber: "ORD000008",
    customer: {
      id: "CUST003",
      name: "Lê Văn Cường",
      phone: "0923456789",
      email: "cuong.le@email.com",
    },
    items: [
      {
        id: "ITEM008_1",
        productName: "MacBook Air M3",
        productImage: "/placeholder.svg?height=60&width=60&text=MacBook",
        quantity: 1,
        price: 34990000,
        total: 34990000,
        variant: "15 inch - 16GB RAM - 512GB SSD",
      },
    ],
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    shippingAddress: {
      fullName: "Lê Văn Cường",
      phone: "0923456789",
      address: "789 Cầu Giấy",
      ward: "Phường Dịch Vọng",
      district: "Quận Cầu Giấy",
      province: "Hà Nội",
    },
    shippingFee: 0,
    discount: 0,
    subtotal: 34990000,
    total: 34990000,
    orderDate: "2024-01-16T12:00:00Z",
    confirmedDate: "2024-01-16T13:30:00Z",
    shippedDate: "2024-01-17T09:00:00Z",
    deliveredDate: "2024-01-19T16:45:00Z",
    shopName: "FPT Shop",
    shopId: "SHOP003",
  },
  {
    id: "ORDER009",
    orderNumber: "ORD000009",
    customer: {
      id: "CUST004",
      name: "Phạm Thị Dung",
      phone: "0934567890",
      email: "dung.pham@email.com",
    },
    items: [
      {
        id: "ITEM009_1",
        productName: "Samsung Galaxy S24",
        productImage: "/placeholder.svg?height=60&width=60&text=Samsung",
        quantity: 1,
        price: 22990000,
        total: 22990000,
        variant: "256GB - Tím",
      },
    ],
    status: "processing",
    paymentStatus: "failed",
    paymentMethod: "credit_card",
    shippingAddress: {
      fullName: "Phạm Thị Dung",
      phone: "0934567890",
      address: "321 Hoàng Quốc Việt",
      ward: "Phường Nghĩa Đô",
      district: "Quận Cầu Giấy",
      province: "Hà Nội",
    },
    shippingFee: 25000,
    discount: 2299000,
    subtotal: 22990000,
    total: 20716000,
    orderDate: "2024-01-21T15:20:00Z",
    confirmedDate: "2024-01-21T16:00:00Z",
    notes: "Thanh toán thất bại, cần liên hệ khách hàng",
    shopName: "Mobile World",
    shopId: "SHOP002",
  },
  {
    id: "ORDER010",
    orderNumber: "ORD000010",
    customer: {
      id: "CUST005",
      name: "Hoàng Văn Em",
      phone: "0945678901",
      email: "em.hoang@email.com",
    },
    items: [
      {
        id: "ITEM010_1",
        productName: "iPad Pro 12.9",
        productImage: "/placeholder.svg?height=60&width=60&text=iPad",
        quantity: 1,
        price: 26990000,
        total: 26990000,
        variant: "Wi-Fi + Cellular - 256GB",
      },
      {
        id: "ITEM010_2",
        productName: "AirPods Pro",
        productImage: "/placeholder.svg?height=60&width=60&text=AirPods",
        quantity: 2,
        price: 6990000,
        total: 13980000,
      },
    ],
    status: "shipping",
    paymentStatus: "paid",
    paymentMethod: "cod",
    shippingAddress: {
      fullName: "Hoàng Văn Em",
      phone: "0945678901",
      address: "654 Lê Văn Lương",
      ward: "Phường Nhân Chính",
      district: "Quận Thanh Xuân",
      province: "Hà Nội",
    },
    shippingFee: 35000,
    discount: 4097000,
    subtotal: 40970000,
    total: 36908000,
    orderDate: "2024-01-19T10:15:00Z",
    confirmedDate: "2024-01-19T11:00:00Z",
    shippedDate: "2024-01-20T14:30:00Z",
    shopName: "CellphoneS",
    shopId: "SHOP004",
  },
]

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

  // Initialize static data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setAllOrders(mockOrders)
      setLoading(false)
    }, 500)
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
    confirm({
      title: "Xác nhận cập nhật trạng thái",
      content: `Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?`,
      onOk: async () => {
        try {
          setActionLoading(orderId)
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          setAllOrders((prevOrders) =>
            prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
          )
          message.success("Cập nhật trạng thái thành công")
        } catch (error) {
          message.error("Lỗi khi cập nhật trạng thái")
        } finally {
          setActionLoading(null)
        }
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
          // Simulate API call
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
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "pending",
                label: "Chờ xác nhận",
                disabled: record.status === "pending",
                onClick: () => handleUpdateOrderStatus(record.id, "pending"),
              },
              {
                key: "confirmed",
                label: "Đã xác nhận",
                disabled: record.status === "confirmed",
                onClick: () => handleUpdateOrderStatus(record.id, "confirmed"),
              },
              {
                key: "processing",
                label: "Đang xử lý",
                disabled: record.status === "processing",
                onClick: () => handleUpdateOrderStatus(record.id, "processing"),
              },
              {
                key: "shipping",
                label: "Đang giao",
                disabled: record.status === "shipping",
                onClick: () => handleUpdateOrderStatus(record.id, "shipping"),
              },
              {
                key: "delivered",
                label: "Đã giao",
                disabled: record.status === "delivered",
                onClick: () => handleUpdateOrderStatus(record.id, "delivered"),
              },
              {
                key: "cancelled",
                label: "Đã hủy",
                disabled: record.status === "cancelled",
                onClick: () => handleUpdateOrderStatus(record.id, "cancelled"),
              },
              {
                key: "returned",
                label: "Đã trả",
                disabled: record.status === "returned",
                onClick: () => handleUpdateOrderStatus(record.id, "returned"),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Tag color={getStatusColor(record.status)} style={{ cursor: "pointer" }}>
            {getStatusText(record.status)}
          </Tag>
        </Dropdown>
      ),
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
    setLoading(true)
    setTimeout(() => {
      setAllOrders(mockOrders)
      setLoading(false)
    }, 500)
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
  style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
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

        {/* Status Tabs - Di chuyển xuống đây */}
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

      {/* Orders Table - Liền với tabs */}
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
            </Col>
          </Row>
        </Modal>
      )}
    </div>
  )
}
