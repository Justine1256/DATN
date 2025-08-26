"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  ConfigProvider,
  theme as antdTheme,
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Typography,
  Space,
  Grid,
  Skeleton,
  Result,
  Button,
  Avatar,
  Tooltip,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Percent,
} from "lucide-react";

const { Title, Text } = Typography;

/* ================= Types ================= */
interface TopSellingProduct { id: number; name: string; sold: number; stock: number }
interface MonthlyRevenue { month: string; revenue: string }
interface DashboardData {
  total_sales: string;       // Tổng thu (gross) - API trả string số
  commission: number;        // Thuế/hoa hồng 5% - API đã tính sẵn
  shop_revenue: number;      // Tổng nhận (net) - API đã tính sẵn
  total_orders: number;
  completed_orders: number;
  canceled_orders: number;
  total_products: number;
  low_stock_products: number;
  top_selling_products: TopSellingProduct[];
  average_rating: number;
  total_reviews: number;
  total_followers: number;
  monthly_revenue: MonthlyRevenue[];
}

/* ================ CountUp hook ================ */
function useCountUp(end: number, duration = 1500, start = 0) {
  const [count, setCount] = useState(start);
  const raf = useRef<number | null>(null);
  const t0 = useRef<number | null>(null);

  useEffect(() => {
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const step = (now: number) => {
      if (!t0.current) t0.current = now;
      const p = Math.min((now - t0.current) / duration, 1);
      setCount(start + (end - start) * ease(p));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [end, duration, start]);

  return Math.round(count * 100) / 100;
}

/* ================ Animated display components ================ */
const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const VN = new Intl.NumberFormat("vi-VN");

const AnimatedInt: React.FC<{ value: number; duration?: number; className?: string }> = ({ value, duration = 1500, className }) => {
  const n = useCountUp(value, duration);
  return <span className={className}>{VN.format(Math.floor(n))}</span>;
};

const AnimatedCurrency: React.FC<{ value: number; duration?: number; className?: string }> = ({ value, duration = 1800, className }) => {
  const n = useCountUp(value, duration);
  return <span className={className}>{VND.format(n)}</span>;
};

/* ================= Component ================= */
export default function AdminDashboardAntD() {
  const screens = Grid.useBreakpoint();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("authToken");
        const res = await fetch("https://api.marketo.info.vn/api/shop/dashboard/stats", {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DashboardData;
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Không thể tải dữ liệu");
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const completionRate = useMemo(() => {
    if (!data?.total_orders) return 0;
    return (data.completed_orders / data.total_orders) * 100;
  }, [data]);

  const cancellationRate = useMemo(() => {
    if (!data?.total_orders) return 0;
    return (data.canceled_orders / data.total_orders) * 100;
  }, [data]);

  /* ============== Columns ============== */
  const columns: ColumnsType<TopSellingProduct> = [
    {
      title: "#",
      dataIndex: "id",
      width: 64,
      render: (_v, _r, i) => (
        <Avatar shape="circle" size={28} style={{ background: "#e6f4ff", color: "#1677ff" }}>{i + 1}</Avatar>
      ),
      align: "center",
      fixed: screens.xs ? undefined : "left",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      ellipsis: true,
      render: (t: string, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{t}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.id}</Text>
        </Space>
      ),
    },
    { title: "Đã bán", dataIndex: "sold", align: "center", render: (n: number) => <Text strong>{VN.format(n)}</Text> },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      align: "center",
      render: (n: number) => <Text>{VN.format(n)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "stock",
      align: "center",
      render: (n: number) =>
        n > 1000 ? <Tag color="blue">Còn nhiều</Tag> : n > 500 ? <Tag color="gold">Còn ít</Tag> : <Tag color="red">Sắp hết</Tag>,
    },
  ];

  /* ============== Theme ============== */
  const palette = { primary: "#db4444", bg: "#f6f7fb" } as const;

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: palette.primary,
          borderRadius: 14,
          colorBgLayout: palette.bg,
        },
        components: {
          Card: { headerFontSize: 16, paddingLG: 20 },
          Statistic: { fontFamily: "Inter, system-ui, sans-serif" },
        },
      }}
    >
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f9fafb 0%,#eef2ff 100%)", padding: 16 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* Header */}
            <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
              <div>
                <Title level={3} style={{ margin: 0 }}>Dashboard Quản Trị</Title>
                <Text type="secondary">Tổng quan hoạt động cửa hàng</Text>
              </div>
              <Space>
                <Tag color="green">Hoạt động</Tag>
                <Tag> Cập nhật: {new Date().toLocaleString("vi-VN")} </Tag>
              </Space>
            </Space>

            {/* Loading / Error */}
            {loading && (
              <Row gutter={[16, 16]}>
                {new Array(4).fill(0).map((_, i) => (
                  <Col key={i} xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                    <Card style={{ flex: 1 }}><Skeleton active /></Card>
                  </Col>
                ))}
                <Col xs={24} lg={12} style={{ display: "flex" }}><Card style={{ flex: 1 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
                <Col xs={24} lg={12} style={{ display: "flex" }}><Card style={{ flex: 1 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
                <Col span={24} style={{ display: "flex" }}><Card style={{ flex: 1 }}><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
              </Row>
            )}

            {!loading && error && (
              <Result
                status="error"
                title="Lỗi tải dữ liệu"
                subTitle={error}
                extra={<Button type="primary" onClick={() => location.reload()}>Thử lại</Button>}
              />
            )}

            {!loading && data && (
              <>
                {/* ===== KPI Cards (equal height) ===== */}
                <Row gutter={[16, 16]}>
                  {/* Tổng doanh thu (gross) + commission (5%) + tổng nhận (net) */}
                  <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      style={{ flex: 1, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 18, display: "flex", flexDirection: "column", gap: 8 } }}
                      cover={<div style={{ height: 6, background: "linear-gradient(90deg,#60a5fa,#3b82f6)" }} />}
                    >
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                          <Avatar style={{ background: "#e6f4ff", color: "#1677ff" }} icon={<DollarSign size={16} />} />
                          <Text type="secondary">Tổng doanh thu</Text>
                        </Space>
                        <Tooltip title={data.monthly_revenue?.[0]?.month || "Tháng hiện tại"}>
                          <TrendingUp size={16} />
                        </Tooltip>
                      </Space>

                      {/* Gross */}
                      <div style={{ marginTop: 4 }}>
                        <Title level={3} style={{ margin: 0 }}>
                          <AnimatedCurrency value={parseFloat(data.total_sales)} duration={1800} />
                        </Title>
                        <Text type="secondary">Tổng thu </Text>
                      </div>

                      <Divider style={{ margin: "10px 0" }} />

                      {/* Commission 5% (đã do API tính) */}
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Tag color="blue">
                          <Percent size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                          Thuế/hoa hồng (5%)
                        </Tag>
                        <Text strong>{VND.format(Number(data.commission))}</Text>
                      </Space>

                      {/* Net */}
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Text strong> Tổng nhận </Text>
                        <Text strong style={{ color: "#16a34a" }}>{VND.format(Number(data.shop_revenue))}</Text>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      style={{ flex: 1, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 18, display: "flex", flexDirection: "column", gap: 8 } }}
                      cover={<div style={{ height: 6, background: "linear-gradient(90deg,#34d399,#10b981)" }} />}
                    >
                      <Space>
                        <Avatar style={{ background: "#e8fff3", color: "#10b981" }} icon={<ShoppingCart size={16} />} />
                        <Text type="secondary">Tổng đơn hàng</Text>
                      </Space>
                      <Title level={3} style={{ margin: 0 }}><AnimatedInt value={data.total_orders} duration={1500} /></Title>
                      <Text type="secondary">
                        <CheckCircle style={{ verticalAlign: -2 }} size={14} /> {VN.format(data.completed_orders)} hoàn thành
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      style={{ flex: 1, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 18, display: "flex", flexDirection: "column", gap: 8 } }}
                      cover={<div style={{ height: 6, background: "linear-gradient(90deg,#a78bfa,#7c3aed)" }} />}
                    >
                      <Space>
                        <Avatar style={{ background: "#f3e8ff", color: "#7c3aed" }} icon={<Package size={16} />} />
                        <Text type="secondary">Sản phẩm</Text>
                      </Space>
                      <Title level={3} style={{ margin: 0 }}><AnimatedInt value={data.total_products} duration={1500} /></Title>
                      <Text type="secondary">
                        <AlertTriangle style={{ verticalAlign: -2 }} size={14} /> {VN.format(data.low_stock_products)} sắp hết
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      style={{ flex: 1, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 18, display: "flex", flexDirection: "column", gap: 8 } }}
                      cover={<div style={{ height: 6, background: "linear-gradient(90deg,#fb923c,#f97316)" }} />}
                    >
                      <Space>
                        <Avatar style={{ background: "#fff7ed", color: "#f97316" }} icon={<Users size={16} />} />
                        <Text type="secondary">Người theo dõi</Text>
                      </Space>
                      <Title level={3} style={{ margin: 0 }}><AnimatedInt value={data.total_followers} duration={1500} /></Title>
                      <Text type="secondary"><Star style={{ verticalAlign: -2 }} size={14} /> {data.average_rating.toFixed(1)}/5 đánh giá</Text>
                    </Card>
                  </Col>
                </Row>

                {/* ===== Order status & Reviews ===== */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      title={<Space><ShoppingCart size={18} /> <span>Trạng thái đơn hàng</span></Space>}
                      style={{ flex: 1, display: "flex", flexDirection: "column" }}
                      styles={{ body: { display: "flex", flexDirection: "column", gap: 12 } }}
                    >
                      <div>
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Text strong>Hoàn thành</Text>
                          <Text type="secondary">{VN.format(data.completed_orders)}/{VN.format(data.total_orders)}</Text>
                        </Space>
                        <Progress percent={Number(completionRate.toFixed(1))} status="active" />
                        <Text type="secondary" style={{ fontSize: 12 }}>{completionRate.toFixed(1)}% đơn hàng hoàn thành</Text>
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                      <div>
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Text strong>Đã hủy</Text>
                          <Text type="secondary">{VN.format(data.canceled_orders)}/{VN.format(data.total_orders)}</Text>
                        </Space>
                        <Progress percent={Number(cancellationRate.toFixed(1))} strokeColor="#ef4444" />
                        <Text type="secondary" style={{ fontSize: 12 }}>{cancellationRate.toFixed(1)}% đơn hàng bị hủy</Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12} style={{ display: "flex" }}>
                    <Card
                      hoverable
                      title={<Space><Star size={18} /> <span>Đánh giá & phản hồi</span></Space>}
                      style={{ flex: 1 }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={12}>
                          <Statistic title="Điểm trung bình" precision={1} value={data.average_rating} suffix="/5" />
                          <Text type="secondary">{VN.format(data.total_reviews)} đánh giá</Text>
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title="Người theo dõi"
                            valueRender={() => <AnimatedInt value={data.total_followers} duration={1400} />}
                          />
                          <Text type="secondary">Khách hàng quan tâm</Text>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>

                {/* ===== Top Selling ===== */}
                <Card
                  hoverable
                  title={<Space><TrendingUp size={18} /> <span>Sản phẩm bán chạy nhất</span></Space>}
                >
                  <Table
                    rowKey={(r) => String(r.id)}
                    columns={columns}
                    dataSource={data.top_selling_products}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    scroll={{ x: 720 }}
                  />
                </Card>
              </>
            )}
          </Space>
        </div>
      </div>
    </ConfigProvider>
  );
}
