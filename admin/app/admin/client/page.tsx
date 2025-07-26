"use client"

import { useState, useMemo } from "react"
import { Table, Input, Select, Space, Tag, Button, Card, Row, Col, Typography, Avatar, Tooltip, Badge } from "antd"
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
  status: "active" | "blocked"
  registrationDate: string
  totalOrders: number
  totalSpent: number
  avatar?: string
}

// Dữ liệu mẫu
const mockUsers: UserData[] = [
  {
    id: "USR001",
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0901234567",
    status: "active",
    registrationDate: "2024-01-15",
    totalOrders: 25,
    totalSpent: 15750000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR002",
    name: "Trần Thị Bình",
    email: "tranthibinh@email.com",
    phone: "0912345678",
    status: "active",
    registrationDate: "2024-02-20",
    totalOrders: 18,
    totalSpent: 8900000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR003",
    name: "Lê Minh Cường",
    email: "leminhcuong@email.com",
    phone: "0923456789",
    status: "blocked",
    registrationDate: "2024-01-08",
    totalOrders: 5,
    totalSpent: 2100000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR004",
    name: "Phạm Thu Dung",
    email: "phamthudung@email.com",
    phone: "0934567890",
    status: "active",
    registrationDate: "2024-03-10",
    totalOrders: 42,
    totalSpent: 28500000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR005",
    name: "Hoàng Văn Em",
    email: "hoangvanem@email.com",
    phone: "0945678901",
    status: "active",
    registrationDate: "2024-02-28",
    totalOrders: 12,
    totalSpent: 6750000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR006",
    name: "Đỗ Thị Phương",
    email: "dothiphuong@email.com",
    phone: "0956789012",
    status: "blocked",
    registrationDate: "2024-01-25",
    totalOrders: 8,
    totalSpent: 3200000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR007",
    name: "Vũ Minh Giang",
    email: "vuminhgiang@email.com",
    phone: "0967890123",
    status: "active",
    registrationDate: "2024-03-05",
    totalOrders: 33,
    totalSpent: 19800000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR008",
    name: "Bùi Thị Hoa",
    email: "buithihoa@email.com",
    phone: "0978901234",
    status: "active",
    registrationDate: "2024-02-14",
    totalOrders: 21,
    totalSpent: 11400000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR009",
    name: "Ngô Văn Inh",
    email: "ngovaninh@email.com",
    phone: "0989012345",
    status: "active",
    registrationDate: "2024-01-30",
    totalOrders: 16,
    totalSpent: 9200000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "USR010",
    name: "Lý Thị Kim",
    email: "lythikim@email.com",
    phone: "0990123456",
    status: "blocked",
    registrationDate: "2024-03-01",
    totalOrders: 3,
    totalSpent: 1500000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function UserManagementPage() {
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: mockUsers.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
  })

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        searchText === "" ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText)

      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchText, statusFilter])

  const handleViewDetail = (user: UserData) => {
    setSelectedUser(user)
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedUser(null)
  }

  // Định nghĩa cột
  const columns: ColumnsType<UserData> = [
    {
      title: "Người dùng",
      key: "user",
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} size={40} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ color: "#666", fontSize: "12px" }}>ID: {record.id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Thông tin liên hệ",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>{record.email}</div>
          <div style={{ color: "#666", fontSize: "12px" }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>{status === "active" ? "Hoạt động" : "Bị khóa"}</Tag>
      ),
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Bị khóa", value: "blocked" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      key: "registrationDate",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      sorter: (a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
    },
    {
      title: "Đơn hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      width: 100,
      render: (orders: number) => <Badge count={orders} showZero color="#1890ff" />,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 150,
      render: (amount: number) => (
        <span style={{ fontWeight: 500, color: "#52c41a" }}>{amount.toLocaleString("vi-VN")} ₫</span>
      ),
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
              Chi tiết
            </Button>
          </Tooltip>
          <Tooltip title={record.status === "active" ? "Khóa tài khoản" : "Mở khóa"}>
            <Button type="link" size="small" danger={record.status === "active"}>
              {record.status === "active" ? "Khóa" : "Mở khóa"}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      ...newPagination,
    })
  }

  const handleReset = () => {
    setSearchText("")
    setStatusFilter("all")
    setPagination({
      ...pagination,
      current: 1,
    })
  }

  return (
    <div style={{ padding: "2px" }}>
      <Card style={{ marginBottom: "2px" }}>
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
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <div style={{ color: "#666" }}>Tìm thấy {filteredData.length} người dùng</div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
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
      </Card>
      {selectedUser && <UserDetailModal user={selectedUser} visible={isModalVisible} onClose={handleCloseModal} />}
    </div>
  )
}
