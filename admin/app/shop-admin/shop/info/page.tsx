"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Cookies from "js-cookie"
import { API_BASE_URL } from "@/utils/api"

// Ant Design
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Row,
    Skeleton,
    Space,
    Statistic,
    Typography,
} from "antd"

// Ant Design Icons
import {
    PhoneOutlined,
    ShoppingOutlined,
    StarFilled,
    CalendarOutlined,
    UsergroupAddOutlined,
    MailOutlined,
    EnvironmentOutlined,
    TrophyOutlined,
    RiseOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

// Helper function để định dạng thời gian
const formatTimeAgo = (dateString: string): string => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} ngày trước`
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} năm trước`
}

// Định nghĩa kiểu dữ liệu của Shop
interface Shop {
    id: number
    name: string
    description: string
    logo: string
    phone: string
    rating: string
    total_sales: number
    created_at: string
    status: "activated" | "pending" | "suspended"
    email: string
    followers_count: number
}

const statusMeta: Record<
    Shop["status"],
    { label: string; color: "green" | "yellow" | "red" }
> = {
    activated: { label: "✓ Đã kích hoạt", color: "green" },
    pending: { label: "⏳ Chưa kích hoạt", color: "yellow" },
    suspended: { label: "⛔ Tạm khóa", color: "red" },
}

// Bảng màu cho từng thẻ (nền + màu icon)
const tone = [
    { bg: "#e6f7ff", icon: "#1890ff" }, // Điện thoại
    { bg: "#f6ffed", icon: "#52c41a" }, // Đã bán
    { bg: "#fffbe6", icon: "#faad14" }, // Đánh giá
    { bg: "#fff0f6", icon: "#eb2f96" }, // Tham gia
    { bg: "#f9f0ff", icon: "#722ed1" }, // Người theo dõi
    { bg: "#f0f5ff", icon: "#2f54eb" }, // Email
]

// Thiết lập chiều cao thống nhất cho tất cả thẻ
const CARD_MIN_HEIGHT = 120

const ShopCard = () => {
    const [shop, setShop] = useState<Shop | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                const token = Cookies.get("authToken")
                if (!token) {
                    setError("Vui lòng đăng nhập để lấy thông tin cửa hàng")
                    return
                }
                const response = await fetch(`${API_BASE_URL}/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                })
                if (!response.ok) {
                    setError("Không thể lấy thông tin cửa hàng.")
                    return
                }
                const data = await response.json()
                setShop(data.shop)
            } catch {
                setError("Có lỗi xảy ra khi tải dữ liệu cửa hàng.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchShopData()
    }, [])

    if (error) {
        return <Alert type="error" message={error} showIcon />
    }

    if (isLoading || !shop) {
        return (
            <Card bordered={false} style={{ borderRadius: 16 }}>
                <Skeleton.Image style={{ width: "100%", height: 192, borderRadius: 12 }} active />
                <div style={{ marginTop: 24 }}>
                    <Space size={16} align="start">
                        <Skeleton.Avatar active size={96} shape="circle" />
                        <div style={{ width: "100%" }}>
                            <Skeleton.Input active style={{ width: 260, height: 32, marginBottom: 12 }} />
                            <Skeleton.Input active style={{ width: 180 }} />
                        </div>
                    </Space>

                    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Col xs={24} sm={12} lg={8} key={i}>
                                <Card hoverable style={{ borderRadius: 12 }}>
                                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </Card>
        )
    }

    const { color, label } = statusMeta[shop.status]

    return (
        <Badge.Ribbon text={label} color={color} placement="start">
            <Card
                bordered={false}
                style={{ borderRadius: 16, overflow: "hidden" }}
                bodyStyle={{ padding: 24 }}
                cover={
                    <div style={{ position: "relative", height: 192 }}>
                        <Image
                            src="/shop_cover.jpg"
                            alt="Shop Cover"
                            fill
                            priority
                            style={{ objectFit: "cover" }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                    "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.00) 40%)",
                            }}
                        />
                    </div>
                }
            >
                {/* Header */}
                <Space size={16} align="start" style={{ width: "100%", marginBottom: 16 }}>
                    <div style={{ position: "relative" }}>
                        <Avatar
                            src={`${API_BASE_URL}/image/${shop.logo}`}
                            alt="Shop Logo"
                            size={96}
                            style={{
                                border: "4px solid #fff",
                                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                right: -6,
                                bottom: -6,
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "#db4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(219,68,68,0.4)",
                            }}
                            aria-label="Verified shop"
                            title="Verified shop"
                        >
                            <TrophyOutlined style={{ color: "#fff", fontSize: 16 }} />
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={3} style={{ marginBottom: 8 }}>
                            {shop.name}
                        </Title>
                        <Paragraph type="secondary" ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}>
                            {shop.description}
                        </Paragraph>
                    </div>
                </Space>

                {/* Stats */}
                <Row gutter={[16, 16]}>
                    {/* Phone */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[0].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Space size={12} align="center">
                                <PhoneOutlined style={{ fontSize: 22, color: tone[0].icon }} />
                                <div>
                                    <Text type="secondary">Điện thoại</Text>
                                    <div>
                                        <Text strong>{shop.phone || "—"}</Text>
                                    </div>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Total Sales */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[1].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Statistic
                                title="Đã bán"
                                value={shop.total_sales || 0}
                                prefix={<ShoppingOutlined style={{ color: tone[1].icon }} />}
                                groupSeparator=","
                                suffix=" sản phẩm"
                                valueStyle={{ fontSize: 20 }}
                            />
                        </Card>
                    </Col>

                    {/* Rating */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[2].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Space size={12} align="center">
                                <StarFilled style={{ color: tone[2].icon }} />
                                <div>
                                    <Text type="secondary">Đánh giá</Text>
                                    <div>
                                        <Text strong>
                                            {shop.rating == null || shop.rating === "0.0" ? "Chưa có" : `${shop.rating} ⭐`}
                                        </Text>
                                    </div>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Join Date */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[3].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Space size={12} align="center">
                                <CalendarOutlined style={{ color: tone[3].icon }} />
                                <div>
                                    <Text type="secondary">Tham gia</Text>
                                    <div>
                                        <Text strong>{formatTimeAgo(shop.created_at)}</Text>
                                    </div>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Followers */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[4].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Statistic
                                title="Người theo dõi"
                                value={shop.followers_count || 0}
                                prefix={<UsergroupAddOutlined style={{ color: tone[4].icon }} />}
                                groupSeparator=","
                                suffix=" người"
                                valueStyle={{ fontSize: 20 }}
                            />
                        </Card>
                    </Col>

                    {/* Email */}
                    <Col xs={24} sm={12} lg={8}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                background: tone[5].bg,
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                            bodyStyle={{ display: "flex", alignItems: "center" }}
                        >
                            <Space size={12} align="start">
                                <MailOutlined style={{ color: tone[5].icon }} />
                                <div style={{ minWidth: 0, maxWidth: "100%" }}>
                                    <Text type="secondary">Email</Text>
                                    <div>
                                        <Text strong ellipsis={{ tooltip: shop.email }}>
                                            {shop.email}
                                        </Text>
                                    </div>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Divider />

                {/* Actions */}
                <Space size={12} wrap>
                    <Button
                        type="primary"
                        icon={<RiseOutlined />}
                        href="/shop-admin/dashboard"
                        style={{
                            backgroundColor: "#db4444",
                            borderColor: "#db4444",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "#c63c3c"
                                ; (e.currentTarget as HTMLElement).style.borderColor = "#c63c3c"
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "#db4444"
                                ; (e.currentTarget as HTMLElement).style.borderColor = "#db4444"
                        }}
                    >
                        Xem thống kê
                    </Button>

                    <Button icon={<EnvironmentOutlined />} href="/shop-admin/shop/update">
                        Cập nhật thông tin
                    </Button>
                </Space>
            </Card>
        </Badge.Ribbon>
    )
}

export default ShopCard
