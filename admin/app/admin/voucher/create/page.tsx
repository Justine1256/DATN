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
    Grid, // 👈 dùng để đọc breakpoint
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
    created_by?: number; // optional for admin
};

export default function VoucherCreateForm() {
    const [form] = Form.useForm<FormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const { token } = theme.useToken();

    // 👇 responsive: đọc breakpoint
    const screens = Grid.useBreakpoint();
    const controlSize: "large" | "middle" = screens.xs ? "middle" : "large";
    const cardPadding = screens.xs ? 16 : 24;

    // Cookie 'authToken' → 'token' → localStorage('token')
    const getAuthToken = (): string | null => {
        const t1 = Cookies.get("authToken");
        if (t1) return t1;
        const t2 = Cookies.get("token");
        if (t2) return t2;
        if (typeof window !== "undefined") return localStorage.getItem("token");
        return null;
    };

    const today = useMemo(() => dayjs().startOf("day"), []);
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

            // percent ≤ 35 (khớp BE)
            if (
                values.discount_type === "percent" &&
                Number(values.discount_value) > 35
            ) {
                message.error("Phần trăm giảm tối đa 35%.");
                return;
            }

            // Build payload (nullable fields chỉ gửi khi có)
            const payload: any = {
                code: values.code?.trim(),
                discount_value: Number(values.discount_value),
                discount_type: values.discount_type,
                start_date: start.format("YYYY-MM-DD"),
                end_date: end.format("YYYY-MM-DD"),
            };
            if (values.min_order_value !== undefined && values.min_order_value !== null)
                payload.min_order_value = Number(values.min_order_value);
            if (
                values.max_discount_value !== undefined &&
                values.max_discount_value !== null
            )
                payload.max_discount_value = Number(values.max_discount_value);
            if (values.usage_limit !== undefined && values.usage_limit !== null)
                payload.usage_limit = Number(values.usage_limit);
            if (values.created_by !== undefined && values.created_by !== null)
                payload.created_by = Number(values.created_by);

            // ADMIN endpoint (bỏ /shop)
            const res = await fetch(`${API_BASE_URL}/vouchers`, {
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

            setPopupMessage(data?.message || "Tạo voucher thành công");
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
        <div
            className="mx-auto"
            style={{
                maxWidth: screens.md ? 880 : 600,
                padding: screens.xs ? 12 : 16,
            }}
        >
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
                title={<div className="flex items-center gap-2">Tạo voucher (Admin)</div>}
                className="shadow-md"
                styles={{
                    header: { padding: "16px 20px", fontWeight: 600 },
                    body: { padding: cardPadding },
                }}
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
                        ]}
                    >
                        <Input placeholder="VD: SUMMER2025" allowClear maxLength={50} size={controlSize} />
                    </Form.Item>

                    {/* 3 cột trên desktop, 1 cột trên mobile */}
                    <div
                        className="grid gap-4"
                        style={{
                            gridTemplateColumns: screens.md ? "repeat(3, 1fr)" : "repeat(1, 1fr)",
                        }}
                    >
                        {/* DISCOUNT TYPE */}
                        <Form.Item
                            name="discount_type"
                            label="Loại giảm"
                            rules={[{ required: true, message: "Chọn loại giảm" }]}
                        >
                            <Select
                                size={controlSize}
                                options={[
                                    { value: "fixed", label: "Giảm số tiền cố định" },
                                    { value: "percent", label: "Giảm theo %" },
                                ]}
                            />
                        </Form.Item>

                        {/* DISCOUNT VALUE (≤35% nếu percent) */}
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
                                            size={controlSize}
                                            min={0}
                                            max={isPercent ? 35 : 100000000}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>

                        {/* USAGE LIMIT (nullable, ≥0) */}
                        <Form.Item
                            name="usage_limit"
                            label="Số lượt dùng tối đa"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve();
                                        const n = Number(value);
                                        if (!Number.isInteger(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số nguyên ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size={controlSize} min={0} className="w-full" />
                        </Form.Item>
                    </div>

                    <Divider style={{ margin: "8px 0 16px" }} />

                    {/* 2 cột trên desktop, 1 cột trên mobile */}
                    <div
                        className="grid gap-4"
                        style={{
                            gridTemplateColumns: screens.md ? "repeat(2, 1fr)" : "repeat(1, 1fr)",
                        }}
                    >
                        {/* MIN ORDER (nullable, ≥0) */}
                        <Form.Item
                            name="min_order_value"
                            label="Giá trị đơn tối thiểu (VND)"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve();
                                        const n = Number(value);
                                        if (Number.isNaN(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size={controlSize} min={0} className="w-full" />
                        </Form.Item>

                        {/* MAX DISCOUNT (nullable, ≥0) */}
                        <Form.Item
                            name="max_discount_value"
                            label="Giảm tối đa (VND)"
                            tooltip="Áp dụng cho cả loại fixed và percent"
                            rules={[
                                () => ({
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve();
                                        const n = Number(value);
                                        if (Number.isNaN(n) || n < 0) {
                                            return Promise.reject(new Error("Phải là số ≥ 0"));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size={controlSize} min={0} className="w-full" />
                        </Form.Item>
                    </div>

                    {/* CREATED BY (nullable, admin) */}
                    <Form.Item
                        name="created_by"
                        label="Người tạo (ID user)"
                        tooltip="Tùy chọn. Nếu không gửi, BE có thể tự gán theo user đang đăng nhập"
                        rules={[
                            () => ({
                                validator(_, value) {
                                    if (value == null || value === "") return Promise.resolve();
                                    const n = Number(value);
                                    if (!Number.isInteger(n) || n <= 0) {
                                        return Promise.reject(new Error("Phải là số nguyên dương"));
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <InputNumber size={controlSize} min={1} className="w-full" />
                    </Form.Item>

                    {/* DATE RANGE (bắt buộc, end >= start) */}
                    <Form.Item
                        name="date_range"
                        label="Thời gian áp dụng"
                        rules={[
                            { required: true, message: "Chọn khoảng thời gian" },
                            {
                                validator: (_, { 0: start, 1: end }: any) => {
                                    if (!start || !end) return Promise.resolve();
                                    if (end.isBefore(start, "day")) {
                                        return Promise.reject(new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu"));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <DatePicker.RangePicker
                            className="w-full"
                            size={controlSize}
                            format="YYYY-MM-DD"
                            disabledDate={disabledDate}
                            allowClear
                        />
                    </Form.Item>

                    {/* Actions */}
                    <div
                        className="flex items-center gap-3"
                        style={{ flexWrap: "wrap" }}
                    >
                        <Button type="primary" htmlType="submit" loading={submitting} size={controlSize}>
                            Tạo voucher
                        </Button>
                        <Button htmlType="button" onClick={() => form.resetFields()} disabled={submitting} size={controlSize}>
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
