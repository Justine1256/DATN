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
  Alert,
  Modal,
  Dropdown,
} from "antd"
import {
  SearchOutlined,
  ShopOutlined,
  ReloadOutlined,
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
import type { ColumnsType } from "antd/es/table"
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
  address: string
  isVerified: boolean
  rating: number
}

interface ApiResponse {
  status: boolean
  message: string
  data: ShopData[]
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
    // Redirect to login page or handle authentication
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

  // Handle authentication errors
  if (response.status === 401) {
    message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
    // Clear the invalid token
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/login"
    throw new Error("Authentication failed")
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

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
              <strong>Địa chỉ:</strong> {shop.address}
            </p>
            <p>
              <strong>Trạng thái:</strong>
              <Tag color={shop.status === "activated" ? "green" : shop.status === "hidden" ? "orange" : "red"}>
                {shop.status === "activated" ? "Hoạt động" : shop.status === "hidden" ? " Đã ẩn" : "Đã khóa"}
              </Tag>
            </p>
            <p>
              <strong>Ngày đăng ký:</strong> {new Date(shop.registrationDate).toLocaleDateString("vi-VN")}
            </p>
            <p>
              <strong>Xác minh:</strong> {shop.isVerified ? "Đã xác minh" : "Chưa xác minh"}
            </p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Chủ shop" size="small">
            <p>
              <strong>ID:</strong> {shop.owner.id}
            </p>
            <p>
              <strong>Tên:</strong> {shop.owner.name}
            </p>
            <p>
              <strong>Email:</strong> {shop.owner.email}
            </p>
            <p>
              <strong>Điện thoại:</strong> {shop.owner.phone}
            </p>
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
                  <div>Đánh giá</div>
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
  const [allShops, setAllShops] = useState<ShopData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check authentication on component mount
  useEffect(() => {
    const token = getCookie("authToken")
    if (!token) {
      message.error("Vui lòng đăng nhập để truy cập trang này")
      window.location.href = "/login"
      return
    }
  }, [])

  // Fetch shops data from API with authentication
  const fetchShops = async () => {
    try {
      setLoading(true)
      const result: ApiResponse = await apiCall("https://api.marketo.info.vn/api/admin/shops")

      if (result.status) {
        setAllShops(result.data)
      } else {
        message.error(result.message || "Không thể tải dữ liệu shop")
      }
    } catch (error) {
      console.error("Error fetching shops:", error)
      if (
        error instanceof Error &&
        error.message !== "No authentication token" &&
        error.message !== "Authentication failed"
      ) {
        message.error("Lỗi khi tải dữ liệu")
      }
    } finally {
      setLoading(false)
    }
  }

  // Initialize data
  useEffect(() => {
    const token = getCookie("authToken")
    if (token) {
      fetchShops()
    }
  }, [])

  // Filter data (client-side filtering for search and status)
  const filteredData = useMemo(() => {
    return allShops.filter((shop) => {
      const matchesSearch =
        searchText === "" ||
        shop.name.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.owner.name.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.owner.phone.includes(searchText) ||
        shop.id.includes(searchText)

      const matchesStatus = statusFilter === "all" || shop.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [allShops, searchText, statusFilter])

  const handleReset = () => {
    setSearchText("")
    setStatusFilter("all")
  }

  // Actions with authentication
  const handleBlockShop = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === "blocked" || currentStatus === "locked" ? "activated" : "blocked"
    const actionText = newStatus === "blocked" ? "khóa" : "mở khóa"

    confirm({
      title: `Xác nhận ${actionText} shop`,
      content: `Bạn có chắc chắn muốn ${actionText} shop này?`,
      onOk: async () => {
        try {
          setActionLoading(shopId)

          // Call API to update shop status
          const result = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
          })

          if (result.status) {
            // Update local state
            setAllShops((prevShops) =>
              prevShops.map((shop) => (shop.id === shopId ? { ...shop, status: newStatus } : shop)),
            )
            message.success(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} shop thành công`)
          } else {
            message.error(result.message || `Lỗi khi ${actionText} shop`)
          }
        } catch (error) {
          console.error(`Error ${actionText} shop:`, error)
          if (
            error instanceof Error &&
            error.message !== "No authentication token" &&
            error.message !== "Authentication failed"
          ) {
            message.error(`Lỗi khi ${actionText} shop`)
          }
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

          // Call API to reset password
          const result = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}/reset-password`, {
            method: "POST",
          })

          if (result.status) {
            message.success("Reset mật khẩu thành công")
          } else {
            message.error(result.message || "Lỗi khi reset mật khẩu")
          }
        } catch (error) {
          console.error("Error resetting password:", error)
          if (
            error instanceof Error &&
            error.message !== "No authentication token" &&
            error.message !== "Authentication failed"
          ) {
            message.error("Lỗi khi reset mật khẩu")
          }
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

          // Call API to delete shop
          const result = await apiCall(`https://api.marketo.info.vn/api/admin/shops/${shopId}`, {
            method: "DELETE",
          })

          if (result.status) {
            // Remove from local state
            setAllShops((prevShops) => prevShops.filter((shop) => shop.id !== shopId))
            message.success("Xóa shop thành công")
          } else {
            message.error(result.message || "Lỗi khi xóa shop")
          }
        } catch (error) {
          console.error("Error deleting shop:", error)
          if (
            error instanceof Error &&
            error.message !== "No authentication token" &&
            error.message !== "Authentication failed"
          ) {
            message.error("Lỗi khi xóa shop")
          }
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
      icon: record.status === "blocked" || record.status === "locked" ? <UnlockOutlined /> : <LockOutlined />,
      label: record.status === "blocked" || record.status === "locked" ? "Mở khóa shop" : "Khóa shop",
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
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.logo} icon={<ShopOutlined />} size={40} />
          <div>
            <div
              style={{
                fontWeight: 500,
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <Tooltip title={record.name}>{record.name}</Tooltip>
              {record.isVerified && <CheckCircleOutlined style={{ color: "#1890ff", marginLeft: 4 }} />}
            </div>
            <div style={{ color: "#666", fontSize: "12px" }}>ID: {record.id}</div>
            <div style={{ color: "#666", fontSize: "11px", marginTop: 2 }}>
              <Tooltip title={record.description}>
                {record.description.length > 30 ? `${record.description.substring(0, 30)}...` : record.description}
              </Tooltip>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Chủ shop",
      key: "owner",
      width: 200,
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              marginBottom: 4,
              maxWidth: 180,
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
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <PhoneOutlined style={{ marginRight: 4 }} />
            <Tooltip title={record.owner.phone}>{record.owner.phone}</Tooltip>
          </div>
          <div
            style={{
              color: "#666",
              fontSize: "11px",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {record.owner.email}
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
          activated: { color: "green", text: "Hoạt động" },
          hidden: { color: "orange", text: "Đã ẩn" },
          blocked: { color: "red", text: "Đã khóa" },
          locked: { color: "red", text: "Đã khóa" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status }
        return (
          <div>
            <Tag color={config.color}>{config.text}</Tag>
            {record.isVerified && (
              <div style={{ marginTop: 2 }}>
                <CheckCircleOutlined style={{ color: "#1890ff", fontSize: "12px" }} />
                <span style={{ fontSize: "11px", marginLeft: 2 }}>Đã xác minh</span>
              </div>
            )}
          </div>
        )
      },
      filters: [
        { text: "Hoạt động", value: "activated" },
        { text: "Đã ẩn", value: "hidden" },
        { text: "Đã khóa", value: "blocked" },
        { text: "Đã khóa", value: "locked" },
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
              {record.totalRevenue > 1000000000
                ? `${(record.totalRevenue / 1000000000).toFixed(1)}B ₫`
                : record.totalRevenue > 1000000
                  ? `${(record.totalRevenue / 1000000).toFixed(1)}M ₫`
                  : `${(record.totalRevenue / 1000).toFixed(0)}K ₫`}
            </Tooltip>
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
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#faad14" }}>
            ⭐ {record.rating > 0 ? record.rating.toFixed(1) : "0.0"}
          </div>
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
    fetchShops()
  }

  // Statistics
  const stats = useMemo(() => {
    const total = filteredData.length
    const activated = filteredData.filter((s) => s.status === "activated").length
    const blocked = filteredData.filter((s) => s.status === "blocked" || s.status === "locked").length
    const hidden = filteredData.filter((s) => s.status === "hidden").length
    const verified = filteredData.filter((s) => s.isVerified).length
    const totalRevenue = filteredData.reduce((sum, shop) => sum + shop.totalRevenue, 0)
    return { total, activated, blocked, hidden, verified, totalRevenue }
  }, [filteredData])

  return (
    <div style={{ padding: "2px" }}>
      {/* Statistics Overview */}
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
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#52c41a" }}>{stats.activated}</div>
              <div>Đang hoạt động</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f5222d" }}>{stats.blocked}</div>
              <div>Đã khóa</div>
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

      {/* Verified shops info */}
      {stats.verified > 0 && (
        <Alert message={`${stats.verified} shop đã được xác minh`} type="info" showIcon style={{ marginBottom: 16 }} />
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
              <Option value="activated">Hoạt động</Option>
              <Option value="hidden">Đã ẩn</Option>
              <Option value="locked">Đã khóa</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={14}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>
                Đặt lại
              </Button>
              <Button type="primary" onClick={handleRefresh} loading={loading}>
                Làm mới
              </Button>
              <Text type="secondary">
                Hiển thị {filteredData.length} / {allShops.length} shop
              </Text>
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
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} shop`,
            }}
            size="middle"
            rowClassName={(record) => {
              if (record.status === "blocked") return "blocked-row"
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
            setAllShops((prevShops) => prevShops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)))
          }}
        />
      )}

      <style jsx global>{`
        .blocked-row {
          background-color: #fff2f0 !important;
        }
        .blocked-row:hover {
          background-color: #ffebe6 !important;
        }
      `}</style>
    </div>
  )
}
