"use client";
import React, { useMemo, useState } from "react";
import {
    Card,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Button,
    message,
    theme,
    Tooltip,
    Divider,
} from "antd";
import { CheckCircleFilled, InfoCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

dayjs.extend(customParseFormat);

type FormValues = {
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    date_range: [Dayjs, Dayjs];
    min_order_value?: number;
    max_discount_value?: number;
    usage_limit?: number;
};

export default function VoucherCreateForm() {
    const [form] = Form.useForm<FormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const { token } = theme.useToken();

    // Lấy token kiểu bạn muốn: cookie 'authToken' → 'token' → localStorage('token')
    const getAuthToken = (): string | null => {
        const t1 = Cookies.get("authToken");
        if (t1) return t1;
        const t2 = Cookies.get("token");
        if (t2) return t2;
        if (typeof window !== "undefined") return localStorage.getItem("token");
        return null;
    };

    const today = useMemo(() => dayjs().startOf("day"), []);
    // ✅ Fix kiểu TS: luôn trả boolean
    const disabledDate: (current: Dayjs) => boolean = (current) =>
        current.isBefore(today, "day");

    const onFinish = async (values: FormValues) => {
        try {
            setSubmitting(true);

            const tokenStr = getAuthToken();
            if (!tokenStr) {
                message.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                return;
            }

            const [start, end] = values.date_range || [];
            if (!start || !end) {
                message.error("Vui lòng chọn thời gian áp dụng voucher.");
                return;
            }

            // Khớp BE: percent ≤ 35
            if (values.discount_type === "percent" && Number(values.discount_value) > 35) {
                message.error("Phần trăm giảm tối đa 35%.");
                return;
            }

            // Build payload: chỉ gửi các trường nullable khi có giá trị
            const payload: any = {
                code: values.code?.trim(),
                discount_value: Number(values.discount_value),
                discount_type: values.discount_type,
                start_date: start.format("YYYY-MM-DD"),
                end_date: end.format("YYYY-MM-DD"),
            };
            if (values.min_order_value !== undefined && values.min_order_value !== null) {
                payload.min_order_value = Number(values.min_order_value);
            }
            if (values.max_discount_value !== undefined && values.max_discount_value !== null) {
                payload.max_discount_value = Number(values.max_discount_value);
            }
            if (values.usage_limit !== undefined && values.usage_limit !== null) {
                payload.usage_limit = Number(values.usage_limit);
            }

            // GIỮ NGUYÊN fetch API như bạn yêu cầu
            const res = await fetch(`${API_BASE_URL}/vouchers/shop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenStr}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Tạo voucher thất bại");
            }

            setPopupMessage(data?.message || "Tạo voucher shop thành công");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2600);

            form.resetFields();
        } catch (err: any) {
            message.error(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {showPopup && (
                <div
                    className="fixed top-6 right-6 text-white px-5 py-3 rounded-2xl shadow-lg z-50 flex items-center gap-2 animate-slide-in"
                    style={{ background: token.colorSuccess, boxShadow: token.boxShadowSecondary }}
                >
                    <CheckCircleFilled style={{ fontSize: 18, color: token.colorTextLightSolid }} />
                    <span className="text-sm font-medium" style={{ color: token.colorTextLightSolid }}>
                        {popupMessage}
                    </span>
                </div>
            )}

            <Card
                title={<div className="flex items-center gap-2">Tạo voucher cho shop</div>}
                className="shadow-md"
                headStyle={{ padding: "16px 20px", fontWeight: 600 }}
                bodyStyle={{ padding: 24 }}
                style={{
                    borderRadius: token.borderRadiusLG,
                    background: token.colorBgContainer,
                    boxShadow: token.boxShadowTertiary,
                }}
            >
                <Form<FormValues>
                    form={form}
                    layout="vertical"
                    initialValues={{ discount_type: "fixed" } as any}
                    onFinish={onFinish}
                    onFinishFailed={({ errorFields }) => {
                        if (errorFields?.length) message.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
                    }}
                    requiredMark
                >
                    {/* CODE */}
                    <Form.Item
                        name="code"
                        label={
                            <div className="flex items-center gap-1">
                                Mã voucher
                                <Tooltip title="Mã hiển thị cho khách khi áp dụng">
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </div>
                        }
                        rules={[
                            { required: true, message: "Vui lòng nhập mã voucher" },
                            { max: 50, message: "Tối đa 50 ký tự" },
                            // có thể thêm pattern nếu muốn chuẩn hóa: chỉ chữ/số/gạch
                            // { pattern: /^[A-Z0-9_-]+$/i, message: "Chỉ gồm chữ, số, -, _" },
                        ]}
                    >
                        <Input placeholder="VD: BACK2SCHOOL50K" allowClear maxLength={50} size="large" />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* DISCOUNT TYPE */}
                        <Form.Item
                            name="discount_type"
                            label="Loại giảm"
                            rules={[{ required: true, message: "Chọn loại giảm" }]}
                        >
                            <Select
                                size="large"
                                options={[
                                    { value: "fixed", label: "Giảm số tiền cố định" },
                                    { value: "percent", label: "Giảm theo %" },
                                ]}
                            />
                        </Form.Item>

                        {/* DISCOUNT VALUE (with percent ≤ 35) */}
                        <Form.Item shouldUpdate={(prev, cur) => prev.discount_type !== cur.discount_type} noStyle>
                            {({ getFieldValue }) => {
                                const isPercent = getFieldValue("discount_type") === "percent";
                                return (
                                    <Form.Item
                                        name="discount_value"
                                        label={isPercent ? "Mức giảm (%)" : "Mức giảm (VND)"}
                                        rules={[
                                            { required: true, message: "Nhập mức giảm" },
                                            () => ({
                                                validator(_, value) {
                                                    if (value == null || value === "") return Promise.resolve();
                                                    const n = Number(value);
                                                    if (Number.isNaN(n) || n < 0) {
                                                        return Promise.reject(new Error("Giá trị không hợp lệ"));
                                                    }
                                                    if (isPercent && n > 35) {
                                                        return Promise.reject(new Error("Phần trăm giảm tối đa 35%"));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                    >
                                        <InputNumber
                                            size="large"
                                            min={0}
                                            max={isPercent ? 35 : 100000000}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>

                        {/* USAGE LIMIT (nullable, ≥ 0) */}
                        <Form.Item
                            name="usage_limit"
                            label="Số lượt dùng tối đa"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve(); // nullable
                                        const n = Number(value);
                                        if (!Number.isInteger(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số nguyên ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size="large" min={0} className="w-full" />
                        </Form.Item>
                    </div>

                    <Divider style={{ margin: "8px 0 16px" }} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* MIN ORDER (nullable, ≥ 0) */}
                        <Form.Item
                            name="min_order_value"
                            label="Giá trị đơn tối thiểu (VND)"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve(); // nullable
                                        const n = Number(value);
                                        if (Number.isNaN(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size="large" min={0} className="w-full" />
                        </Form.Item>

                        {/* MAX DISCOUNT (nullable, ≥ 0) */}
                        <Form.Item
                            name="max_discount_value"
                            label="Giảm tối đa (VND)"
                            tooltip="Áp dụng cho cả loại fixed và percent"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve(); // nullable
                                        const n = Number(value);
                                        if (Number.isNaN(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size="large" min={0} className="w-full" />
                        </Form.Item>
                    </div>

                    {/* DATE RANGE (bắt buộc, end >= start) */}
                    <Form.Item
                        name="date_range"
                        label="Thời gian áp dụng"
                        rules={[
                            { required: true, message: "Chọn khoảng thời gian" },
                            {
                                validator: (_, value: [Dayjs, Dayjs]) => {
                                    if (!value || !value[0] || !value[1]) return Promise.resolve();
                                    if (value[1].isBefore(value[0], "day")) {
                                        return Promise.reject(new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu"));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <DatePicker.RangePicker
                            className="w-full"
                            size="large"
                            format="YYYY-MM-DD"
                            disabledDate={disabledDate}
                            allowClear
                        />
                    </Form.Item>

                    <div className="flex items-center gap-3">
                        <Button type="primary" htmlType="submit" loading={submitting} size="large">
                            Tạo voucher
                        </Button>
                        <Button htmlType="button" onClick={() => form.resetFields()} disabled={submitting} size="large">
                            Làm mới
                        </Button>
                    </div>
                </Form>
            </Card>

            <style jsx global>{`
        @keyframes slideIn {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.18s ease-out; }
      `}</style>
        </div>
    );
}
