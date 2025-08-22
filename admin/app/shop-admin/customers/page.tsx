"use client"
import type React from "react"
import { useState, useMemo, useEffect } from "react"
import type { ReactNode } from "react"
import {
  Table,
  Input,
  Select,
  Space,
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
  Grid,
} from "antd"
import {
  SearchOutlined,
  UserOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import UserDetailModal from "./modal/UserDetailModal"
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie"
import { Order } from "@/app/ts/oder"
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

const { Title, Text } = Typography
const { Option } = Select

interface CancelStatus {
  level: "normal" | "warning" | "danger"
  color: string
}

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  canceledOrders: number
  cancelStatus: CancelStatus
  cancel_details: Order[]
  lastOrderAt?: string
  avatar?: string
}

interface ApiResponse {
  status: boolean
  message: string
  data: UserData[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export default function UserManagementPage() {
  const screens = Grid.useBreakpoint()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [canceledFilter, setCanceledFilter] = useState<string>("all")
  const [ordersFilter, setOrdersFilter] = useState<string>("all")
  const [spentFilter, setSpentFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
  })
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Fetch users từ API
  const fetchUsers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const token = Cookies.get("authToken")
      const response = await fetch(`${API_BASE_URL}/buy/order/customers?page=${page}&per_page=${pageSize}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch users")
      const rawResult = await response.json()
      const result: ApiResponse = {
        status: rawResult.status || false,
        message: rawResult.message || "",
        data: (rawResult.data || []).map((user: any, index: number): UserData => ({
          id: user.id?.toString() || `user-${index}-${Date.now()}`,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          totalOrders: user.total_orders || 0,
          totalSpent: user.total_spent || 0,
          canceledOrders: user.cancelled_orders_count || 0,
          cancelStatus: {
            level: (user.risk_level as CancelStatus["level"]) || "normal",
            color: user.risk_level === "danger" ? "red" : user.risk_level === "warning" ? "orange" : "green",
          },
          cancel_details: (user.cancel_details as Order[]) || [],
          lastOrderAt: user.last_order_at || undefined,
          avatar: user.avatar || undefined,
        })),
        pagination: {
          current_page: rawResult.meta?.current_page || page,
          last_page: rawResult.meta?.last_page || 1,
          per_page: rawResult.meta?.per_page || pageSize,
          total: rawResult.meta?.total || 0,
        },
      }
      setUsers(result.data)
      setPagination((prev) => ({
        ...prev,
        current: result.pagination.current_page,
        total: result.pagination.total,
        pageSize: result.pagination.per_page,
      }))
    } catch (error) {
      console.error("Error fetching users:", error)
      message.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(pagination.current || 1, pagination.pageSize || 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize])

  // Lọc dữ liệu (client-side filtering)
  const filteredData = useMemo(() => {
    return users.filter((user: UserData) => {
      const matchesSearch =
        searchText === "" ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText)

      const matchesRisk = riskFilter === "all" || user.cancelStatus.level === riskFilter

      // total_orders filter
      let matchesOrders = true
      if (ordersFilter === "0-5") matchesOrders = user.totalOrders >= 0 && user.totalOrders <= 5
      else if (ordersFilter === "6-10") matchesOrders = user.totalOrders >= 6 && user.totalOrders <= 10
      else if (ordersFilter === ">10") matchesOrders = user.totalOrders > 10

      // total_spent filter
      let matchesSpent = true
      if (spentFilter === "<1m") matchesSpent = user.totalSpent < 1_000_000
      else if (spentFilter === "1-10m") matchesSpent = user.totalSpent >= 1_000_000 && user.totalSpent <= 10_000_000
      else if (spentFilter === ">10m") matchesSpent = user.totalSpent > 10_000_000

      // has_cancelled_order filter
      let matchesCancelled = true
      if (canceledFilter === "true") matchesCancelled = user.canceledOrders > 0
      else if (canceledFilter === "false") matchesCancelled = user.canceledOrders === 0

      return matchesSearch && matchesRisk && matchesOrders && matchesSpent && matchesCancelled
    })
  }, [users, searchText, riskFilter, ordersFilter, spentFilter, canceledFilter])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10
    setPagination({ ...pagination, ...newPagination })
    fetchUsers(newPage, newPageSize)
  }

  const handleReset = () => {
    setSearchText("")
    setRiskFilter("all")
    setOrdersFilter("all")
    setSpentFilter("all")
    setCanceledFilter("all")
    setPagination({ ...pagination, current: 1 })
    fetchUsers(1, pagination.pageSize || 10)
  }

  // ===== Responsive columns =====
  const columns: ColumnsType<UserData> = useMemo(() => {
    const base: ColumnsType<UserData> = [
      {
        title: "Người dùng",
        key: "user",
        width: 220,
        fixed: screens.xs ? undefined : 'left',
        render: (_: unknown, record: UserData): ReactNode => (
          <Space>
            <Avatar
              src={record.avatar ? `${STATIC_BASE_URL}/${record.avatar}` : undefined}
              icon={<UserOutlined />}
              size={screens.xs ? 36 : 40}
            />
            <div>
              <div style={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <Tooltip title={record.name}>{record.name}</Tooltip>
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>ID: {record.id}</div>
            </div>
          </Space>
        ),
      },
      !screens.xs && {
        title: "Liên hệ",
        key: "contact",
        width: 220,
        render: (_: unknown, record: UserData): ReactNode => (
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Tooltip title={record.email}>{record.email}</Tooltip>
            </div>
            <div style={{ color: "#666", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Tooltip title={record.phone}>{record.phone}</Tooltip>
            </div>
          </div>
        ),
      },
      {
        title: "Đơn hàng",
        key: "orders",
        width: 140,
        render: (_: unknown, record: UserData): ReactNode => {
          const reasonsNode: ReactNode = record.cancel_details && record.cancel_details.length > 0
            ? (() => {
              const uniqueReasons = Array.from(
                new Set(
                  (record.cancel_details as Order[])
                    .map((o: Order) => o?.cancel_reason?.trim())
                    .filter(Boolean)
                )
              )
              if (uniqueReasons.length === 0) return "không có lý do hủy"
              return uniqueReasons.map((reason, idx) => <div key={idx}>• {reason}</div>)
            })()
            : "không có lý do hủy"

          return (
            <div>
              <div>
                <Badge count={record.totalOrders} showZero color="#1890ff" />
                <span style={{ marginLeft: 6, fontSize: 11 }}>Tổng</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <Badge count={record.canceledOrders} showZero color={record.cancelStatus.color} />
                <Tooltip title={reasonsNode}>
                  <span style={{ marginLeft: 6, fontSize: 11, cursor: "pointer" }}>Hủy</span>
                </Tooltip>
              </div>
            </div>
          )
        },
        sorter: (a: UserData, b: UserData) => a.totalOrders - b.totalOrders,
        responsive: ['xs', 'sm', 'md', 'lg'],
      },
      {
        title: "Chi tiêu",
        dataIndex: "totalSpent",
        key: "totalSpent",
        width: 140,
        render: (amount: number): ReactNode => {
          const formattedAmount = amount.toLocaleString("vi-VN") + " ₫"
          return (
            <Tooltip title={formattedAmount}>
              <Text strong style={{ color: "#52c41a", fontSize: 13, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                {formattedAmount}
              </Text>
            </Tooltip>
          )
        },
        sorter: (a: UserData, b: UserData) => a.totalSpent - b.totalSpent,
      },
      {
        title: "Đơn gần nhất",
        key: "lastOrder",
        width: 150,
        render: (_: unknown, record: UserData): ReactNode => {
          if (!record.lastOrderAt) return <Text>Chưa có đơn</Text>
          const date = new Date(record.lastOrderAt)
          const timeAgo = formatDistanceToNow(date, { locale: vi, addSuffix: true })
          const exactDate = date.toLocaleDateString("vi-VN", { hour12: false })
          return <Tooltip title={exactDate}><Text style={{ fontSize: 13 }}>({timeAgo})</Text></Tooltip>
        },
        sorter: (a: UserData, b: UserData) => {
          if (!a.lastOrderAt || !b.lastOrderAt) return 0
          return new Date(a.lastOrderAt).getTime() - new Date(b.lastOrderAt).getTime()
        },
        responsive: ['sm', 'md', 'lg', 'xl'],
      },
      {
        title: "Thao tác",
        key: "action",
        width: 100,
        fixed: screens.xs ? undefined : 'right',
        render: (_: unknown, record: UserData): ReactNode => (
          <Button type="link" size="small" onClick={() => showUserDetail(record)}>
            Chi tiết
          </Button>
        ),
      },
    ].filter(Boolean) as ColumnsType<UserData>

    return base
  }, [screens])

  const showUserDetail = (user: UserData) => {
    setSelectedUser(user)
    setIsModalVisible(true)
  }
  const handleCloseModal = () => { setIsModalVisible(false); setSelectedUser(null) }

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = filteredData.length
    const dangerUsers = filteredData.filter((u: UserData) => u.cancelStatus.level === "danger").length
    const warningUsers = filteredData.filter((u: UserData) => u.cancelStatus.level === "warning").length
    const frequentBuyers = filteredData.filter((u: UserData) => u.totalOrders >= 10).length
    return { total, dangerUsers, warningUsers, frequentBuyers }
  }, [filteredData])

  return (
    <div style={{ padding: screens.xs ? 8 : 12 }}>
      {/* Banner thống kê (ẩn bớt trên mobile nếu trống) */}
      {(stats.dangerUsers > 0 || stats.warningUsers > 0 || stats.frequentBuyers > 0) && (
        <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
          {stats.dangerUsers > 0 && (
            <Col xs={24} md={8}>
              <Alert message={`${stats.dangerUsers} người dùng có nguy cơ cao`} type="error" showIcon icon={<ExclamationCircleOutlined />} />
            </Col>
          )}
          {stats.warningUsers > 0 && (
            <Col xs={24} md={8}>
              <Alert message={`${stats.warningUsers} người dùng cần chú ý`} type="warning" showIcon icon={<WarningOutlined />} />
            </Col>
          )}
          {stats.frequentBuyers > 0 && (
            <Col xs={24} md={8}>
              <Alert message={`${stats.frequentBuyers} người dùng mua sắm thường xuyên`} type="info" showIcon />
            </Col>
          )}
        </Row>
      )}

      {/* Thanh filter responsive */}
      <Card size={screens.xs ? 'small' : 'default'} style={{ marginBottom: 8 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select value={ordersFilter} onChange={setOrdersFilter} style={{ width: "100%" }} placeholder="Số đơn hàng" suffixIcon={<FilterOutlined />}>
              <Option value="all">Tất cả</Option>
              <Option value="0-5">0-5</Option>
              <Option value="6-10">6-10</Option>
              <Option value=">10">{">"}10</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select value={spentFilter} onChange={setSpentFilter} style={{ width: "100%" }} placeholder="Số tiền đã chi">
              <Option value="all">Tất cả</Option>
              <Option value="<1m">{"<"} 1 triệu</Option>
              <Option value="1-10m">1 - 10 triệu</Option>
              <Option value=">10m">{">"} 10 triệu</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select value={canceledFilter} onChange={setCanceledFilter} style={{ width: "100%" }} placeholder="Đơn hủy">
              <Option value="all">Hủy / Không hủy</Option>
              <Option value="true">Có hủy</Option>
              <Option value="false">Không hủy</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select value={riskFilter} onChange={setRiskFilter} style={{ width: "100%" }} placeholder="Mức độ rủi ro" suffixIcon={<FilterOutlined />}>
              <Option value="all">Tất cả</Option>
              <Option value="normal">Bình thường</Option>
              <Option value="warning">Cảnh báo</Option>
              <Option value="danger">Nguy hiểm</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>Đặt lại</Button>
              <Button type="primary" onClick={() => fetchUsers(pagination.current || 1, pagination.pageSize || 10)} loading={loading}>Làm mới</Button>
              <Text type="secondary">{`Tìm thấy ${filteredData.length} người dùng`}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bảng dữ liệu */}
      <Card size={screens.xs ? 'small' : 'default'}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record: UserData, index) => record.id || `row-${index}-${record.email}-${Date.now()}`}
            pagination={{
              ...pagination,
              size: screens.xs ? 'small' : 'default',
              showLessItems: screens.xs,
              responsive: true,
            }}
            onChange={handleTableChange}
            size={screens.xs ? 'small' : 'middle'}
            sticky
            scroll={{ x: screens.xs ? 720 : undefined }}
            rowClassName={(record: UserData) => {
              if (record.cancelStatus.level === "danger") return "danger-row"
              if (record.cancelStatus.level === "warning") return "warning-row"
              return ""
            }}
          />
        </Spin>
      </Card>

      {selectedUser && (
        <UserDetailModal user={selectedUser} visible={isModalVisible} onClose={handleCloseModal} />
      )}

      <style jsx global>{`
        .danger-row { background-color: #fff2f0 !important; }
        .warning-row { background-color: #fffbe6 !important; }
        .danger-row:hover { background-color: #ffebe6 !important; }
        .warning-row:hover { background-color: #fff7db !important; }
        /* Thu gọn padding ô bảng trên màn nhỏ */
        @media (max-width: 575.98px) {
          .ant-table-wrapper .ant-table { font-size: 12px; }
          .ant-table-cell { padding: 8px 10px !important; }
        }
      `}</style>
    </div>
  )
}
