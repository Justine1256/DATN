"use client"

import { use, useEffect, useState } from "react"
import {
  Modal,
  Tabs,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  Space,
  Typography,
  Statistic,
  Timeline,
  Popconfirm,
  message,
  Badge,
  Divider,
} from "antd"
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  LoginOutlined,
  DollarOutlined,
  ShopOutlined,
  CrownOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/vi"
import { Order } from "@/app/ts/oder"
import { STATIC_BASE_URL } from "@/utils/api"


const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface OrderData {
  id: string
  date: string
  total: number
  status: "completed" | "pending" | "cancelled"
  items: number
}


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
  address?: string
}

interface LoginHistory {
  id: string
  date: string
  ip: string
  device: string
  location: string
}

interface UserDetailModalProps {
  user: UserData
  visible: boolean
  onClose: () => void
}

// Dữ liệu mẫu
const mockOrders: OrderData[] = [
  { id: "ORD001", date: "2024-03-20", total: 1250000, status: "completed", items: 3 },
  { id: "ORD002", date: "2024-03-15", total: 890000, status: "completed", items: 2 },
  { id: "ORD003", date: "2024-03-10", total: 2100000, status: "pending", items: 5 },
]

const mockLoginHistory: LoginHistory[] = [
  {
    id: "1",
    date: "2024-03-21 14:30:00",
    ip: "192.168.1.100",
    device: "Chrome 122.0 - Windows 10",
    location: "Hà Nội, Việt Nam",
  },
  {
    id: "2",
    date: "2024-03-20 09:15:00",
    ip: "192.168.1.100",
    device: "Mobile Safari - iOS 17.3",
    location: "Hà Nội, Việt Nam",
  },
  {
    id: "3",
    date: "2024-03-19 16:45:00",
    ip: "192.168.1.100",
    device: "Chrome 122.0 - Windows 10",
    location: "Hà Nội, Việt Nam",
  },
]

dayjs.extend(relativeTime)
dayjs.locale("vi")

export default function UserDetailModal({ user, visible, onClose }: UserDetailModalProps) {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const orderColumns: ColumnsType<OrderData> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Số SP",
      dataIndex: "items",
      key: "items",
      render: (items: number) => <Badge count={items} showZero color="#1890ff" />,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (total: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {total.toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap = {
          completed: { color: "green", text: "Hoàn thành" },
          pending: { color: "orange", text: "Đang xử lý" },
          cancelled: { color: "red", text: "Đã hủy" },
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
  ]

  const handleSave = async (values: any) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("Cập nhật thông tin thành công!")
      setEditing(false)
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!")
    }
  }

  const handleResetPassword = () => {
    message.success("Đã gửi email reset mật khẩu đến người dùng!")
  }

  const handleDeleteAccount = () => {
    message.success("Đã xóa tài khoản thành công!")
    onClose()
  }

  return (
    <Modal
      title={
        <Space>
          <Avatar
            src={`${STATIC_BASE_URL}/${user.avatar}`}
          />
          <span>Chi tiết người dùng - {user.name}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Title level={4}>Thông tin cá nhân & Liên hệ</Title>
        </div>
          <Row gutter={16}>
            <Col span={4}>
              <Avatar
                src={`${STATIC_BASE_URL}/${user.avatar}`}
                size={80}
              />
            </Col>
            <Col span={18}>
              <Row gutter={[16, 12]}>
                <Col span={8}>
                  <Text strong>Họ và tên:</Text>
                  <br />
                  <Text>{user.name}</Text>
                </Col>
                <Col span={10}>
                  <Text strong>Email:</Text>
                  <br />
                  <Text>{user.email}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>Số điện thoại:</Text>
                  <br />
                  <Text>{user.phone}</Text>
                </Col>
              </Row>
            </Col>
          </Row>

        <Space direction="vertical" size="large" style={{ width: "100%", marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic title="Tổng đơn hàng" value={user.totalOrders} prefix={<ShoppingCartOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Tổng chi tiêu"
                  value={user.totalSpent}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${value?.toLocaleString("vi-VN")} ₫`}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Đơn hàng gần nhất" size="small">
            <Table
              columns={orderColumns}
              dataSource={mockOrders}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Space>
      </Card>
    </Modal>
  )
}
