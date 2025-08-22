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
  Result,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
  Steps,
  Timeline,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { API_BASE_URL } from "@/utils/api";

const { Title, Text, Paragraph } = Typography;

type VerifyResp = {
  verified: boolean;
  success: boolean;
  vnp_ResponseCode?: string;
  order_id?: string;
};

const RESPONSE_MESSAGES: Record<string, { title: string; desc: string }> = {
  "00": { 
    title: "Thanh toán thành công", 
    desc: "Giao dịch của bạn đã được xử lý thành công" 
  },
  "07": { 
    title: "Giao dịch bị từ chối", 
    desc: "Giao dịch bị nghi ngờ có vấn đề, vui lòng liên hệ ngân hàng" 
  },
  "09": { 
    title: "Nhập sai mã OTP", 
    desc: "Bạn đã nhập sai mã OTP quá số lần cho phép" 
  },
  "10": { 
    title: "Xác thực thất bại", 
    desc: "Thông tin thẻ hoặc tài khoản không chính xác" 
  },
  "11": { 
    title: "Vượt hạn mức", 
    desc: "Đã vượt quá hạn mức thanh toán, vui lòng liên hệ ngân hàng" 
  },
  "12": { 
    title: "Thẻ bị khóa", 
    desc: "Thẻ hoặc tài khoản đã bị khóa hoặc chưa được kích hoạt" 
  },
  "13": { 
    title: "Sai mật khẩu", 
    desc: "Mật khẩu thanh toán không chính xác" 
  },
  "24": { 
    title: "Đã hủy giao dịch", 
    desc: "Bạn đã hủy giao dịch" 
  },
  "51": { 
    title: "Không đủ số dư", 
    desc: "Tài khoản không có đủ số dư để thực hiện giao dịch" 
  },
  "65": { 
    title: "Vượt hạn mức giao dịch", 
    desc: "Số tiền vượt quá hạn mức giao dịch cho phép" 
  },
  "75": { 
    title: "Ngân hàng bảo trì", 
    desc: "Ngân hàng đang tạm thời bảo trì, vui lòng thử lại sau" 
  },
  "79": { 
    title: "Nhập sai thông tin", 
    desc: "Thông tin thẻ không chính xác, đã vượt quá số lần cho phép" 
  },
  "91": { 
    title: "Ngân hàng không phản hồi", 
    desc: "Ngân hàng tạm thời không phản hồi, vui lòng thử lại sau" 
  },
  "94": { 
    title: "Giao dịch trùng lặp", 
    desc: "Giao dịch này đã được thực hiện trước đó" 
  },
  "97": { 
    title: "Lỗi bảo mật", 
    desc: "Có lỗi trong quá trình xử lý bảo mật" 
  },
  "99": { 
    title: "Lỗi không xác định", 
    desc: "Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ hỗ trợ" 
  },
};

function formatVND(n?: number | string | null) {
  if (n == null) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("vi-VN").format(num) + "₫";
}

function parseVnpDate(s?: string | null) {
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

export default function VnpReturnPage() {
  const p = useSearchParams();
  const router = useRouter();

  const code = p.get("vnp_ResponseCode") || "";
  const order = p.get("vnp_TxnRef") || "";
  const rawAmount = p.get("vnp_Amount");
  const amount = rawAmount ? Math.round(Number(rawAmount) / 100) : undefined;
  const payDate = parseVnpDate(p.get("vnp_PayDate"));
  const bankCode = p.get("vnp_BankCode");
  const orderInfo = p.get("vnp_OrderInfo");

  const success = code === "00";
  const [verifying, setVerifying] = useState(false);
  const [verify, setVerify] = useState<VerifyResp | null>(null);

  const responseMsg = RESPONSE_MESSAGES[code] || {
    title: success ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất",
    desc: success ? "Giao dịch đã được xử lý thành công" : "Vui lòng thử lại hoặc chọn phương thức khác"
  };

  useEffect(() => {
    const qs = new URLSearchParams();
    p.forEach((v, k) => qs.append(k, v));

    setVerifying(true);
    fetch(`${API_BASE_URL}/vnpay/return?${qs.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then(async (r) => {
        const data = (await r.json()) as VerifyResp;
        if (!r.ok) throw new Error("VERIFY_FAILED");
        setVerify(data);
      })
      .catch(() => {
        setVerify({ verified: false, success: false });
      })
      .finally(() => setVerifying(false));
  }, [p]);

  const verified = verify?.verified ?? false;

  return (
    <div style={{ 
      minHeight: "100vh",
      padding: "24px 16px",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          
          {/* Header với logo và trạng thái */}
          <Card style={{ textAlign: "center", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {success ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : (
                <CloseCircleOutlined style={{ color: "#faad14" }} />
              )}
            </div>
            <Title level={2} style={{ margin: 0, color: success ? "#52c41a" : "#faad14" }}>
              {responseMsg.title}
            </Title>
            <Paragraph style={{ fontSize: 16, marginTop: 8, color: "#666" }}>
              {responseMsg.desc}
            </Paragraph>
            
            {verified && (
              <Tag 
                icon={<SafetyCertificateOutlined />} 
                color="success" 
                style={{ fontSize: 14, padding: "4px 12px" }}
              >
                Đã xác thực bảo mật
              </Tag>
            )}
          </Card>

          {/* Thông tin giao dịch chính */}
          <Card 
            title={
              <Space>
                <CreditCardOutlined />
                <span>Thông tin giao dịch</span>
              </Space>
            }
            style={{ border: "1px solid #e8e8e8" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)", // luôn 4 cột
                gap: 24,
              }}
            >
              <Statistic
                title="Số tiền thanh toán"
                value={formatVND(amount)}
                valueStyle={{
                  color: success ? "#52c41a" : "#faad14",
                  fontSize: 24,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",   // 👈 không cho xuống dòng
                }}
                prefix={<BankOutlined />}
              />
              <Statistic
                title="Mã đơn hàng"
                value={order || "—"}
                valueStyle={{ fontSize: 18, whiteSpace: "nowrap" }}
              />
              <Statistic
                title="Thời gian giao dịch"
                value={
                  payDate
                    ? new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(payDate)
                    : "—"
                }
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: 16, whiteSpace: "nowrap" }}
              />
              <Statistic
                title="Ngân hàng"
                value={bankCode || "VNPay"}
                valueStyle={{ fontSize: 16, whiteSpace: "nowrap" }}
                prefix={<BankOutlined />}
              />
            </div>

            
            {orderInfo && (
              <>
                <Divider />
                <div>
                  <Text strong>Nội dung thanh toán:</Text>
                  <br />
                  <Text>{orderInfo}</Text>
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "nowrap" }}>
              {success ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => router.push("/account?section=orders")}
                    style={{ borderRadius: 6, background: "#db4444", borderColor: "#db4444" }}
                  >
                    Xem đơn hàng của tôi
                  </Button>
                  <Button
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={() => router.push("/")}
                    style={{ borderRadius: 6, background: "#db4444", borderColor: "#db4444", color: "#fff" }}
                  >
                    Về trang chủ
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => router.push("/checkout")}
                    style={{ borderRadius: 6, background: "#db4444", borderColor: "#db4444" }}
                  >
                    Thử thanh toán lại
                  </Button>
                  <Button
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={() => router.push("/")}
                    style={{ borderRadius: 6, background: "#db4444", borderColor: "#db4444", color: "#fff" }}
                  >
                    Về trang chủ
                  </Button>
                  <Button
                    size="large"
                    onClick={() => router.push("/help")}
                    style={{ borderRadius: 6, background: "#db4444", borderColor: "#db4444", color: "#fff" }}
                  >
                    Liên hệ hỗ trợ
                  </Button>
                </>
              )}
            </div>

          </Card>




          {/* Thông báo bổ sung cho trường hợp thất bại */}
          {!success && (
            <Alert
              type="warning"
              showIcon
              style={{ borderRadius: 8 }}
              message="Lưu ý quan trọng"
              description={
                <div>
                  <Paragraph>
                    • Nếu bạn thấy tiền đã bị trừ khỏi tài khoản nhưng giao dịch không thành công, 
                    số tiền sẽ được hoàn lại trong 1-3 ngày làm việc.
                  </Paragraph>
                  <Paragraph>
                    • Để được hỗ trợ nhanh chóng, vui lòng liên hệ với chúng tôi kèm theo 
                    mã giao dịch: <Text code>{order}</Text>
                  </Paragraph>
                  <Paragraph>
                    • Bạn có thể thử thanh toán lại bằng phương thức khác hoặc thẻ khác.
                  </Paragraph>
                </div>
              }
            />
          )}



        </Space>
      </div>
    </div>
  );
}