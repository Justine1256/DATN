"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
    Card,
    Row,
    Col,
    Typography,
    Form as AntForm,
    Input,
    Button,
    Upload,
    Space,
    Spin,
    ConfigProvider,
} from "antd";
import {
    UploadOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    MailOutlined,
    PhoneOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

interface Shop {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    email: string;
    status: string;
}

export default function UpdateShop() {
    const [shop, setShop] = useState<Shop>({
        id: 0,
        name: "",
        description: "",
        logo: "",
        phone: "",
        email: "",
        status: "activated",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<"success" | "error">("success");
    const [showPopup, setShowPopup] = useState(false);
    const [imageArray, setImageArray] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = Cookies.get("authToken");
        if (!token) return;
        fetch(`${API_BASE_URL}/user`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (res) => {
                if (!res.ok) throw new Error("Không thể lấy thông tin cửa hàng.");
                const data = await res.json();
                const s: Shop = data.shop;
                setShop(s);
                if (s?.logo) setImagePreview(`${STATIC_BASE_URL}/${s.logo}`);
                setLoading(false);
            })
            .catch(() => {
                setError("Không thể lấy thông tin cửa hàng.");
                setLoading(false);
            });
    }, []);

    // popup tiện ích
    const showSlide = (msg: string, type: "success" | "error") => {
        setPopupMessage(msg);
        setPopupType(type);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    const onFinish = async () => {
        if (!shop.email.includes("@")) {
            showSlide("Email không hợp lệ.", "error");
            return;
        }
        const token = Cookies.get("authToken");
        if (!token) {
            showSlide("Bạn chưa đăng nhập.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/shop/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(shop),
            });
            const data = await res.json();
            if (res.ok) {
                showSlide("Cập nhật cửa hàng thành công!", "success");
            } else {
                showSlide(`Lỗi: ${data.message ?? "Không xác định"}`, "error");
            }
        } catch (e) {
            showSlide("Có lỗi xảy ra khi gửi yêu cầu.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const beforeUpload = () => false; // không upload auto
    const onUploadChange: any = (info: any) => {
        const raw: File = (info.file.originFileObj || info.file) as File;
        if (!raw) return;
        const url = URL.createObjectURL(raw);
        setImageArray([url]);
        setImagePreview(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Space direction="vertical" align="center">
                    <Spin />
                    <Typography.Text type="secondary">Đang tải thông tin cửa hàng...</Typography.Text>
                </Space>
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: { colorPrimary: "#db4444" },
                components: {
                    Button: {
                        colorPrimary: "#db4444",
                        colorPrimaryHover: "#c73e3e",
                        colorPrimaryActive: "#b83838",
                    },
                },
            }}
        >
            <div className="min-h-screen py-6 px-4">
                {/* Popup trượt ngang dưới header */}
                {showPopup && (
                    <div className="fixed right-6 z-50" style={{ top: "64px" }}>
                        <div
                            className={`px-6 py-4 rounded-xl shadow-lg text-white slide-in ${popupType === "success" ? "bg-green-500" : "bg-red-500"
                                }`}
                        >
                            <Space align="center">
                                <span className="font-medium">{popupMessage}</span>
                            </Space>
                        </div>
                    </div>
                )}
                <style jsx global>{`
          @keyframes slideInRight {
            from {
              transform: translateX(120%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .slide-in {
            animation: slideInRight 0.35s ease-out;
          }
        `}</style>

                <div className="max-w-3xl mx-auto">
                    <Space direction="vertical" size={16} className="w-full">
                        <Card>
                            <Space direction="vertical" size={4} className="w-full items-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500 mb-1">
                                    <ShopOutlined style={{ color: "#fff" }} />
                                </div>
                                <Typography.Title level={3} className="!mb-0">
                                    Cập nhật cửa hàng
                                </Typography.Title>
                                <Typography.Text type="secondary">Quản lý thông tin cửa hàng của bạn</Typography.Text>
                            </Space>
                        </Card>

                        <Card title="Logo cửa hàng">
                            <Space align="center" direction="vertical" className="w-full">
                                <div className="relative" style={{ width: 96, height: 96 }}>
                                    <img
                                        src={imagePreview || "/placeholder.svg"}
                                        alt="Logo cửa hàng"
                                        className="rounded-full object-cover border"
                                        style={{ width: 96, height: 96 }}
                                    />
                                </div>
                                <Upload
                                    beforeUpload={beforeUpload as any}
                                    onChange={onUploadChange}
                                    maxCount={1}
                                    accept="image/*"
                                    showUploadList={false}
                                >
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Chọn logo
                                    </Button>
                                </Upload>
                            </Space>
                        </Card>

                        <Card>
                            <AntForm layout="vertical" onFinish={onFinish} initialValues={shop}>
                                <Row gutter={[16, 8]}>
                                    <Col span={24}>
                                        <AntForm.Item
                                            label={
                                                <>
                                                    Tên cửa hàng
                                                </>
                                            }
                                            required
                                            rules={[{ required: true, message: "Nhập tên cửa hàng" }]}
                                        >
                                            <Input
                                                name="name"
                                                value={shop.name}
                                                onChange={(e) => setShop((s) => ({ ...s, name: e.target.value }))}
                                                placeholder="Nhập tên cửa hàng của bạn"
                                                prefix={<ShopOutlined />}
                                            />
                                        </AntForm.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <AntForm.Item label="Số điện thoại" required rules={[{ required: true, message: "Nhập số điện thoại" }]}>
                                            <Input
                                                name="phone"
                                                value={shop.phone}
                                                onChange={(e) => setShop((s) => ({ ...s, phone: e.target.value }))}
                                                placeholder="Nhập số điện thoại"
                                                prefix={<PhoneOutlined />}
                                            />
                                        </AntForm.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <AntForm.Item label="Email" required rules={[{ required: true, message: "Nhập email" }]}>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={shop.email}
                                                onChange={(e) => setShop((s) => ({ ...s, email: e.target.value }))}
                                                placeholder="Nhập địa chỉ email"
                                                prefix={<MailOutlined />}
                                            />
                                        </AntForm.Item>
                                    </Col>

                                    <Col span={24}>
                                        <AntForm.Item
                                            label={
                                                <>
                                                    <FileTextOutlined style={{ marginRight: 6 }} />
                                                    Mô tả cửa hàng
                                                </>
                                            }
                                            required
                                            rules={[{ required: true, message: "Nhập mô tả" }]}
                                        >
                                            <Input.TextArea
                                                name="description"
                                                value={shop.description}
                                                onChange={(e) => setShop((s) => ({ ...s, description: e.target.value }))}
                                                rows={4}
                                                placeholder="Mô tả về cửa hàng của bạn..."
                                            // ⛔️ KHÔNG dùng prefix ở TextArea
                                            />
                                        </AntForm.Item>
                                    </Col>

                                    <Col span={24}>
                                        <AntForm.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={isSubmitting}
                                                icon={<CheckCircleOutlined />}
                                                block
                                            >
                                                Cập nhật cửa hàng
                                            </Button>
                                        </AntForm.Item>
                                    </Col>
                                </Row>
                            </AntForm>
                        </Card>

                        {error && <Typography.Text type="danger">{error}</Typography.Text>}
                    </Space>
                </div>
            </div>
        </ConfigProvider>
    );
}
