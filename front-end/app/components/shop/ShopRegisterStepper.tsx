"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

// Ant Design
import {
    Card,
    ConfigProvider,
    Steps,
    Row,
    Col,
    Input,
    Button,
    Typography,
    Avatar,
    Space,
    Divider,
} from "antd";
import {
    InboxOutlined,
    LoadingOutlined,
    CheckCircleTwoTone,
    LeftOutlined,
    RedoOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Types
type PopupType = "success" | "error";

interface FormData {
    name: string;
    description: string;
    phone: string;
    email: string;
}

export default function ShopRegisterPage() {
    // State management (giữ nguyên)
    const [step, setStep] = useState<number>(0);
    const [form, setForm] = useState<FormData>({
        name: "",
        description: "",
        phone: "",
        email: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [popupType, setPopupType] = useState<PopupType>("error");
    const [cooldown, setCooldown] = useState(60);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState<null | { type: "success" | "error"; message: string }>(null);

    // Constants (giữ nguyên)
    const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const PHONE_REGEX = /^(0\d{9})$/;
    const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

    // Utility functions (giữ nguyên)
    const showPopup = (msg: string, type: PopupType = "error") => {
        setPopupType(type);
        setPopup({ type, message: msg });
        setTimeout(() => setPopup(null), 3000);
    };

    const getErrorMessage = (err: any): string => {
        if (err.message === "Failed to fetch") {
            return "Kích thước ảnh vượt quá giới hạn cho phép.<br/>Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB.";
        }
        if (err.status === 413) {
            return "Kích thước ảnh vượt quá giới hạn cho phép.<br/>Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB.";
        }
        if (err.errors) {
            const errorMessages = Object.values(err.errors).flat();
            return Array.isArray(errorMessages) ? errorMessages.join(", ") : String(errorMessages);
        }
        if (err.error) {
            return typeof err.error === "string" ? err.error : err.error.message || "Đã có lỗi xảy ra";
        }
        return err.message || "Đã có lỗi xảy ra";
    };

    const validateForm = (): string[] => {
        const errors: string[] = [];
        if (!form.name.trim()) errors.push("Tên shop không được để trống.");
        if (!form.description.trim()) errors.push("Mô tả shop không được để trống.");
        if (!PHONE_REGEX.test(form.phone)) errors.push("Số điện thoại không hợp lệ.");
        if (!EMAIL_REGEX.test(form.email)) errors.push("Email không hợp lệ.");
        if (!file) errors.push("Vui lòng chọn logo.");
        return errors;
    };

    const startCooldown = () => {
        let cd = 60;
        const timer = setInterval(() => {
            cd -= 1;
            setCooldown(cd);
            if (cd <= 0) clearInterval(timer);
        }, 1000);
    };

    // Event handlers (giữ nguyên logic)
    const handleSendOtp = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            return showPopup(errors.join(" "));
        }
        try {
            setLoading(true);
            const token = Cookies.get("authToken");

            const data = new FormData();
            data.append("name", form.name);
            data.append("description", form.description);
            data.append("phone", form.phone);
            data.append("email", form.email);
            data.append("image", file as Blob);

            const res = await fetch(`${API_BASE_URL}/shopregister`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: data,
            });

            const json = await res.json();
            if (!res.ok) {
                const error = { ...json, status: res.status };
                throw error;
            }

            showPopup("Đã gửi OTP tới email của bạn.", "success");
            setStep(1);
            setCooldown(60);
            startCooldown();
        } catch (err: any) {
            showPopup(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOtp = async () => {
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/shopotp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ otp }),
            });

            const json = await res.json();
            if (!res.ok) {
                const error = { ...json, status: res.status };
                throw error;
            }

            showPopup("Tạo shop thành công!", "success");
            setTimeout(() => (window.location.href = `/shop/${json.shop.slug}`), 1000);
        } catch (err: any) {
            showPopup(getErrorMessage(err));
        }
    };

    const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
            showPopup("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc GIF");
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    // ---- UI builders (đổi sang antd, giữ logic) --------------------
    const renderFileInput = () => (
        <div style={{ textAlign: "center" }}>
            <div
                onClick={() => document.getElementById("fileInput")?.click()}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 132,
                    height: 132,
                    borderRadius: "50%",
                    border: "2px dashed #d9d9d9",
                    background: "#fafafa",
                    cursor: "pointer",
                    transition: "all .2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#db4444";
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#fff";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#d9d9d9";
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#fafafa";
                }}
            >
                {preview ? (
                    <Avatar
                        src={preview}
                        size={120}
                        style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                ) : (
                    <Space direction="vertical" align="center" size={4}>
                        <InboxOutlined style={{ fontSize: 22, color: "#999" }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Chọn logo
                        </Text>
                    </Space>
                )}
            </div>
            <input id="fileInput" type="file" accept="image/*" onChange={handleChooseFile} hidden />
            <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
                JPG, PNG hoặc GIF • Tối đa 2MB
            </Text>
        </div>
    );

    const renderStepOne = () => (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {renderFileInput()}

            <Row gutter={12}>
                <Col span={24}>
                    <Text style={{ fontWeight: 500 }}>Tên shop</Text>
                    <Input
                        size="large"
                        placeholder="Nhập tên shop"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        allowClear
                    />
                </Col>
            </Row>

            <Row gutter={12}>
                <Col span={24}>
                    <Text style={{ fontWeight: 500 }}>Mô tả shop</Text>
                    <Input.TextArea
                        rows={3}
                        placeholder="Mô tả ngắn về shop"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        allowClear
                        maxLength={500}
                        showCount
                    />
                </Col>
            </Row>

            <Row gutter={12}>
                <Col xs={24} md={12}>
                    <Text style={{ fontWeight: 500 }}>Số điện thoại</Text>
                    <Input
                        size="large"
                        placeholder="0xxxxxxxxx"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        allowClear
                    />
                </Col>
                <Col xs={24} md={12}>
                    <Text style={{ fontWeight: 500 }}>Email</Text>
                    <Input
                        size="large"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        allowClear
                    />
                </Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                <Button
                    type="primary"
                    size="large"
                    onClick={handleSendOtp}
                    loading={loading}
                    icon={loading ? <LoadingOutlined /> : <CheckCircleTwoTone twoToneColor="#ffffff" />}
                    style={{ backgroundColor: "#db4444", borderColor: "#db4444", minWidth: 140 }}
                >
                    {loading ? "Đang gửi..." : "Đăng ký"}
                </Button>
            </div>
        </Space>
    );

    const renderStepTwo = () => (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div>
                <Text style={{ fontWeight: 500 }}>Mã OTP</Text>
                <Input
                    size="large"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    suffix={
                        <Button
                            type="link"
                            onClick={() => {
                                handleSendOtp();
                                startCooldown();
                            }}
                            disabled={cooldown > 0}
                            icon={<RedoOutlined />}
                            style={{ paddingRight: 0 }}
                        >
                            {cooldown > 0 ? `Gửi lại (${cooldown}s)` : "Gửi lại"}
                        </Button>
                    }
                />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 8 }}>
                <Button icon={<LeftOutlined />} onClick={() => setStep(0)}>
                    Quay lại
                </Button>
                <Button
                    type="primary"
                    onClick={handleConfirmOtp}
                    style={{ backgroundColor: "#db4444", borderColor: "#db4444", minWidth: 140 }}
                >
                    Xác nhận OTP
                </Button>
            </div>
        </Space>
    );

    const renderPopup = () =>
        popup && (
            <div
                className={`fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade transition-colors ${popup.type === "success" ? "border-green-500" : "border-[#db4444]"
                    }`}
            >
                <div dangerouslySetInnerHTML={{ __html: popup.message }} />
            </div>
        );

    return (
        <ConfigProvider
            theme={{
                token: { colorPrimary: "#db4444", borderRadius: 12 },
                components: { Button: { controlHeight: 40 } },
            }}
        >
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card
                    className="w-full max-w-2xl"
                    styles={{ body: { padding: 24 } }}
                    title={
                        <div style={{ textAlign: "center" }}>
                            <Title level={3} style={{ marginBottom: 4 }}>
                                Đăng ký Shop
                            </Title>
                            <Text type="secondary">Hoàn thành 2 bước để đăng ký shop của bạn</Text>
                        </div>
                    }
                >
                    <Steps
                        current={step}
                        items={[{ title: "Thông tin & Logo" }, { title: "Nhập OTP" }]}
                        style={{ marginBottom: 24 }}
                    />

                    {step === 0 ? renderStepOne() : renderStepTwo()}

                    <Divider style={{ marginTop: 24, marginBottom: 0 }} />
                </Card>
            </div>

            {renderPopup()}

            <style jsx global>{`
        @keyframes slideInFade {
          0% {
            opacity: 0;
            transform: translateX(50%);
          }
          50% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInFade {
          animation: slideInFade 0.5s ease forwards;
        }
      `}</style>
        </ConfigProvider>
    );
}

// ShopStepper đã thay bằng antd <Steps />, nhưng nếu bạn muốn giữ component cũ thì vẫn có thể để lại.
// (Không cần thiết nữa nên mình bỏ để UI gọn gàng hơn)
