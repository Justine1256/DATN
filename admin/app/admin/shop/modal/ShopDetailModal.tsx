"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Tabs,
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tag,
  Space,
  Button,
  Table,
  Statistic,
  Image,
  Descriptions,
  Badge,
  message,
  Spin,
  Alert,
  Empty,
} from "antd"
import {
  ShopOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface ShopOwner {
  id: string
  name: string
  phone: string
  email: string
  avatar?: string
}

interface WarningStatus {
  level: string
  color: string
}

interface Product {
  id: string
  name: string
  image: string
  price: number
  stock: number
  sold: number
  status: "active" | "inactive" | "out_of_stock"
  category: string
  rating: number
  reviews: number
}

interface Order {
  id: string
  customerName: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  orderDate: string
  items: number
}

interface ShopData {
  id: string
  name: string
  description: string
  logo?: string
  owner: ShopOwner
  status: string
  registrationDate: string
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalReports: number
  warningStatus: WarningStatus
  address: string
  isVerified: boolean
  rating: number
}

interface ShopDetailModalProps {
  shop: ShopData
  visible: boolean
  onClose: () => void
  onRefresh: () => void
  onUpdateShop: (shop: ShopData) => void
}

// Utility function to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null
  }
  return null
}

// API utility function with authentication
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = getCookie("authToken")

  if (!token) {
    message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
    window.location.href = "/login"
    throw new Error("No authentication token")
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  const response = await fetch(url, config)

  if (response.status === 401) {
    message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/login"
    throw new Error("Authentication failed")
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export default function ShopDetailModal({ shop, visible, onClose, onRefresh, onUpdateShop }: ShopDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState("info")

  useEffect(() => {
    if (visible && shop) {
      fetchShopDetails()
    }
  }, [visible, shop])

  const fetchShopDetails = async () => {
    setLoading(true)
    try {
      // Fetch products and orders from API
      const [productsResponse, ordersResponse] = await Promise.all([
        apiCall(`https://api.marketo.info.vn/api/admin/shops/${shop.id.replace("SHOP", "")}/products`),
        apiCall(`https://api.marketo.info.vn/api/admin/shops/${shop.id.replace("SHOP", "")}/orders`),
      ])

      if (productsResponse.status) {
        setProducts(productsResponse.data || [])
      }

      if (ordersResponse.status) {
        setOrders(ordersResponse.data || [])
      }
    } catch (error) {
      // Fallback to empty arrays if API fails
      setProducts([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action)
      const shopId = shop.id.replace("SHOP", "")

      switch (action) {
        case "block":
          const newStatus = shop.status === "blocked" || shop.status === "locked" ? "activated" : "blocked"
          const result = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
          })

          if (result.status) {
            const updatedShop = { ...shop, status: newStatus }
            onUpdateShop(updatedShop)
            message.success(`${newStatus === "blocked" ? "Khóa" : "Mở khóa"} shop thành công`)
            onRefresh()
          } else {
            message.error(result.message || "Lỗi khi thực hiện thao tác")
          }
          break

        case "reset-password":
          const resetResult = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}/reset-password`, {
            method: "POST",
          })

          if (resetResult.status) {
            message.success("Reset mật khẩu thành công")
          } else {
            message.error(resetResult.message || "Lỗi khi reset mật khẩu")
          }
          break

        case "delete":
          const deleteResult = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}`, {
            method: "DELETE",
          })

          if (deleteResult.status) {
            message.success("Xóa shop thành công")
            onRefresh()
            onClose()
          } else {
            message.error(deleteResult.message || "Lỗi khi xóa shop")
          }
          break

        case "approve":
          if (shop.isVerified) {
            message.info("Shop này đã được phê duyệt rồi")
            return
          }

          const approveResult = await apiCall(`https://api.marketo.info.vn/api/admin/apply`, {
            method: "PATCH",
            body: JSON.stringify({ shop_id: Number.parseInt(shopId) }),
          })

          if (approveResult.status) {
            const updatedShop = { ...shop, isVerified: true }
            onUpdateShop(updatedShop)
            message.success("Phê duyệt shop thành công")
            onRefresh()
          } else {
            message.error(approveResult.message || "Lỗi khi phê duyệt shop")
          }
          break
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !== "No authentication token" &&
        error.message !== "Authentication failed"
      ) {
        message.error("Có lỗi xảy ra khi thực hiện thao tác")
      }
    } finally {
      setActionLoading(null)
    }
  }

  const productColumns: ColumnsType<Product> = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <Space>
          <Image src={record.image || "/placeholder.svg?height=40&width=40&text=P"} width={40} height={40} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary">{record.category}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      render: (price: number) => `${price.toLocaleString("vi-VN")} ₫`,
    },
    {
      title: "Kho",
      dataIndex: "stock",
      render: (stock: number) => <Badge count={stock} showZero color={stock > 0 ? "green" : "red"} />,
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const statusConfig = {
          active: { color: "green", text: "Hoạt động" },
          inactive: { color: "red", text: "Ngừng bán" },
          out_of_stock: { color: "orange", text: "Hết hàng" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
  ]

  const orderColumns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 120,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      render: (total: number) => `${total.toLocaleString("vi-VN")} ₫`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const statusConfig = {
          pending: { color: "orange", text: "Chờ xử lý" },
          processing: { color: "blue", text: "Đang xử lý" },
          shipped: { color: "cyan", text: "Đã gửi" },
          delivered: { color: "green", text: "Đã giao" },
          cancelled: { color: "red", text: "Đã hủy" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activated":
        return "green"
      case "hidden":
        return "orange"
      case "blocked":
      case "locked":
        return "red"
      default:
        return "default"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "activated":
        return "Hoạt động"
      case "hidden":
        return "Đã ẩn"
      case "blocked":
      case "locked":
        return "Đã khóa"
      default:
        return status
    }
  }

  return (
    <Modal
      title={
        <Space>
          <Avatar src={shop.logo} icon={<ShopOutlined />} size={32} />
          <span>{shop.name}</span>
          {shop.isVerified && <CheckCircleOutlined style={{ color: "#1890ff" }} />}
          {shop.warningStatus.level === "danger" && <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
          {shop.warningStatus.level === "warning" && <WarningOutlined style={{ color: "#faad14" }} />}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={
        <Space>
          {!shop.isVerified && (
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              onClick={() => handleAction("approve")}
              loading={actionLoading === "approve"}
            >
              Phê duyệt shop
            </Button>
          )}
          <Button
            icon={shop.status === "blocked" || shop.status === "locked" ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleAction("block")}
            type={shop.status === "blocked" || shop.status === "locked" ? "primary" : "default"}
            loading={actionLoading === "block"}
          >
            {shop.status === "blocked" || shop.status === "locked" ? "Mở khóa" : "Khóa shop"}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleAction("delete")}
            loading={actionLoading === "delete"}
          >
            Xóa shop
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Thông tin shop" key="info">
            <Row gutter={24}>
              <Col span={16}>
                <Card title="Thông tin cơ bản" size="small">
                  <Descriptions column={2}>
                    <Descriptions.Item label="ID Shop">{shop.id}</Descriptions.Item>
                    <Descriptions.Item label="Tên shop">{shop.name}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(shop.status)}>{getStatusText(shop.status)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Xác minh">
                      {shop.isVerified ? (
                        <Tag color="blue" icon={<CheckCircleOutlined />}>
                          Đã xác minh
                        </Tag>
                      ) : (
                        <Tag color="red" icon={<CloseCircleOutlined />}>
                          Chưa xác minh
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đăng ký">
                      <CalendarOutlined /> {new Date(shop.registrationDate).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đánh giá">
                      <StarOutlined /> {shop.rating.toFixed(1)}/5.0
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      <EnvironmentOutlined /> {shop.address || "Chưa cập nhật"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                      <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                        {shop.description || "Chưa có mô tả"}
                      </Paragraph>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Warning alerts */}
                {shop.totalReports >= 10 && (
                  <Alert
                    message="Cảnh báo nghiêm trọng"
                    description={`Shop này có ${shop.totalReports} báo cáo từ người dùng. Cần xem xét và xử lý ngay!`}
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginTop: 16 }}
                  />
                )}
                {shop.totalReports >= 5 && shop.totalReports < 10 && (
                  <Alert
                    message="Cảnh báo"
                    description={`Shop này có ${shop.totalReports} báo cáo từ người dùng. Cần theo dõi thêm.`}
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginTop: 16 }}
                  />
                )}
              </Col>

              <Col span={8}>
                <Card title="Thống kê kinh doanh" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Sản phẩm"
                        value={shop.totalProducts}
                        prefix={<ShoppingCartOutlined />}
                        valueStyle={{ color: "#1890ff" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Đơn hàng"
                        value={shop.totalOrders}
                        prefix={<ShoppingCartOutlined />}
                        valueStyle={{ color: "#52c41a" }}
                      />
                    </Col>
                    <Col span={24}>
                      <Statistic
                        title="Tổng doanh thu"
                        value={shop.totalRevenue}
                        prefix={<DollarOutlined />}
                        suffix="₫"
                        precision={0}
                        valueStyle={{ color: "#f5222d" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Đánh giá"
                        value={shop.rating}
                        precision={1}
                        prefix={<StarOutlined />}
                        valueStyle={{ color: "#faad14" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Báo cáo"
                        value={shop.totalReports}
                        prefix={<WarningOutlined />}
                        valueStyle={{
                          color: shop.totalReports >= 10 ? "#f5222d" : shop.totalReports >= 5 ? "#faad14" : "#52c41a",
                        }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Chủ shop" key="owner">
            <Card title="Thông tin chủ shop">
              <Row gutter={24}>
                <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                    <Avatar src={shop.owner.avatar} icon={<UserOutlined />} size={80} />
                    <Title level={4} style={{ marginTop: 16 }}>
                      {shop.owner.name}
                    </Title>
                  </div>
                </Col>
                <Col span={18}>
                  <Descriptions column={2}>
                    <Descriptions.Item label="ID">{shop.owner.id}</Descriptions.Item>
                    <Descriptions.Item label="Tên">{shop.owner.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <Space>
                        <MailOutlined />
                        {shop.owner.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      <Space>
                        <PhoneOutlined />
                        {shop.owner.phone}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </TabPane>



        </Tabs>
      </Spin>
    </Modal>
  )
}
