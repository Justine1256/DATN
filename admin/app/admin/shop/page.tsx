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
  Avatar,
  Tooltip,
  Spin,
  message,
  Badge,
  Alert,
  Modal,
  Dropdown,
} from "antd"
import {
  SearchOutlined,
  ShopOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  DeleteOutlined,
  MoreOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import type { MenuProps } from "antd"

const { Title, Text } = Typography
const { Option } = Select
const { confirm } = Modal

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

// Static data array
const staticShopsData: ShopData[] = [
  {
    id: "SHOP0001",
    name: "Fashion Store VN",
    description:
      "Mô tả chi tiết về Fashion Store VN. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=F",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0001",
      name: "Nguyễn Văn An",
      phone: "0901234567",
      email: "nguyenvanan@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=N",
      address: "123 Đường 1, Quận 1, TP.HCM",
      joinDate: "2022-01-15T00:00:00.000Z",
      lastLogin: "2024-01-20T10:30:00.000Z",
    },
    status: "active",
    registrationDate: "2022-01-15T00:00:00.000Z",
    totalProducts: 150,
    totalOrders: 1250,
    totalRevenue: 5500000000,
    monthlyRevenue: 550000000,
    rating: 4.5,
    totalReviews: 320,
    address: "123 Đường 1, Quận 1, TP.HCM",
    category: "fashion",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-20T10:30:00.000Z",
  },
  {
    id: "SHOP0002",
    name: "Tech World",
    description:
      "Mô tả chi tiết về Tech World. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=T",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0002",
      name: "Trần Thị Bình",
      phone: "0902345678",
      email: "tranthibinh@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=T",
      address: "456 Đường 2, Quận 2, TP.HCM",
      joinDate: "2021-03-20T00:00:00.000Z",
      lastLogin: "2024-01-19T15:45:00.000Z",
    },
    status: "active",
    registrationDate: "2021-03-20T00:00:00.000Z",
    totalProducts: 89,
    totalOrders: 890,
    totalRevenue: 8900000000,
    monthlyRevenue: 890000000,
    rating: 4.8,
    totalReviews: 156,
    address: "456 Đường 2, Quận 2, TP.HCM",
    category: "electronics",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-19T15:45:00.000Z",
  },
  {
    id: "SHOP0003",
    name: "Beauty Paradise",
    description:
      "Mô tả chi tiết về Beauty Paradise. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=B",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0003",
      name: "Lê Hoàng Cường",
      phone: "0903456789",
      email: "lehoangcuong@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=L",
      address: "789 Đường 3, Quận 3, TP.HCM",
      joinDate: "2020-07-10T00:00:00.000Z",
      lastLogin: "2024-01-18T09:20:00.000Z",
    },
    status: "hidden",
    registrationDate: "2020-07-10T00:00:00.000Z",
    totalProducts: 245,
    totalOrders: 2100,
    totalRevenue: 3200000000,
    monthlyRevenue: 320000000,
    rating: 4.2,
    totalReviews: 445,
    address: "789 Đường 3, Quận 3, TP.HCM",
    category: "beauty",
    isVerified: true,
    violationCount: 1,
    lastActive: "2024-01-18T09:20:00.000Z",
  },
  {
    id: "SHOP0004",
    name: "Home Decor Plus",
    description:
      "Mô tả chi tiết về Home Decor Plus. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=H",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0004",
      name: "Phạm Thị Dung",
      phone: "0904567890",
      email: "phamthidung@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=P",
      address: "321 Đường 4, Quận 4, TP.HCM",
      joinDate: "2023-02-28T00:00:00.000Z",
      lastLogin: "2024-01-21T14:15:00.000Z",
    },
    status: "active",
    registrationDate: "2023-02-28T00:00:00.000Z",
    totalProducts: 67,
    totalOrders: 340,
    totalRevenue: 1800000000,
    monthlyRevenue: 180000000,
    rating: 4.0,
    totalReviews: 89,
    address: "321 Đường 4, Quận 4, TP.HCM",
    category: "home",
    isVerified: false,
    violationCount: 0,
    lastActive: "2024-01-21T14:15:00.000Z",
  },
  {
    id: "SHOP0005",
    name: "Sports Center",
    description:
      "Mô tả chi tiết về Sports Center. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=S",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0005",
      name: "Hoàng Văn Em",
      phone: "0905678901",
      email: "hoangvanem@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=H",
      address: "654 Đường 5, Quận 5, TP.HCM",
      joinDate: "2021-11-12T00:00:00.000Z",
      lastLogin: "2024-01-17T11:30:00.000Z",
    },
    status: "blocked",
    registrationDate: "2021-11-12T00:00:00.000Z",
    totalProducts: 198,
    totalOrders: 756,
    totalRevenue: 4500000000,
    monthlyRevenue: 450000000,
    rating: 3.8,
    totalReviews: 234,
    address: "654 Đường 5, Quận 5, TP.HCM",
    category: "sports",
    isVerified: true,
    violationCount: 2,
    lastActive: "2024-01-17T11:30:00.000Z",
  },
  {
    id: "SHOP0006",
    name: "Gadget Hub",
    description:
      "Mô tả chi tiết về Gadget Hub. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=G",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0006",
      name: "Vũ Thị Phương",
      phone: "0906789012",
      email: "vuthiphuong@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=V",
      address: "987 Đường 6, Quận 6, TP.HCM",
      joinDate: "2022-05-18T00:00:00.000Z",
      lastLogin: "2024-01-20T16:45:00.000Z",
    },
    status: "active",
    registrationDate: "2022-05-18T00:00:00.000Z",
    totalProducts: 134,
    totalOrders: 1890,
    totalRevenue: 7200000000,
    monthlyRevenue: 720000000,
    rating: 4.6,
    totalReviews: 567,
    address: "987 Đường 6, Quận 6, TP.HCM",
    category: "electronics",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-20T16:45:00.000Z",
  },
  {
    id: "SHOP0007",
    name: "Style Boutique",
    description:
      "Mô tả chi tiết về Style Boutique. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=S",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0007",
      name: "Đặng Minh Giang",
      phone: "0907890123",
      email: "dangminhgiang@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=D",
      address: "147 Đường 7, Quận 7, TP.HCM",
      joinDate: "2023-08-05T00:00:00.000Z",
      lastLogin: "2024-01-19T13:20:00.000Z",
    },
    status: "active",
    registrationDate: "2023-08-05T00:00:00.000Z",
    totalProducts: 78,
    totalOrders: 456,
    totalRevenue: 2100000000,
    monthlyRevenue: 210000000,
    rating: 4.3,
    totalReviews: 123,
    address: "147 Đường 7, Quận 7, TP.HCM",
    category: "fashion",
    isVerified: false,
    violationCount: 0,
    lastActive: "2024-01-19T13:20:00.000Z",
  },
  {
    id: "SHOP0008",
    name: "Electronics Pro",
    description:
      "Mô tả chi tiết về Electronics Pro. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=E",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0008",
      name: "Bùi Thị Hoa",
      phone: "0908901234",
      email: "buithihoa@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=B",
      address: "258 Đường 8, Quận 8, TP.HCM",
      joinDate: "2020-12-03T00:00:00.000Z",
      lastLogin: "2024-01-21T08:15:00.000Z",
    },
    status: "active",
    registrationDate: "2020-12-03T00:00:00.000Z",
    totalProducts: 312,
    totalOrders: 2890,
    totalRevenue: 9800000000,
    monthlyRevenue: 980000000,
    rating: 4.7,
    totalReviews: 789,
    address: "258 Đường 8, Quận 8, TP.HCM",
    category: "electronics",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-21T08:15:00.000Z",
  },
  {
    id: "SHOP0009",
    name: "Cosmetic House",
    description:
      "Mô tả chi tiết về Cosmetic House. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=C",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0009",
      name: "Ngô Văn Inh",
      phone: "0909012345",
      email: "ngovaninh@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=N",
      address: "369 Đường 9, Quận 9, TP.HCM",
      joinDate: "2022-09-14T00:00:00.000Z",
      lastLogin: "2024-01-16T12:00:00.000Z",
    },
    status: "hidden",
    registrationDate: "2022-09-14T00:00:00.000Z",
    totalProducts: 156,
    totalOrders: 678,
    totalRevenue: 2800000000,
    monthlyRevenue: 280000000,
    rating: 4.1,
    totalReviews: 234,
    address: "369 Đường 9, Quận 9, TP.HCM",
    category: "beauty",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-16T12:00:00.000Z",
  },
  {
    id: "SHOP0010",
    name: "Furniture Land",
    description:
      "Mô tả chi tiết về Furniture Land. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=F",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0010",
      name: "Lý Thị Kim",
      phone: "0910123456",
      email: "lythikim@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=L",
      address: "741 Đường 10, Quận 10, TP.HCM",
      joinDate: "2021-06-25T00:00:00.000Z",
      lastLogin: "2024-01-22T09:30:00.000Z",
    },
    status: "active",
    registrationDate: "2021-06-25T00:00:00.000Z",
    totalProducts: 89,
    totalOrders: 445,
    totalRevenue: 3600000000,
    monthlyRevenue: 360000000,
    rating: 4.4,
    totalReviews: 167,
    address: "741 Đường 10, Quận 10, TP.HCM",
    category: "home",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-22T09:30:00.000Z",
  },
  {
    id: "SHOP0011",
    name: "Fitness Gear",
    description:
      "Mô tả chi tiết về Fitness Gear. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=F",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0011",
      name: "Phan Văn Long",
      phone: "0911234567",
      email: "phanvanlong@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=P",
      address: "852 Đường 11, Quận 11, TP.HCM",
      joinDate: "2023-04-12T00:00:00.000Z",
      lastLogin: "2024-01-15T17:20:00.000Z",
    },
    status: "blocked",
    registrationDate: "2023-04-12T00:00:00.000Z",
    totalProducts: 234,
    totalOrders: 567,
    totalRevenue: 4100000000,
    monthlyRevenue: 410000000,
    rating: 3.9,
    totalReviews: 189,
    address: "852 Đường 11, Quận 11, TP.HCM",
    category: "sports",
    isVerified: false,
    violationCount: 3,
    lastActive: "2024-01-15T17:20:00.000Z",
  },
  {
    id: "SHOP0012",
    name: "Mobile World",
    description:
      "Mô tả chi tiết về Mobile World. Chúng tôi chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.",
    logo: "/placeholder.svg?height=40&width=40&text=M",
    banner: "/placeholder.svg?height=200&width=800&text=Banner",
    owner: {
      id: "USER0012",
      name: "Đinh Thị Mai",
      phone: "0912345678",
      email: "dinhthimai@gmail.com",
      avatar: "/placeholder.svg?height=40&width=40&text=D",
      address: "963 Đường 12, Quận 12, TP.HCM",
      joinDate: "2020-10-08T00:00:00.000Z",
      lastLogin: "2024-01-23T11:45:00.000Z",
    },
    status: "active",
    registrationDate: "2020-10-08T00:00:00.000Z",
    totalProducts: 445,
    totalOrders: 3456,
    totalRevenue: 12500000000,
    monthlyRevenue: 1250000000,
    rating: 4.9,
    totalReviews: 1234,
    address: "963 Đường 12, Quận 12, TP.HCM",
    category: "electronics",
    isVerified: true,
    violationCount: 0,
    lastActive: "2024-01-23T11:45:00.000Z",
  },
]

// Simple ShopDetailModal component
const ShopDetailModal: React.FC<{
  shop: ShopData
  visible: boolean
  onClose: () => void
  onRefresh: () => void
  onUpdateShop: (shop: ShopData) => void
}> = ({ shop, visible, onClose, onRefresh, onUpdateShop }) => {
  return (
    <Modal
      title={
        <Space>
          <Avatar src={shop.logo} icon={<ShopOutlined />} />
          {shop.name}
          {shop.isVerified && <CheckCircleOutlined style={{ color: "#1890ff" }} />}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Thông tin shop" size="small">
            <p>
              <strong>ID:</strong> {shop.id}
            </p>
            <p>
              <strong>Tên:</strong> {shop.name}
            </p>
            <p>
              <strong>Mô tả:</strong> {shop.description}
            </p>
            <p>
              <strong>Danh mục:</strong> {shop.category}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {shop.address}
            </p>
            <p>
              <strong>Trạng thái:</strong>
              <Tag color={shop.status === "active" ? "green" : shop.status === "hidden" ? "orange" : "red"}>
                {shop.status === "active" ? "Hoạt động" : shop.status === "hidden" ? "Ẩn" : "Bị khóa"}
              </Tag>
            </p>
            <p>
              <strong>Ngày đăng ký:</strong> {new Date(shop.registrationDate).toLocaleDateString("vi-VN")}
            </p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Chủ shop" size="small">
            <p>
              <strong>Tên:</strong> {shop.owner.name}
            </p>
            <p>
              <strong>Email:</strong> {shop.owner.email}
            </p>
            <p>
              <strong>Điện thoại:</strong> {shop.owner.phone}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {shop.owner.address}
            </p>
            <p>
              <strong>Ngày tham gia:</strong> {new Date(shop.owner.joinDate).toLocaleDateString("vi-VN")}
            </p>
            {shop.owner.lastLogin && (
              <p>
                <strong>Đăng nhập cuối:</strong> {new Date(shop.owner.lastLogin).toLocaleDateString("vi-VN")}
              </p>
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Thống kê kinh doanh" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}>{shop.totalProducts}</div>
                  <div>Sản phẩm</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#52c41a" }}>{shop.totalOrders}</div>
                  <div>Đơn hàng</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f5222d" }}>
                    {shop.totalRevenue > 1000000000
                      ? `${(shop.totalRevenue / 1000000000).toFixed(1)}B ₫`
                      : `${(shop.totalRevenue / 1000000).toFixed(1)}M ₫`}
                  </div>
                  <div>Doanh thu</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#faad14" }}>
                    ⭐ {shop.rating.toFixed(1)}
                  </div>
                  <div>({shop.totalReviews} đánh giá)</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Modal>
  )
}

export default function ShopManagementPage() {
  const [shops, setShops] = useState<ShopData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} shop`,
  })
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Initialize static data
  useEffect(() => {
    setShops(staticShopsData)
    setPagination((prev) => ({
      ...prev,
      total: staticShopsData.length,
    }))
    setLoading(false)
  }, [])

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return shops.filter((shop) => {
      const matchesSearch =
        searchText === "" ||
        shop.name.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.owner.name.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.owner.phone.includes(searchText) ||
        shop.id.includes(searchText)

      const matchesStatus = statusFilter === "all" || shop.status === statusFilter
      const matchesCategory = categoryFilter === "all" || shop.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [shops, searchText, statusFilter, categoryFilter])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      ...newPagination,
    })
  }

  const handleReset = () => {
    setSearchText("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setPagination({
      ...pagination,
      current: 1,
    })
  }

  // Actions
  const handleBlockShop = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked"
    const actionText = newStatus === "blocked" ? "khóa" : "mở khóa"

    confirm({
      title: `Xác nhận ${actionText} shop`,
      content: `Bạn có chắc chắn muốn ${actionText} shop này?`,
      onOk: async () => {
        try {
          setActionLoading(shopId)
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
          // Update local state
          setShops((prevShops) =>
            prevShops.map((shop) =>
              shop.id === shopId ? { ...shop, status: newStatus as "active" | "blocked" } : shop,
            ),
          )
          message.success(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} shop thành công`)
        } catch (error) {
          message.error(`Lỗi khi ${actionText} shop`)
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handleResetPassword = async (shopId: string, ownerName: string) => {
    confirm({
      title: "Xác nhận reset mật khẩu",
      content: `Bạn có chắc chắn muốn reset mật khẩu cho chủ shop "${ownerName}"?`,
      onOk: async () => {
        try {
          setActionLoading(shopId)
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
          message.success("Reset mật khẩu thành công")
        } catch (error) {
          message.error("Lỗi khi reset mật khẩu")
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    confirm({
      title: "Xác nhận xóa shop",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa shop "{shopName}"?</p>
          <p style={{ color: "red", fontWeight: "bold" }}>Hành động này không thể hoàn tác!</p>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        try {
          setActionLoading(shopId)
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
          // Remove from local state
          setShops((prevShops) => prevShops.filter((shop) => shop.id !== shopId))
          message.success("Xóa shop thành công")
        } catch (error) {
          message.error("Lỗi khi xóa shop")
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const getActionItems = (record: ShopData): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "Xem chi tiết",
      onClick: () => showShopDetail(record),
    },
    {
      key: "block",
      icon: record.status === "blocked" ? <UnlockOutlined /> : <LockOutlined />,
      label: record.status === "blocked" ? "Mở khóa shop" : "Khóa shop",
      onClick: () => handleBlockShop(record.id, record.status),
    },
    {
      key: "reset",
      icon: <KeyOutlined />,
      label: "Reset mật khẩu",
      onClick: () => handleResetPassword(record.id, record.owner.name),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Xóa shop",
      danger: true,
      onClick: () => handleDeleteShop(record.id, record.name),
    },
  ]

  const columns: ColumnsType<ShopData> = [
    {
      title: "Shop",
      key: "shop",
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar src={record.logo} icon={<ShopOutlined />} size={40} />
          <div>
            <div
              style={{
                fontWeight: 500,
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <Tooltip title={record.name}>{record.name}</Tooltip>
              {record.isVerified && <CheckCircleOutlined style={{ color: "#1890ff", marginLeft: 4 }} />}
            </div>
            <div style={{ color: "#666", fontSize: "12px" }}>ID: {record.id}</div>
            <Tag color="blue">
              {record.category}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Chủ shop",
      key: "owner",
      width: 180,
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              marginBottom: 4,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <UserOutlined style={{ marginRight: 4 }} />
            <Tooltip title={record.owner.name}>{record.owner.name}</Tooltip>
          </div>
          <div
            style={{
              color: "#666",
              fontSize: "12px",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <PhoneOutlined style={{ marginRight: 4 }} />
            <Tooltip title={record.owner.phone}>{record.owner.phone}</Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record) => {
        const statusConfig = {
          active: { color: "green", text: "Hoạt động" },
          hidden: { color: "orange", text: "Ẩn" },
          blocked: { color: "red", text: "Bị khóa" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status }
        return (
          <div>
            <Tag color={config.color}>{config.text}</Tag>
            {record.violationCount > 0 && (
              <div style={{ marginTop: 2 }}>
                <Badge count={record.violationCount} size="small">
                  <WarningOutlined style={{ color: "orange" }} />
                </Badge>
              </div>
            )}
          </div>
        )
      },
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Ẩn", value: "hidden" },
        { text: "Bị khóa", value: "blocked" },
      ],
      onFilter: (value: boolean | React.Key, record: ShopData) => {
        return record.status === String(value)
      },
    },
    {
      title: "Sản phẩm",
      key: "products",
      width: 100,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1890ff" }}>{record.totalProducts}</div>
          <div style={{ fontSize: "11px", color: "#666" }}>sản phẩm</div>
        </div>
      ),
      sorter: (a: ShopData, b: ShopData) => a.totalProducts - b.totalProducts,
    },
    {
      title: "Đơn hàng",
      key: "orders",
      width: 100,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#52c41a" }}>{record.totalOrders}</div>
          <div style={{ fontSize: "11px", color: "#666" }}>đơn hàng</div>
        </div>
      ),
      sorter: (a: ShopData, b: ShopData) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Doanh thu",
      key: "revenue",
      width: 140,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#f5222d" }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            <Tooltip title={`${record.totalRevenue.toLocaleString("vi-VN")} ₫`}>
              {record.totalRevenue > 1000000
                ? `${(record.totalRevenue / 1000000).toFixed(1)}M ₫`
                : `${(record.totalRevenue / 1000).toFixed(0)}K ₫`}
            </Tooltip>
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            Tháng này:{" "}
            {record.monthlyRevenue > 1000000
              ? `${(record.monthlyRevenue / 1000000).toFixed(1)}M ₫`
              : `${(record.monthlyRevenue / 1000).toFixed(0)}K ₫`}
          </div>
        </div>
      ),
      sorter: (a: ShopData, b: ShopData) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: "Đánh giá",
      key: "rating",
      width: 100,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#faad14" }}>⭐ {record.rating.toFixed(1)}</div>
          <div style={{ fontSize: "11px", color: "#666" }}>({record.totalReviews} đánh giá)</div>
        </div>
      ),
      sorter: (a: ShopData, b: ShopData) => a.rating - b.rating,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      key: "registrationDate",
      width: 120,
      render: (date: string) => <Text style={{ fontSize: "12px" }}>{new Date(date).toLocaleDateString("vi-VN")}</Text>,
      sorter: (a: ShopData, b: ShopData) =>
        new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      render: (_, record: ShopData) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={["click"]} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} loading={actionLoading === record.id} />
        </Dropdown>
      ),
    },
  ]

  const showShopDetail = (shop: ShopData) => {
    setSelectedShop(shop)
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedShop(null)
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success("Đã làm mới dữ liệu")
    }, 1000)
  }

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = filteredData.length
    const active = filteredData.filter((s) => s.status === "active").length
    const blocked = filteredData.filter((s) => s.status === "blocked").length
    const hidden = filteredData.filter((s) => s.status === "hidden").length
    const violationShops = filteredData.filter((s) => s.violationCount > 0).length
    const totalRevenue = filteredData.reduce((sum, shop) => sum + shop.totalRevenue, 0)
    return { total, active, blocked, hidden, violationShops, totalRevenue }
  }, [filteredData])

  return (
    <div style={{ padding: "2px" }}>
      {/* Thống kê tổng quan */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
              <div>Tổng shop</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#52c41a" }}>{stats.active}</div>
              <div>Đang hoạt động</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f5222d" }}>{stats.blocked}</div>
              <div>Bị khóa</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fa8c16" }}>
                {stats.totalRevenue > 1000000000
                  ? `${(stats.totalRevenue / 1000000000).toFixed(1)}B ₫`
                  : `${(stats.totalRevenue / 1000000).toFixed(1)}M ₫`}
              </div>
              <div>Tổng doanh thu</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Cảnh báo vi phạm */}
      {stats.violationShops > 0 && (
        <Alert
          message={`${stats.violationShops} shop có vi phạm cần xem xét`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Tìm kiếm shop, chủ shop, ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select placeholder="Trạng thái" value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="hidden">Ẩn</Option>
              <Option value="blocked">Bị khóa</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Danh mục"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">Tất cả danh mục</Option>
              <Option value="fashion">Thời trang</Option>
              <Option value="electronics">Điện tử</Option>
              <Option value="home">Nhà cửa</Option>
              <Option value="beauty">Làm đẹp</Option>
              <Option value="sports">Thể thao</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>
                Đặt lại
              </Button>
              <Button type="primary" onClick={handleRefresh} loading={loading}>
                Làm mới
              </Button>
              <Text type="secondary">Tìm thấy {filteredData.length} shop</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              ...pagination,
              total: filteredData.length,
            }}
            onChange={handleTableChange}
            size="middle"
            rowClassName={(record) => {
              if (record.status === "blocked") return "blocked-row"
              if (record.violationCount > 0) return "violation-row"
              return ""
            }}
          />
        </Spin>
      </Card>

      {selectedShop && (
        <ShopDetailModal
          shop={selectedShop}
          visible={isModalVisible}
          onClose={handleCloseModal}
          onRefresh={handleRefresh}
          onUpdateShop={(updatedShop) => {
            setShops((prevShops) => prevShops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)))
          }}
        />
      )}

      <style jsx global>{`
        .blocked-row {
          background-color: #fff2f0 !important;
        }
        .violation-row {
          background-color: #fffbe6 !important;
        }
        .blocked-row:hover {
          background-color: #ffebe6 !important;
        }
        .violation-row:hover {
          background-color: #fff7db !important;
        }
      `}</style>
    </div>
  )
}
