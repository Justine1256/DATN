"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Flex,
  Grid,
  Result,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  InfoCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  HomeOutlined,
  ShoppingOutlined,
  FileSearchOutlined,
  SafetyCertificateTwoTone,
  WarningTwoTone,
} from "@ant-design/icons";

// Nếu bạn có utils, giữ lại dòng này:
import { API_BASE_URL } from "@/utils/api";
// Nếu không có, bỏ dòng trên và dùng fallback dưới:
const API_BASE_FALLBACK = ""; // "" => relative

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type VerifyResp = {
  verified: boolean;
  success: boolean;
  vnp_ResponseCode?: string;
  order_id?: string;
};

const RESPONSE_MESSAGES: Record<string, string> = {
  "00": "Giao dịch thành công",
  "07": "Giao dịch bị nghi ngờ gian lận (liên hệ ngân hàng)",
  "09": "Khách hàng nhập sai OTP quá số lần quy định",
  "10": "Khách hàng xác thực thẻ/ tài khoản thất bại",
  "11": "Đã hết hạn mức thanh toán (liên hệ ngân hàng)",
  "12": "Thẻ/ tài khoản bị khóa/ chưa kích hoạt",
  "13": "Sai mật khẩu thanh toán",
  "24": "Khách hàng hủy giao dịch",
  "51": "Tài khoản không đủ số dư",
  "65": "Vượt quá hạn mức giao dịch",
  "75": "Ngân hàng tạm thời không hỗ trợ",
  "79": "KH nhập sai thông tin thẻ quá số lần cho phép",
  "91": "Ngân hàng phát hành thẻ không phản hồi",
  "94": "Giao dịch trùng lặp",
  "97": "Chữ ký không hợp lệ (Invalid Checksum)",
  "99": "Lỗi không xác định/khác",
};

function formatVND(n?: number | string | null) {
  if (n == null) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("vi-VN").format(num) + "₫";
}

function parseVnpDate(s?: string | null) {
  // Format VNPay: yyyyMMddHHmmss (VD: 20250820103853)
  if (!s || s.length !== 14) return null;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  const hh = Number(s.slice(8, 10));
  const mm = Number(s.slice(10, 12));
  const ss = Number(s.slice(12, 14));
  const dt = new Date(y, m, d, hh, mm, ss);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => message.success("Đã sao chép"),
    () => message.error("Không thể sao chép")
  );
}

export default function VnpReturnPage() {
  const p = useSearchParams();
  const router = useRouter();
  const screens = useBreakpoint();

  // Lấy toàn bộ tham số vnp_*
  const vnp = useMemo(() => {
    const obj: Record<string, string> = {};
    p.forEach((v, k) => {
      if (k.toLowerCase().startsWith("vnp_")) obj[k] = v;
    });
    return obj;
  }, [p]);

  const code = p.get("vnp_ResponseCode") || "";
  const order = p.get("vnp_TxnRef") || "";
  const hash = p.get("vnp_SecureHash") || "";
  const rawAmount = p.get("vnp_Amount"); // VNPay: *100
  const amount = rawAmount ? Math.round(Number(rawAmount) / 100) : undefined;
  const payDate = parseVnpDate(p.get("vnp_PayDate"));
  const bankCode = p.get("vnp_BankCode");
  const cardType = p.get("vnp_CardType");
  const tmn = p.get("vnp_TmnCode");
  const txnNo = p.get("vnp_TransactionNo");
  const orderInfo = p.get("vnp_OrderInfo");
  const locale = p.get("vnp_Locale") || "vn";

  const success = code === "00";
  const [verifying, setVerifying] = useState(false);
  const [verify, setVerify] = useState<VerifyResp | null>(null);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);

  const combinedOrderIds = useMemo(() => {
    // Nếu bạn gộp nhiều đơn kiểu ORD_1_2_3 khi tạo TxnRef
    // thì ở đây tách để hiển thị list đơn hàng.
    if (!order) return [];
    const m = order.match(/ORD[_-](.+)$/i);
    if (m && m[1]) {
      return m[1].split(/[_-]/).filter(Boolean);
    }
    // Nếu TxnRef là mã 1 đơn: trả về mảng 1 phần tử
    return [order];
  }, [order]);

  useEffect(() => {
    // Tự động verify với BE (PaymentController@return)
    // Ưu tiên API_BASE_URL nếu có, fallback relative
    const base = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : API_BASE_FALLBACK;
    const qs = new URLSearchParams();
    p.forEach((v, k) => qs.append(k, v)); // đẩy nguyên tham số từ VNPay

    setVerifying(true);
    setVerifyErr(null);
    fetch(`${base}/api/vnpay/return?${qs.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then(async (r) => {
        const data = (await r.json()) as VerifyResp;
        if (!r.ok) throw new Error(data?.vnp_ResponseCode || "VERIFY_FAILED");
        setVerify(data);
      })
      .catch((e: any) => {
        setVerifyErr(e?.message || "VERIFY_FAILED");
      })
      .finally(() => setVerifying(false));
  }, [p]);

  const title = success ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất";
  const subTitle =
    RESPONSE_MESSAGES[code] ||
    (success ? "Giao dịch đã được VNPay chấp nhận" : "Vui lòng thử lại hoặc chọn phương thức khác");

  const verified = verify?.verified ?? false;

  return (
    <div style={{ padding: screens.md ? 32 : 16, maxWidth: 980, margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Result
          status={success ? "success" : "warning"}
          title={
            <Flex align="center" gap={8} wrap>
              <span>{title}</span>
              {verified ? (
                <Tag icon={<SafetyCertificateTwoTone twoToneColor="#52c41a" />} color="success">
                  Chữ ký hợp lệ
                </Tag>
              ) : (
                <Tag icon={<WarningTwoTone twoToneColor="#faad14" />} color="warning">
                  Chưa xác minh
                </Tag>
              )}
            </Flex>
          }
          subTitle={
            <Flex vertical gap={8}>
              <Text>{subTitle}</Text>
              <Flex gap={8} wrap align="center">
                <Button
                  type="primary"
                  icon={<ShoppingOutlined />}
                  onClick={() => router.push("/orders")}
                >
                  Xem đơn hàng của tôi
                </Button>
                <Button icon={<HomeOutlined />} onClick={() => router.push("/")}>
                  Về trang chủ
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={verifying}
                  onClick={() => {
                    // kích hoạt verify lại
                    const base =
                      typeof API_BASE_URL !== "undefined" ? API_BASE_URL : API_BASE_FALLBACK;
                    const qs = new URLSearchParams();
                    p.forEach((v, k) => qs.append(k, v));
                    setVerifying(true);
                    setVerifyErr(null);
                    fetch(`${base}/api/vnpay/return?${qs.toString()}`, {
                      method: "GET",
                      headers: { Accept: "application/json" },
                      credentials: "include",
                    })
                      .then(async (r) => {
                        const data = (await r.json()) as VerifyResp;
                        if (!r.ok) throw new Error(data?.vnp_ResponseCode || "VERIFY_FAILED");
                        setVerify(data);
                        message.success("Đã xác minh lại với máy chủ");
                      })
                      .catch(() => {
                        setVerifyErr("Không thể xác minh lại");
                        message.error("Không thể xác minh lại");
                      })
                      .finally(() => setVerifying(false));
                  }}
                >
                  Xác minh với máy chủ
                </Button>
              </Flex>
            </Flex>
          }
        />

        {/* Tóm tắt nhanh */}
        <Card>
          <Flex gap={screens.md ? 48 : 16} wrap>
            <Statistic title="Số tiền" value={formatVND(amount)} />
            <Statistic
              title="Mã phản hồi"
              valueRender={() => (
                <Flex align="center" gap={8}>
                  <Tag color={success ? "green" : "orange"}>{code || "—"}</Tag>
                  <Tooltip title="Ý nghĩa mã phản hồi">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Flex>
              )}
            />
            <Statistic
              title="Thời gian thanh toán"
              value={
                payDate
                  ? new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    }).format(payDate)
                  : "—"
              }
            />
            <Statistic
              title="Trạng thái chữ ký"
              valueRender={() =>
                verified ? (
                  <Flex align="center" gap={6}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                    <Text strong>Hợp lệ</Text>
                  </Flex>
                ) : (
                  <Flex align="center" gap={6}>
                    <CloseCircleTwoTone twoToneColor="#faad14" />
                    <Text strong>Chưa xác minh</Text>
                  </Flex>
                )
              }
            />
          </Flex>
        </Card>

        {/* Chi tiết giao dịch */}
        <Card title="Chi tiết giao dịch">
          <Descriptions
            bordered
            column={screens.lg ? 3 : screens.md ? 2 : 1}
            labelStyle={{ width: 220 }}
          >
            <Descriptions.Item label="TxnRef (Mã giao dịch)">
              <Flex align="center" gap={8} wrap>
                <Text code>{order || "—"}</Text>
                {order && (
                  <Tooltip title="Sao chép">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(order)}
                    />
                  </Tooltip>
                )}
              </Flex>
            </Descriptions.Item>

            <Descriptions.Item label="Order Info">
              {orderInfo || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="VNPay Transaction No">
              {txnNo || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Cổng/Ngân hàng">
              {bankCode || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Loại thẻ/tài khoản">
              {cardType || (bankCode ? "Nội địa" : "—")}
            </Descriptions.Item>

            <Descriptions.Item label="Mã website (TmnCode)">
              {tmn || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="VNP Locale">{locale}</Descriptions.Item>

            <Descriptions.Item label="Secure Hash">
              <Flex vertical gap={6}>
                <div style={{ wordBreak: "break-all" }}>{hash || "—"}</div>
                {hash && (
                  <Flex gap={8}>
                    <Tooltip title="Sao chép chữ ký">
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copy(hash)}
                      />
                    </Tooltip>
                    <Tag color={verified ? "green" : "orange"}>
                      {verified ? "Hợp lệ" : "Chưa xác minh"}
                    </Tag>
                  </Flex>
                )}
              </Flex>
            </Descriptions.Item>
          </Descriptions>

          {/* Danh sách đơn hàng (nếu gộp ORD_1_2_3) */}
          <Divider />
          <Title level={5} style={{ marginBottom: 12 }}>
            Đơn hàng liên quan
          </Title>
          {combinedOrderIds.length ? (
            <Flex gap={8} wrap>
              {combinedOrderIds.map((id) => (
                <Tag key={id} color="blue" icon={<FileSearchOutlined />}>
                  #{id}
                </Tag>
              ))}
            </Flex>
          ) : (
            <Text type="secondary">Không xác định được mã đơn hàng.</Text>
          )}
        </Card>

        {/* Kết quả xác minh với máy chủ */}
        <Card title="Kết quả xác minh với máy chủ">
          {verifying && (
            <Alert
              message="Đang xác minh chữ ký với máy chủ…"
              type="info"
              showIcon
            />
          )}
          {!verifying && verify && (
            <Alert
              type={verify.verified ? "success" : "error"}
              showIcon
              message={
                verify.verified
                  ? "Chữ ký hợp lệ (checksum đúng)"
                  : "Chữ ký KHÔNG hợp lệ (checksum sai)"
              }
              description={
                <Space direction="vertical" size={4}>
                  <div>
                    <Text strong>verified:</Text> {String(verify.verified)}
                  </div>
                  <div>
                    <Text strong>success:</Text> {String(verify.success)}
                  </div>
                  <div>
                    <Text strong>vnp_ResponseCode (server):</Text>{" "}
                    {verify.vnp_ResponseCode ?? "—"}{" "}
                    <Tag color={verify.success ? "green" : "orange"}>
                      {verify.success ? "Thành công" : "Chưa hoàn tất"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>order_id (server):</Text> {verify.order_id ?? "—"}
                  </div>
                </Space>
              }
            />
          )}
          {!verifying && verifyErr && (
            <Alert
              type="warning"
              showIcon
              message="Không thể xác minh với máy chủ"
              description={verifyErr}
            />
          )}
        </Card>

        {/* Toàn bộ tham số trả về từ VNPay */}
        <Collapse
          items={[
            {
              key: "params",
              label: "Xem toàn bộ tham số VNPay trả về",
              children: (
                <Card size="small" bordered={false} style={{ background: "#fafafa" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {Object.keys(vnp).length ? (
                      Object.keys(vnp)
                        .sort()
                        .map((k) => (
                          <Flex
                            key={k}
                            align="start"
                            justify="space-between"
                            gap={12}
                            wrap
                            style={{ padding: "8px 0", borderBottom: "1px dashed #eee" }}
                          >
                            <Text strong style={{ minWidth: 200 }}>
                              {k}
                            </Text>
                            <Flex align="center" gap={8} style={{ flex: 1 }}>
                              <Text style={{ wordBreak: "break-all" }}>{vnp[k]}</Text>
                              <Tooltip title="Sao chép">
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() => copy(vnp[k])}
                                />
                              </Tooltip>
                            </Flex>
                          </Flex>
                        ))
                    ) : (
                      <Text type="secondary">Không có tham số nào.</Text>
                    )}
                  </Space>
                </Card>
              ),
            },
          ]}
        />

        {/* Gợi ý xử lý tiếp */}
        {!success && (
          <Alert
            type="warning"
            showIcon
            message="Thanh toán chưa hoàn tất"
            description={
              <Space direction="vertical">
                <div>
                  Vui lòng thử lại hoặc chọn phương thức khác. Nếu tiền đã bị trừ, vui
                  lòng liên hệ hỗ trợ để được đối soát.
                </div>
                <Flex gap={8} wrap>
                  <Button onClick={() => router.push("/checkout")}>Thử thanh toán lại</Button>
                  <Button onClick={() => router.push("/help")}>Liên hệ hỗ trợ</Button>
                </Flex>
              </Space>
            }
          />
        )}
      </Space>
    </div>
  );
}
