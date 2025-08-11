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
  role: "customer" | "seller" | "admin"
  status: "active" | "blocked" | "inactive" | "hidden"
  registrationDate: string
  totalOrders: number
  totalSpent: number
  canceledOrders: number
  cancelStatus: CancelStatus
  reports: Reports
  avatar?: string
  gender?: "male" | "female" | "other"
  birthDate?: string
  address?: string
  lastLogin?: string
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
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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
      const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}&per_page=${pageSize}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const result: ApiResponse = await response.json()
      if (result.status) {
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
      message.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize)
  }, [])

  // Lọc dữ liệu (client-side filtering)
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchText === "" ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText)

      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      const matchesRisk = riskFilter === "all" || user.cancelStatus.level === riskFilter

      return matchesSearch && matchesStatus && matchesRisk
    })
  }, [users, searchText, statusFilter, riskFilter])

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
    setStatusFilter("all")
    setRiskFilter("all")
    setPagination({
      ...pagination,
      current: 1,
    })
    fetchUsers(1, pagination.pageSize)
  }

  // Render reports popover content
  const renderReportsContent = (reports: Reports) => {
    if (reports.total === 0) {
      return <Text>Không có báo cáo nào</Text>
    }

    return (
      <div style={{ maxWidth: 200 }}>
        <Text strong>Tổng số báo cáo: {reports.total}</Text>
        <div style={{ marginTop: 8 }}>
          {reports.reasons.slice(0, 3).map((reason, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <Tag
                color="red"
                style={{
                  maxWidth: 150,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                }}
              >
                <Tooltip title={reason}>{reason}</Tooltip>
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(reports.dates[index]).toLocaleDateString("vi-VN")}
              </Text>
            </div>
          ))}
          {reports.reasons.length > 3 && <Text type="secondary">...và {reports.reasons.length - 3} báo cáo khác</Text>}
        </div>
      </div>
    )
  }

  const columns: ColumnsType<UserData> = [
    {
      title: "Người dùng",
      key: "user",
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
        src={
          record.avatar
            ? record.avatar.startsWith("http")
              ? record.avatar
              : `${STATIC_BASE_URL}/${record.avatar}`
            : `${STATIC_BASE_URL}/default-avatar.png`
        }
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          active: { color: "green", text: "Hoạt động" },
          blocked: { color: "red", text: "Bị khóa" },
          inactive: { color: "gray", text: "Không hoạt động" },
          hidden: { color: "orange", text: "Ẩn" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Bị khóa", value: "blocked" },
        { text: "Không hoạt động", value: "inactive" },
        { text: "Ẩn", value: "hidden" },
      ],
      onFilter: (value: boolean | React.Key, record: UserData) => {
        return record.status === String(value)
      },
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
      title: "Báo cáo",
      key: "reports",
      width: 80,
      render: (_, record) => {
        if (record.reports.total === 0) {
          return (
            <Tooltip title="Không có báo cáo">
              <CheckCircleOutlined style={{ color: "green" }} />
            </Tooltip>
          )
        }
        return (
          <Popover content={renderReportsContent(record.reports)} title="Chi tiết báo cáo" trigger="hover">
            <Badge count={record.reports.total} size="small">
              <Button type="text" danger size="small" icon={<ExclamationCircleOutlined />} style={{ border: "none" }} />
            </Badge>
          </Popover>
        )
      },
      sorter: (a: UserData, b: UserData) => a.reports.total - b.reports.total,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      key: "registrationDate",
      width: 120,
      render: (date: string) => <Text style={{ fontSize: "12px" }}>{new Date(date).toLocaleDateString("vi-VN")}</Text>,
      sorter: (a: UserData, b: UserData) =>
        new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
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
    const reportedUsers = filteredData.filter((u) => u.reports.total > 0).length

    return { total, dangerUsers, warningUsers, reportedUsers }
  }, [filteredData])

  return (
    <div style={{ padding: "2px" }}>
      {/* Thống kê cảnh báo */}
      {(stats.dangerUsers > 0 || stats.warningUsers > 0 || stats.reportedUsers > 0) && (
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
          {stats.reportedUsers > 0 && (
            <Col span={8}>
              <Alert message={`${stats.reportedUsers} người dùng bị báo cáo`} type="info" showIcon />
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
          <Col xs={24} sm={8} md={5}>
            <Select placeholder="Trạng thái" value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="blocked">Bị khóa</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="hidden">Ẩn</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
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
            rowKey="id"
            pagination={{
              ...pagination,
              total: filteredData.length,
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
