"use client"

import type React from "react"
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

// Mock data generator
const generateMockOrders = (): OrderData[] => {
  const statuses: OrderData["status"][] = [
    "pending",
    "confirmed",
    "processing",
    "shipping",
    "delivered",
    "cancelled",
    "returned",
  ]
  const paymentStatuses: OrderData["paymentStatus"][] = ["pending", "paid", "failed", "refunded"]
  const paymentMethods: OrderData["paymentMethod"][] = ["cod", "bank_transfer", "e_wallet", "credit_card"]

  const customers = [
    { id: "CUST001", name: "Nguyễn Văn An", phone: "0901234567", email: "an.nguyen@email.com" },
    { id: "CUST002", name: "Trần Thị Bình", phone: "0912345678", email: "binh.tran@email.com" },
    { id: "CUST003", name: "Lê Văn Cường", phone: "0923456789", email: "cuong.le@email.com" },
    { id: "CUST004", name: "Phạm Thị Dung", phone: "0934567890", email: "dung.pham@email.com" },
    { id: "CUST005", name: "Hoàng Văn Em", phone: "0945678901", email: "em.hoang@email.com" },
  ]

  const products = [
    { name: "iPhone 15 Pro Max", price: 29990000, image: "/placeholder.svg?height=60&width=60&text=iPhone" },
    { name: "Samsung Galaxy S24", price: 22990000, image: "/placeholder.svg?height=60&width=60&text=Samsung" },
    { name: "MacBook Air M3", price: 34990000, image: "/placeholder.svg?height=60&width=60&text=MacBook" },
    { name: "iPad Pro 12.9", price: 26990000, image: "/placeholder.svg?height=60&width=60&text=iPad" },
    { name: "AirPods Pro", price: 6990000, image: "/placeholder.svg?height=60&width=60&text=AirPods" },
    { name: "Apple Watch Series 9", price: 9990000, image: "/placeholder.svg?height=60&width=60&text=Watch" },
  ]

  const shops = ["TechStore Hà Nội", "Mobile World", "FPT Shop", "CellphoneS", "Thế Giới Di Động", "Viettel Store"]

  const provinces = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"]

  return Array.from({ length: 150 }, (_, index) => {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    const orderDate = dayjs().subtract(Math.floor(Math.random() * 30), "day")

    // Generate order items
    const itemCount = Math.floor(Math.random() * 3) + 1
    const items: OrderItem[] = Array.from({ length: itemCount }, (_, itemIndex) => {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const total = product.price * quantity

      return {
        id: `ITEM${String(index + 1).padStart(3, "0")}_${itemIndex + 1}`,
        productName: product.name,
        productImage: product.image,
        quantity,
        price: product.price,
        total,
        variant: Math.random() > 0.5 ? "256GB - Xanh" : undefined,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const shippingFee = Math.floor(Math.random() * 50000) + 20000
    const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0
    const total = subtotal + shippingFee - discount

    const province = provinces[Math.floor(Math.random() * provinces.length)]

    return {
      id: `ORDER${String(index + 1).padStart(3, "0")}`,
      orderNumber: `ORD${String(index + 1).padStart(6, "0")}`,
      customer,
      items,
      status,
      paymentStatus,
      paymentMethod,
      shippingAddress: {
        fullName: customer.name,
        phone: customer.phone,
        address: `${Math.floor(Math.random() * 999) + 1} Đường ${Math.floor(Math.random() * 50) + 1}`,
        ward: `Phường ${Math.floor(Math.random() * 20) + 1}`,
        district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
        province,
      },
      shippingFee,
      discount,
      subtotal,
      total,
      orderDate: orderDate.toISOString(),
      confirmedDate: status !== "pending" ? orderDate.add(1, "hour").toISOString() : undefined,
      shippedDate: ["shipping", "delivered"].includes(status) ? orderDate.add(1, "day").toISOString() : undefined,
      deliveredDate: status === "delivered" ? orderDate.add(3, "day").toISOString() : undefined,
      notes: Math.random() > 0.7 ? "Giao hàng ngoài giờ hành chính" : undefined,
      shopName: shops[Math.floor(Math.random() * shops.length)],
      shopId: `SHOP${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
    }
  })
}

export default function OrderManagementPage() {
  const [allOrders, setAllOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Initialize mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setAllOrders(generateMockOrders())
      setLoading(false)
    }, 1000)
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

      const matchesStatus = statusFilter === "all" || order.status === statusFilter
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
  }, [allOrders, searchText, statusFilter, paymentStatusFilter, paymentMethodFilter, dateRange])

  const handleReset = () => {
    setSearchText("")
    setStatusFilter("all")
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
      key: "confirm",
      label: "Xác nhận đơn hàng",
      disabled: record.status !== "pending",
      onClick: () => handleUpdateOrderStatus(record.id, "confirmed"),
    },
    {
      key: "process",
      label: "Bắt đầu xử lý",
      disabled: record.status !== "confirmed",
      onClick: () => handleUpdateOrderStatus(record.id, "processing"),
    },
    {
      key: "ship",
      label: "Giao hàng",
      disabled: record.status !== "processing",
      onClick: () => handleUpdateOrderStatus(record.id, "shipping"),
    },
    {
      key: "deliver",
      label: "Hoàn thành",
      disabled: record.status !== "shipping",
      onClick: () => handleUpdateOrderStatus(record.id, "delivered"),
    },
    {
      type: "divider",
    },
    {
      key: "cancel",
      label: "Hủy đơn hàng",
      danger: true,
      disabled: ["delivered", "cancelled", "returned"].includes(record.status),
      onClick: () => handleUpdateOrderStatus(record.id, "cancelled"),
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
      width: 200,
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
      width: 180,
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
      width: 200,
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
      width: 120,
      render: (_, record) => <Tag color={getStatusColor(record.status)}>{getStatusText(record.status)}</Tag>,
      filters: [
        { text: "Chờ xác nhận", value: "pending" },
        { text: "Đã xác nhận", value: "confirmed" },
        { text: "Đang xử lý", value: "processing" },
        { text: "Đang giao", value: "shipping" },
        { text: "Đã giao", value: "delivered" },
        { text: "Đã hủy", value: "cancelled" },
        { text: "Đã trả", value: "returned" },
      ],
      onFilter: (value: boolean | React.Key, record: OrderData) => {
        return record.status === String(value)
      },
    },
    {
      title: "Thanh toán",
      key: "paymentStatus",
      width: 120,
      render: (_, record) => (
        <Tag color={getPaymentStatusColor(record.paymentStatus)}>{getPaymentStatusText(record.paymentStatus)}</Tag>
      ),
      filters: [
        { text: "Chờ thanh toán", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Thất bại", value: "failed" },
        { text: "Đã hoàn tiền", value: "refunded" },
      ],
      onFilter: (value: boolean | React.Key, record: OrderData) => {
        return record.paymentStatus === String(value)
      },
    },
    {
      title: "Tổng tiền",
      key: "total",
      width: 120,
      render: (_, record) => (
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
      ),
      sorter: (a: OrderData, b: OrderData) => a.total - b.total,
    },
    {
      title: "Địa chỉ",
      key: "address",
      width: 150,
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
      width: 80,
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
      setAllOrders(generateMockOrders())
      setLoading(false)
    }, 1000)
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
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý đơn hàng</Title>
        <Text type="secondary">Quản lý và theo dõi tất cả đơn hàng trong hệ thống</Text>
      </div>

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
                  ? (stats.totalRevenue / 1000000000).toFixed(1) + "B"
                  : stats.totalRevenue > 1000000
                    ? (stats.totalRevenue / 1000000).toFixed(1) + "M"
                    : (stats.totalRevenue / 1000).toFixed(0) + "K"
              }
              prefix={<DollarOutlined />}
              suffix="₫"
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6} md={4}>
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="Trạng thái đơn hàng"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="processing">Đang xử lý</Option>
              <Option value="shipping">Đang giao</Option>
              <Option value="delivered">Đã giao</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="returned">Đã trả</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
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
          <Col xs={24} sm={6} md={4}>
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
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={2}>
            <Space>
              <Button icon={<FilterOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                Làm mới
              </Button>
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
      </Card>

      {/* Orders Table */}
      <Card>
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
            scroll={{ x: 1200 }}
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
