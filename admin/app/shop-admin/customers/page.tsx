"use client"
import type React from "react"
import { useState, useMemo, useEffect, use } from "react"
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
  Popover,
  Alert,
} from "antd"
import {
  SearchOutlined,
  UserOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import UserDetailModal from "./modal/UserDetailModal"
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie"
import { Order } from "@/app/ts/oder"
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const { Title, Text } = Typography
const { Option } = Select

interface CancelStatus {
  level: "normal" | "warning" | "danger"
  color: string
}

interface Reports {
  total: number
  reasons: string[]
  dates: string[]
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
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true) // đổi lại thành true sau khi test
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
         
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const rawResult = await response.json()
      console.log("rawResult", rawResult.data);
      

      // Transform the raw response to match ApiResponse interface
      const result: ApiResponse = {
        status: rawResult.status || false,
        message: rawResult.message || "",
        data: (rawResult.data || []).map((user: any, index: number) => ({
          id: user.id?.toString() || `user-${index}-${Date.now()}`,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          totalOrders: user.total_orders || 0,
          totalSpent: user.total_spent || 0,
          canceledOrders: user.cancelled_orders_count || 0,
          cancelStatus: {
            level: user.risk_level || "normal",
            color: user.risk_level === "danger" ? "red" : 
                   user.risk_level === "warning" ? "orange" : "green"
          },
          cancel_details: user.cancel_details || [],
          lastOrderAt: user.last_order_at || undefined,
          avatar: user.avatar || undefined,
        })),
        pagination: {
          current_page: rawResult.meta?.current_page || page,
          last_page: rawResult.meta?.last_page || 1,
          per_page: rawResult.meta?.per_page || pageSize,
          total: rawResult.meta?.total || 0
        }
      };

      if (response.ok) {
        setUsers(result.data)
        setPagination((prev) => ({
          ...prev,
          current: result.pagination.current_page,
          total: result.pagination.total,
          pageSize: result.pagination.per_page,
        }))
      } else {
        message.error(result.message || "Có lỗi xảy ra khi tải dữ liệu")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      message.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize)
  }, [pagination.current, pagination.pageSize])

  // Lọc dữ liệu (client-side filtering)
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchText === "" ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText)

      const matchesRisk = riskFilter === "all" || user.cancelStatus.level === riskFilter

      // total_orders filter
      let matchesOrders = true;
      if (ordersFilter === "0-5") matchesOrders = user.totalOrders >= 0 && user.totalOrders <= 5;
      else if (ordersFilter === "6-10") matchesOrders = user.totalOrders >= 6 && user.totalOrders <= 10;
      else if (ordersFilter === ">10") matchesOrders = user.totalOrders > 10;

      // total_spent filter
      let matchesSpent = true;
      if (spentFilter === "<1m") matchesSpent = user.totalSpent < 1_000_000;
      else if (spentFilter === "1-10m") matchesSpent = user.totalSpent >= 1_000_000 && user.totalSpent <= 10_000_000;
      else if (spentFilter === ">10m") matchesSpent = user.totalSpent > 10_000_000;

      // has_cancelled_order filter
      let matchesCancelled = true;
      if (canceledFilter === "true") matchesCancelled = user.canceledOrders > 0;
      else if (canceledFilter === "false") matchesCancelled = user.canceledOrders === 0;

      return (
        matchesSearch &&
        matchesRisk &&
        matchesOrders &&
        matchesSpent &&
        matchesCancelled
      );

    })
  }, [users, searchText, riskFilter, ordersFilter, spentFilter, canceledFilter]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10

    setPagination({
      ...pagination,
      ...newPagination,
    })
    fetchUsers(newPage, newPageSize)
  }

  const handleReset = () => {
    setSearchText("")
    setRiskFilter("all")
    setOrdersFilter("all")
    setSpentFilter("all")
    setCanceledFilter("all")
    setPagination({
      ...pagination,
      current: 1,
    })
    fetchUsers(1, pagination.pageSize)
  }

  const columns: ColumnsType<UserData> = [
    {
      title: "Người dùng",
      key: "user",
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            src={`${STATIC_BASE_URL}/${record.avatar}`}
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div
              style={{
                fontWeight: 500,
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <Tooltip title={record.name}>{record.name}</Tooltip>
            </div>
            <div style={{ color: "#666", fontSize: "12px" }}>ID: {record.id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      width: 180,
      render: (_, record) => (
        <div>
          <div
            style={{
              marginBottom: 4,
              fontSize: "13px",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Tooltip title={record.email}>{record.email}</Tooltip>
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
            <Tooltip title={record.phone}>{record.phone}</Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: "Đơn hàng",
      key: "orders",
      width: 120,
      render: (_, record) => (
        <div>
          <div>
            <Badge count={record.totalOrders} showZero color="#1890ff" />
            <span style={{ marginLeft: 6, fontSize: 11 }}>Tổng</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <Badge count={record.canceledOrders} showZero color={record.cancelStatus.color} />
            <span style={{ marginLeft: 6, fontSize: 11 }}>Hủy</span>
            {record.cancelStatus.level !== "normal" && (
              <Tooltip
                title={record.cancelStatus.level === "danger" ? "Cảnh báo: Quá nhiều đơn hủy" : "Chú ý: Số đơn hủy cao"}
              >
                {record.cancelStatus.level === "danger" ? (
                  <ExclamationCircleOutlined style={{ color: "red", marginLeft: 4 }} />
                ) : (
                  <WarningOutlined style={{ color: "orange", marginLeft: 4 }} />
                )}
              </Tooltip>
            )}
          </div>
        </div>
      ),
      sorter: (a: UserData, b: UserData) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 120,
      render: (amount: number) => {
        const formattedAmount = amount.toLocaleString("vi-VN") + " ₫"
        return (
          <Tooltip title={formattedAmount}>
            <Text
              strong
              style={{
                color: "#52c41a",
                fontSize: "13px",
                maxWidth: 110,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              {formattedAmount}
            </Text>
          </Tooltip>
        )
      },
      sorter: (a: UserData, b: UserData) => a.totalSpent - b.totalSpent,
    },
    {
      title: "Đơn gần nhất",
      key: "reports",
      width: 120,
      render: (_, record) => {
        if (!record.lastOrderAt) {
          return <Text>Chưa có đơn</Text>
        }
        const date = new Date(record.lastOrderAt);
        const timeAgo = formatDistanceToNow(date, { locale: vi, addSuffix: true });
        const exactDate = date.toLocaleDateString("vi-VN", { hour12: false });
        return (
          <Tooltip title={exactDate}><Text style={{ fontSize: "13px" }}>({timeAgo})</Text></Tooltip>
        )
      },
      sorter: (a: UserData, b: UserData) => {
        if (!a.lastOrderAt || !b.lastOrderAt) return 0
        return new Date(a.lastOrderAt).getTime() - new Date(b.lastOrderAt).getTime()
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record: UserData) => (
        <Button type="link" size="small" onClick={() => showUserDetail(record)}>
          Chi tiết
        </Button>
      ),
    },
  ]

  const showUserDetail = (user: UserData) => {
    setSelectedUser(user)
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedUser(null)
  }

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = filteredData.length
    const dangerUsers = filteredData.filter((u) => u.cancelStatus.level === "danger").length
    const warningUsers = filteredData.filter((u) => u.cancelStatus.level === "warning").length
    const frequentBuyers = filteredData.filter((u) => u.totalOrders >= 10).length

    return { total, dangerUsers, warningUsers, frequentBuyers }
  }, [filteredData])

  return (
    <div style={{ padding: "2px" }}>
      {/* Thống kê cảnh báo */}
      {(stats.dangerUsers > 0 || stats.warningUsers > 0 || stats.frequentBuyers > 0) && (
        <Row gutter={16} style={{ marginBottom: 2 }}>
          {stats.dangerUsers > 0 && (
            <Col span={8}>
              <Alert
                message={`${stats.dangerUsers} người dùng có nguy cơ cao`}
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
            </Col>
          )}
          {stats.warningUsers > 0 && (
            <Col span={8}>
              <Alert
                message={`${stats.warningUsers} người dùng cần chú ý`}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
              />
            </Col>
          )}
          {stats.frequentBuyers > 0 && (
            <Col span={8}>
              <Alert message={`${stats.frequentBuyers} người dùng mua sắm thường xuyên`} type="info" showIcon />
            </Col>
          )}
        </Row>
      )}

      <Card style={{ marginBottom: "2px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={22} sm={6} md={4}>
            <Select placeholder="Số đơn hàng" value={ordersFilter} onChange={setOrdersFilter} style={{ width: "100%" }}>
              <Option value="all">Tất cả số đơn hàng</Option>
              <Option value="0-5">0-5</Option>
              <Option value="6-10">6-10</Option>
              <Option value=">10">{'>'}10</Option>
            </Select>
          </Col>
          <Col xs={22} sm={6} md={4}>
            <Select placeholder="Số tiền đã chi" value={spentFilter} onChange={setSpentFilter} style={{ width: "100%" }}>
              <Option value="all">Tất cả tiền chi</Option>
              <Option value="<1m">{'<'} 1 triệu</Option>
              <Option value="1-10m">1 triệu - 10 triệu</Option>
              <Option value=">10m">{'>'} 10 triệu</Option>
            </Select>
          </Col>
          <Col xs={22} sm={6} md={4}>
            <Select placeholder="Đơn hủy" value={canceledFilter} onChange={setCanceledFilter} style={{ width: "100%" }}>
              <Option value="all">Đơn hủy-không hủy</Option>
              <Option value="true">Có hủy</Option>
              <Option value="false">Không hủy</Option>
            </Select>
          </Col>
          <Col xs={22} sm={6} md={4}>
            <Select
              placeholder="Mức độ rủi ro"
              value={riskFilter}
              onChange={setRiskFilter}
              style={{ width: "100%" }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">Tất cả mức độ</Option>
              <Option value="normal">Bình thường</Option>
              <Option value="warning">Cảnh báo</Option>
              <Option value="danger">Nguy hiểm</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
                loading={loading}
              >
                Làm mới
              </Button>
              <Text type="secondary">Tìm thấy {filteredData.length} người dùng</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record, index) => record.id || `row-${index}-${record.email}-${Date.now()}`}
            pagination={{
              ...pagination,
              total: pagination.total, // Use API pagination total, not filtered data length
            }}
            onChange={handleTableChange}
            size="middle"
            rowClassName={(record) => {
              if (record.cancelStatus.level === "danger") return "danger-row"
              if (record.cancelStatus.level === "warning") return "warning-row"
              return ""
            }}
          />
        </Spin>
      </Card>

      {selectedUser && <UserDetailModal user={selectedUser} visible={isModalVisible} onClose={handleCloseModal} />}

      <style jsx global>{`
        .danger-row {
          background-color: #fff2f0 !important;
        }
        .warning-row {
          background-color: #fffbe6 !important;
        }
        .danger-row:hover {
          background-color: #ffebe6 !important;
        }
        .warning-row:hover {
          background-color: #fff7db !important;
        }
      `}</style>
    </div>
  )
}
