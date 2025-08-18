"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Layout, Card, Row, Col, Typography, Select, Slider, Button, Space,
  Divider, List, Skeleton, Alert, Empty, Tag, Pagination, Tooltip, ConfigProvider
} from "antd";
import { FilterOutlined, ReloadOutlined, AppstoreOutlined } from "@ant-design/icons";
import LandingSlider from "@/app/components/home/LandingSlider";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import ProductCardcate from "@/app/components/product/ProductCardCate";
import { API_BASE_URL } from "@/utils/api";

const { Sider, Content } = Layout;
const { Text } = Typography;

interface Product {
  id: number;
  name: string;
  image: string[];
  slug: string;
  price: string | number;
  oldPrice: number;
  rating: number;
  rating_avg?: string | number;
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: string | number | null;
  shop_slug: string;
  shop?: { name: string; slug: string };
  createdAt?: number;
  sold?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const PRICE_MIN = 0;
const PRICE_MAX = 50_000_000;

// cắt bớt chữ phía sau
const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n) + "…");

export default function CategoryPageAntd() {
  const { slug } = useParams() as { slug?: string };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // bộ lọc
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(slug || null);
  const [tempRange, setTempRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [appliedRange, setAppliedRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  // sắp xếp
  const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
  const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
  const [selectedDiscountSort, setSelectedDiscountSort] = useState<string | null>(null);
  const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);

  // phân trang
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<PaginationInfo | null>(null);
  const itemsPerPage = 15;

  // fetch categories
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/category`);
        const data = await res.json();
        setCategories(data || []);
      } catch {
        // bỏ qua
      }
    })();
  }, []);

  // hàm build sorting param
  const getSortingParam = () => {
    if (selectedNameSort) return selectedNameSort === "asc" ? "name_asc" : "name_desc";
    if (selectedPriceSort) return selectedPriceSort === "asc" ? "price_asc" : "price_desc";
    if (selectedDiscountSort) return "discount_desc";
    if (selectedSort === "Bán Chạy") return "sold_desc";
    if (selectedSort === "Mới Nhất") return "latest";
    return "rating_desc"; // Phổ Biến
  };

  // fetch products
  const fetchProducts = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const sorting = getSortingParam();
      const params = new URLSearchParams({
        page: String(p),
        per_page: String(itemsPerPage),
        sorting,
      });
      if (appliedRange[0] > PRICE_MIN) params.append("min_price", String(appliedRange[0]));
      if (appliedRange[1] < PRICE_MAX) params.append("max_price", String(appliedRange[1]));

      let url = `${API_BASE_URL}/product?${params.toString()}`;
      if (selectedCategorySlug) {
        url = `${API_BASE_URL}/category/${selectedCategorySlug}/products?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const pagData = data.products?.data ? data.products : data;
      const items: Product[] = pagData.data || [];

      setProducts(items);
      setPageInfo({
        current_page: pagData.current_page,
        last_page: pagData.last_page,
        per_page: pagData.per_page,
        total: pagData.total,
        from: pagData.from,
        to: pagData.to,
      });
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  // refetch khi filter/sort thay đổi
  useEffect(() => {
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategorySlug, appliedRange, selectedSort, selectedPriceSort, selectedDiscountSort, selectedNameSort]);

  const formatVND = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

  const selectedCategoryName = useMemo(
    () => categories.find(c => c.slug === selectedCategorySlug)?.name || null,
    [categories, selectedCategorySlug]
  );

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#db4444", colorInfo: "#db4444" },
        components: {
          Button: { defaultHoverBorderColor: "#db4444", defaultColor: "#db4444", defaultHoverColor: "#db4444" },
          Slider: { colorPrimary: "#db4444" },
          Pagination: { colorPrimary: "#db4444" },
          Select: { colorPrimary: "#db4444" },
          Tag: { colorPrimary: "#db4444" },
        },
      }}
    >
      <div className="max-w-[1170px] mx-auto px-4 pt-16 pb-10">
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <LandingSlider />
        </Card>
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <CategoryGrid />
        </Card>

        <Layout style={{ background: "transparent" }}>
          {/* SIDEBAR */}
          <Sider
            width={280}
            breakpoint="lg"
            collapsedWidth={0}
            style={{ background: "transparent", paddingRight: 16 }}
          >
            <Card title={<Space><FilterOutlined />Bộ lọc</Space>}>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Danh mục */}
                <div>
                  <Text strong>Danh mục</Text>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type={!selectedCategorySlug ? "primary" : "default"}
                      block
                      onClick={() => {
                        setSelectedCategorySlug(null);
                        history.pushState({}, "", "/category");
                      }}
                    >
                      Tất Cả Sản Phẩm
                    </Button>
                    <Divider style={{ margin: "12px 0" }} />
                    {categories.map((cat) => (
                      <Tooltip key={cat.id} title={cat.name}>
                        <Button
                          block
                          style={{ marginBottom: 8, textAlign: "left" }}
                          type={selectedCategorySlug === cat.slug ? "primary" : "default"}
                          onClick={() => {
                            setSelectedCategorySlug(cat.slug);
                            history.pushState({}, "", `/category/${cat.slug}`);
                          }}
                        >
                          {truncate(cat.name, 28)}
                        </Button>
                      </Tooltip>
                    ))}

                    {selectedCategorySlug && (
                      <div style={{ marginTop: 8 }}>
                        <Tag color="red">
                          Đang lọc: {truncate(selectedCategoryName || selectedCategorySlug, 32)}
                        </Tag>
                      </div>
                    )}
                  </div>
                </div>

                {/* Giá */}
                <div>
                  <Text strong>
                    Giá <Text type="secondary">(VNĐ)</Text>
                  </Text>
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Text>{formatVND(tempRange[0])}</Text>
                    <Text>{formatVND(tempRange[1])}</Text>
                  </Row>
                  <Slider
                    range
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={100_000}
                    value={tempRange}
                    onChange={(v) => setTempRange(v as [number, number])}
                    tooltip={{ formatter: (v) => formatVND(Number(v)) }}
                  />
                  <Space>
                    <Button type="primary" onClick={() => setAppliedRange(tempRange)}>
                      Áp dụng
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSelectedCategorySlug(null);
                        setTempRange([PRICE_MIN, PRICE_MAX]);
                        setAppliedRange([PRICE_MIN, PRICE_MAX]);
                        setSelectedSort("Phổ Biến");
                        setSelectedPriceSort(null);
                        setSelectedDiscountSort(null);
                        setSelectedNameSort(null);
                        history.pushState({}, "", "/category");
                      }}
                    >
                      Đặt lại
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>
          </Sider>

          {/* MAIN */}
          <Content>
            <Card bordered={false} style={{ marginBottom: 12 }}>
              <Row gutter={[8, 8]} align="middle">
                <Col xs={24} md={6}>
                  <Space>
                    <Text strong>Sắp xếp theo:</Text>
                    <AppstoreOutlined />
                  </Space>
                </Col>
                <Col xs={24} md={6}>
                  <Select
                    style={{ width: "100%" }}
                    value={selectedSort}
                    onChange={(v) => {
                      setSelectedSort(v);
                      setSelectedPriceSort(null);
                      setSelectedDiscountSort(null);
                      setSelectedNameSort(null);
                    }}
                    options={[
                      { label: "Phổ Biến", value: "Phổ Biến" },
                      { label: "Mới Nhất", value: "Mới Nhất" },
                      { label: "Bán Chạy", value: "Bán Chạy" },
                    ]}
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Select
                    style={{ width: "100%" }}
                    value={selectedPriceSort || undefined}
                    placeholder="Giá"
                    onChange={(v) => {
                      setSelectedPriceSort(v ?? null);
                      if (v) {
                        setSelectedDiscountSort(null);
                        setSelectedNameSort(null);
                      }
                    }}
                    allowClear
                    options={[
                      { label: "Thấp đến cao", value: "asc" },
                      { label: "Cao đến thấp", value: "desc" },
                    ]}
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Select
                    style={{ width: "100%" }}
                    value={selectedDiscountSort || undefined}
                    placeholder="Khuyến mãi"
                    onChange={(v) => {
                      setSelectedDiscountSort(v ?? null);
                      if (v) {
                        setSelectedPriceSort(null);
                        setSelectedNameSort(null);
                      }
                    }}
                    allowClear
                    options={[{ label: "Cao đến thấp", value: "desc" }]}
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Select
                    style={{ width: "100%" }}
                    value={selectedNameSort || undefined}
                    placeholder="Tên"
                    onChange={(v) => {
                      setSelectedNameSort(v ?? null);
                      if (v) {
                        setSelectedPriceSort(null);
                        setSelectedDiscountSort(null);
                      }
                    }}
                    allowClear
                    options={[
                      { label: "A đến Z", value: "asc" },
                      { label: "Z đến A", value: "desc" },
                    ]}
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Button
                    block
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setSelectedSort("Phổ Biến");
                      setSelectedPriceSort(null);
                      setSelectedDiscountSort(null);
                      setSelectedNameSort(null);
                    }}
                  >
                    Đặt lại
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card>
              {error ? (
                <Alert type="error" showIcon message={error} />
              ) : loading ? (
                <Row gutter={[16, 16]}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Col key={i} xs={24} sm={12} md={8}>
                      <Card>
                        <Skeleton active paragraph={{ rows: 2 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : products.length === 0 ? (
                <Empty description="Không có sản phẩm nào" />
              ) : (
                <>
                  {pageInfo && (
                    <div className="mb-4 text-sm text-gray-600">
                      Hiển thị {pageInfo.from}-{pageInfo.to} / {pageInfo.total} sản phẩm
                    </div>
                  )}

                  {/* 3 cột một hàng */}
                  <List
                    grid={{ gutter: 16, column: 3, xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
                    dataSource={products}
                    renderItem={(product: Product, idx: number) => (
                      <List.Item key={`${product.id}-${idx}`}>
                        <ProductCardcate
                          product={{
                            ...product,
                            price: Number(product.price) || 0,
                            sale_price: product.sale_price ? Number(product.sale_price) : undefined,
                            rating_avg: product.rating_avg ? Number(product.rating_avg) : undefined,
                          }}
                        />
                      </List.Item>
                    )}
                  />

                  {pageInfo && pageInfo.last_page > 1 && (
                    <Row justify="center" style={{ marginTop: 16 }}>
                      <Pagination
                        current={pageInfo.current_page}
                        total={pageInfo.total}
                        pageSize={pageInfo.per_page}
                        showSizeChanger={false}
                        onChange={(p) => {
                          setPage(p);
                          fetchProducts(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    </Row>
                  )}
                </>
              )}
            </Card>
          </Content>
        </Layout>
      </div>
    </ConfigProvider>
  );
}
