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
} from "antd"
import {
  ShopOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarOutlined,
  EyeOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  DeleteOutlined,
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
  address?: string
  joinDate: string
  lastLogin?: string
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
  banner?: string
  owner: ShopOwner
  status: "active" | "hidden" | "blocked"
  registrationDate: string
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: number
  rating: number
  totalReviews: number
  address: string
  category: string
  isVerified: boolean
  violationCount: number
  lastActive: string
}

interface ShopDetailModalProps {
  shop: ShopData
  visible: boolean
  onClose: () => void
  onRefresh: () => void
  onUpdateShop: (shop: ShopData) => void
}

// Generate mock products
const generateMockProducts = (shopId: string): Product[] => {
  const productNames = [
    "Áo thun nam basic",
    "Quần jean nữ skinny",
    "Giày sneaker trắng",
    "Túi xách da thật",
    "Đồng hồ thông minh",
    "Tai nghe bluetooth",
    "Ốp lưng iPhone",
    "Bàn phím cơ gaming",
    "Chuột không dây",
    "Màn hình 24 inch",
  ]

  return Array.from({ length: 10 }, (_, index) => ({
    id: `${shopId}_PROD${String(index + 1).padStart(3, "0")}`,
    name: productNames[index],
    image: `/placeholder.svg?height=60&width=60&text=P${index + 1}`,
    price: Math.floor(Math.random() * 1000000) + 50000,
    stock: Math.floor(Math.random() * 100),
    sold: Math.floor(Math.random() * 500),
    status: ["active", "inactive", "out_of_stock"][Math.floor(Math.random() * 3)] as
      | "active"
      | "inactive"
      | "out_of_stock",
    category: ["Thời trang", "Điện tử", "Phụ kiện"][Math.floor(Math.random() * 3)],
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    reviews: Math.floor(Math.random() * 100) + 10,
  }))
}

// Generate mock orders
const generateMockOrders = (shopId: string): Order[] => {
  const customerNames = ["Nguyễn Văn A", "Trần Thị B", "Lê Hoàng C", "Phạm Thị D", "Hoàng Văn E"]

  return Array.from({ length: 15 }, (_, index) => ({
    id: `${shopId}_ORD${String(index + 1).padStart(4, "0")}`,
    customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
    total: Math.floor(Math.random() * 2000000) + 100000,
    status: ["pending", "processing", "shipped", "delivered", "cancelled"][Math.floor(Math.random() * 5)] as
      | "pending"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled",
    orderDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    items: Math.floor(Math.random() * 5) + 1,
  }))
}

export default function ShopDetailModal({ shop, visible, onClose, onRefresh, onUpdateShop }: ShopDetailModalProps) {
  const [loading, setLoading] = useState(false)
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

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate mock data
    setProducts(generateMockProducts(shop.id))
    setOrders(generateMockOrders(shop.id))

    setLoading(false)
  }

  const handleAction = async (action: string) => {
    try {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedShop = { ...shop }

      switch (action) {
        case "block":
          updatedShop.status = shop.status === "blocked" ? "active" : "blocked"
          break
        case "reset-password":
          message.success("Reset mật khẩu thành công")
          setLoading(false)
          return
        case "delete":
          message.success("Xóa shop thành công")
          onRefresh()
          onClose()
          setLoading(false)
          return
      }

      onUpdateShop(updatedShop)
      message.success("Thao tác thành công")
      onRefresh()
    } catch (error) {
      message.error("Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const productColumns: ColumnsType<Product> = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <Space>
          <Image src={record.image || "/placeholder.svg"} width={40} height={40} />
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
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
  ]

  const orderColumns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "id",
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
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <Avatar src={shop.logo} icon={<ShopOutlined />} size={32} />
          <span>{shop.name}</span>
          {shop.isVerified && <CheckCircleOutlined style={{ color: "#1890ff" }} />}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={
        <Space>
          <Button
            icon={shop.status === "blocked" ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleAction("block")}
            type={shop.status === "blocked" ? "primary" : "default"}
            loading={loading}
          >
            {shop.status === "blocked" ? "Mở khóa" : "Khóa shop"}
          </Button>
          <Button icon={<KeyOutlined />} onClick={() => handleAction("reset-password")} loading={loading}>
            Reset mật khẩu
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleAction("delete")} loading={loading}>
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
                    <Descriptions.Item label="Danh mục">{shop.category}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={shop.status === "active" ? "green" : shop.status === "blocked" ? "red" : "orange"}>
                        {shop.status === "active" ? "Hoạt động" : shop.status === "blocked" ? "Bị khóa" : "Ẩn"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đăng ký">
                      {new Date(shop.registrationDate).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hoạt động cuối">
                      {new Date(shop.lastActive).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      <EnvironmentOutlined /> {shop.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                      <Paragraph ellipsis={{ rows: 3, expandable: true }}>{shop.description}</Paragraph>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {shop.violationCount > 0 && (
                  <Alert
                    message={`Shop có ${shop.violationCount} vi phạm`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Col>

              <Col span={8}>
                <Card title="Thống kê" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="Sản phẩm" value={shop.totalProducts} prefix={<ShoppingCartOutlined />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Đơn hàng" value={shop.totalOrders} prefix={<ShoppingCartOutlined />} />
                    </Col>
                    <Col span={24} style={{ marginTop: 16 }}>
                      <Statistic
                        title="Tổng doanh thu"
                        value={shop.totalRevenue}
                        prefix={<DollarOutlined />}
                        suffix="₫"
                      />
                    </Col>
                    <Col span={24} style={{ marginTop: 16 }}>
                      <Statistic
                        title="Doanh thu tháng này"
                        value={shop.monthlyRevenue}
                        prefix={<DollarOutlined />}
                        suffix="₫"
                      />
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Statistic title="Đánh giá" value={shop.rating} precision={1} prefix={<StarOutlined />} />
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Statistic title="Lượt đánh giá" value={shop.totalReviews} prefix={<EyeOutlined />} />
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
                      <MailOutlined /> {shop.owner.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      <PhoneOutlined /> {shop.owner.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tham gia">
                      <CalendarOutlined /> {new Date(shop.owner.joinDate).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đăng nhập cuối">
                      {shop.owner.lastLogin ? new Date(shop.owner.lastLogin).toLocaleDateString("vi-VN") : "Chưa có"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      <EnvironmentOutlined /> {shop.owner.address || "Chưa cập nhật"}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="Sản phẩm" key="products">
            <Table
              columns={productColumns}
              dataSource={products}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Đơn hàng" key="orders">
            <Table columns={orderColumns} dataSource={orders} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
          </TabPane>
        </Tabs>
      </Spin>
    </Modal>
  )
}
