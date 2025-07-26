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
} from "antd"
import { SearchOutlined, UserOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import UserDetailModal from "./modal/UserDetailModal"

const { Title } = Typography
const { Option } = Select

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "blocked" | "inactive" | "hidden"
  registrationDate: string
  totalOrders: number
  totalSpent: number
  avatar?: string
  // Thêm các field cho modal
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

      // Lấy token từ cookie
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      const response = await fetch(`/api/admin/users?page=${page}&per_page=${pageSize}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include", // Để gửi cookie
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
      console.error("Error fetching users:", error)
      message.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  // Load data khi component mount
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

      return matchesSearch && matchesStatus
    })
  }, [users, searchText, statusFilter])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10

    setPagination({
      ...pagination,
      ...newPagination,
    })

    // Gọi API với trang mới
    fetchUsers(newPage, newPageSize)
  }

  const handleReset = () => {
    setSearchText("")
    setStatusFilter("all")
    setPagination({
      ...pagination,
      current: 1,
    })
    // Reload data
    fetchUsers(1, pagination.pageSize)
  }

  const columns: ColumnsType<UserData> = [
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      key: "avatar",
      width: 80,
      render: (avatar: string, record: UserData) => (
        <Tooltip title={record.name}>
          <Avatar src={avatar || <UserOutlined />} />
        </Tooltip>
      ),
    },
    {
      title: "Tên người dùng",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (text: string) => <a>{text}</a>,
      sorter: (a: UserData, b: UserData) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      sorter: (a: UserData, b: UserData) => a.email.localeCompare(b.email),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        let color = "green"
        if (status === "blocked") {
          color = "red"
        } else if (status === "inactive") {
          color = "gray"
        } else if (status === "hidden") {
          color = "orange"
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>
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
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      key: "registrationDate",
      width: 150,
      sorter: (a: UserData, b: UserData) =>
        new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Tổng đơn hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      width: 100,
      sorter: (a: UserData, b: UserData) => a.totalOrders - b.totalOrders,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 100,
      sorter: (a: UserData, b: UserData) => a.totalSpent - b.totalSpent,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record: UserData) => (
        <Space size="middle">
          <Button type="link" onClick={() => showUserDetail(record)}>
            Xem chi tiết
          </Button>
        </Space>
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

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Quản lý người dùng</Title>

      <Card style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="blocked">Bị khóa</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="hidden">Ẩn</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
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
              <div style={{ color: "#666" }}>Tìm thấy {filteredData.length} người dùng</div>
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
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Spin>
      </Card>

      {selectedUser && <UserDetailModal user={selectedUser} visible={isModalVisible} onClose={handleCloseModal} />}
    </div>
  )
}
