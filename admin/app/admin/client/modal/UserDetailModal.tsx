"use client"

import { useState } from "react"
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
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

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
  // Thông tin chi tiết
  gender?: "male" | "female" | "other"
  birthDate?: string
  address?: string
  lastLogin?: string
}

interface OrderData {
  id: string
  date: string
  total: number
  status: "completed" | "pending" | "cancelled"
  items: number
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

// Dữ liệu mẫu cho đơn hàng
const mockOrders: OrderData[] = [
  {
    id: "ORD001",
    date: "2024-03-20",
    total: 1250000,
    status: "completed",
    items: 3,
  },
  {
    id: "ORD002",
    date: "2024-03-15",
    total: 890000,
    status: "completed",
    items: 2,
  },
  {
    id: "ORD003",
    date: "2024-03-10",
    total: 2100000,
    status: "pending",
    items: 5,
  },
]

// Dữ liệu mẫu cho lịch sử đăng nhập
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
dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function UserDetailModal({ user, visible, onClose }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [editingInfo, setEditingInfo] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [form] = Form.useForm()
  const [contactForm] = Form.useForm()

  // Cột cho bảng đơn hàng
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
      title: "Số sản phẩm",
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

  // Cột cho lịch sử đăng nhập
  const loginColumns: ColumnsType<LoginHistory> = [
    {
      title: "Thời gian",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "Thiết bị",
      dataIndex: "device",
      key: "device",
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
    },
  ]

  const handleSaveInfo = async (values: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("Cập nhật thông tin thành công!")
      setEditingInfo(false)
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!")
    }
  }

  const handleSaveContact = async (values: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("Cập nhật thông tin liên hệ thành công!")
      setEditingContact(false)
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin liên hệ!")
    }
  }

  const handleResetPassword = () => {
    message.success("Đã gửi email reset mật khẩu đến người dùng!")
  }

  const handleToggleStatus = () => {
    const action = user.status === "active" ? "khóa" : "mở khóa"
    message.success(`Đã ${action} tài khoản thành công!`)
  }

  const handleDeleteAccount = () => {
    message.success("Đã xóa tài khoản thành công!")
    onClose()
  }

  const tabItems = [
    {
      key: "info",
      label: "Thông tin cá nhân",
      children: (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title level={4}>Thông tin cá nhân</Title>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setEditingInfo(!editingInfo)}>
              {editingInfo ? "Hủy" : "Chỉnh sửa"}
            </Button>
          </div>

          {editingInfo ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveInfo}
              initialValues={{
                name: user.name,
                gender: user.gender || "male",
                birthDate: user.birthDate ? dayjs(user.birthDate) : null,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Họ và tên" name="name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Giới tính" name="gender">
                    <Select>
                      <Option value="male">Nam</Option>
                      <Option value="female">Nữ</Option>
                      <Option value="other">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Ngày sinh" name="birthDate">
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => setEditingInfo(false)}>Hủy</Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <Row gutter={16}>
              <Col span={4}>
                <Avatar src={user.avatar} icon={<UserOutlined />} size={80} />
              </Col>
              <Col span={20}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Text strong>Họ và tên:</Text>
                    <br />
                    <Text>{user.name}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Giới tính:</Text>
                    <br />
                    <Text>{user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Ngày sinh:</Text>
                    <br />
                    <Text>{user.birthDate ? dayjs(user.birthDate).format("DD/MM/YYYY") : "Chưa cập nhật"}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Ngày đăng ký:</Text>
                    <br />
                    <Text>{dayjs(user.registrationDate).format("DD/MM/YYYY")}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Trạng thái:</Text>
                    <br />
                    <Tag color={user.status === "active" ? "green" : "red"}>
                      {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                    </Tag>
                  </Col>
                  <Col span={8}>
                    <Text strong>Lần đăng nhập cuối:</Text>
                    <br />
                    <Text>{user.lastLogin ? dayjs(user.lastLogin).format("DD/MM/YYYY HH:mm") : "Chưa có"}</Text>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Card>
      ),
    },
    {
      key: "contact",
      label: "Thông tin liên hệ",
      children: (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title level={4}>Thông tin liên hệ</Title>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setEditingContact(!editingContact)}>
              {editingContact ? "Hủy" : "Chỉnh sửa"}
            </Button>
          </div>

          {editingContact ? (
            <Form
              form={contactForm}
              layout="vertical"
              onFinish={handleSaveContact}
              initialValues={{
                email: user.email,
                phone: user.phone,
                address: user.address || "",
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Địa chỉ" name="address">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => setEditingContact(false)}>Hủy</Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Email:</Text>
                <br />
                <Text>{user.email}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Số điện thoại:</Text>
                <br />
                <Text>{user.phone}</Text>
              </Col>
              <Col span={24}>
                <Text strong>Địa chỉ:</Text>
                <br />
                <Text>{user.address || "Chưa cập nhật địa chỉ"}</Text>
              </Col>
            </Row>
          )}
        </Card>
      ),
    },
    {
      key: "activity",
      label: "Hoạt động",
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic title="Tổng đơn hàng" value={user.totalOrders} prefix={<ShoppingCartOutlined />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng chi tiêu"
                  value={user.totalSpent}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${value?.toLocaleString("vi-VN")} ₫`}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Lần đăng nhập cuối"
                  value={user.lastLogin ? dayjs(user.lastLogin).fromNow() : "Chưa có"}
                  prefix={<LoginOutlined />}
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

          <Card title="Lịch sử đăng nhập" size="small">
            <Table
              columns={loginColumns}
              dataSource={mockLoginHistory}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Space>
      ),
    },
    {
      key: "management",
      label: "Quản lý tài khoản",
      children: (
        <Card>
          <Title level={4}>Quản lý tài khoản</Title>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small" title="Thao tác tài khoản">
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={handleResetPassword}>
                  Reset mật khẩu
                </Button>
                <Button
                  icon={user.status === "active" ? <LockOutlined /> : <UnlockOutlined />}
                  type={user.status === "active" ? "default" : "primary"}
                  onClick={handleToggleStatus}
                >
                  {user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </Button>
                <Popconfirm
                  title="Xóa tài khoản"
                  description="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác."
                  onConfirm={handleDeleteAccount}
                  okText="Xóa"
                  cancelText="Hủy"
                  okType="danger"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa tài khoản
                  </Button>
                </Popconfirm>
              </Space>
            </Card>

            <Card size="small" title="Lịch sử thao tác">
              <Timeline
                items={[
                  {
                    children: "Tài khoản được tạo - 15/01/2024",
                    color: "green",
                  },
                  {
                    children: "Cập nhật thông tin liên hệ - 20/02/2024",
                    color: "blue",
                  },
                  {
                    children: "Reset mật khẩu - 10/03/2024",
                    color: "orange",
                  },
                ]}
              />
            </Card>
          </Space>
        </Card>
      ),
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <Avatar src={user.avatar} icon={<UserOutlined />} />
          <span>Chi tiết người dùng - {user.name}</span>
          <Tag color={user.status === "active" ? "green" : "red"}>
            {user.status === "active" ? "Hoạt động" : "Bị khóa"}
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="small" />
    </Modal>
  )
}
