"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Layout, Row, Col, Card, Select, Slider, Button, Typography,
    Divider, List, Skeleton, Alert, Empty, Tag, Space, Pagination, ConfigProvider
} from "antd";
import { FilterOutlined, ReloadOutlined, AppstoreOutlined } from "@ant-design/icons";
import ShopCard from "@/app/components/stores/Shopcard";
import ProductCardCate from "@/app/components/product/ProductCardCate";
import { API_BASE_URL } from "@/utils/api";

const { Sider, Content } = Layout;
const { Text } = Typography;

export interface Product {
    id: number;
    name: string;
    image: string[];
    slug: string;
    price: string | number;
    oldPrice: number;
    rating: string;
    rating_avg?: string | number;
    discount: number;
    sale_price?: string | number | null;
    shop_slug?: string;
    shop_id?: number;
    category_id?: number;
    category?: {
        id: number;
        name: string;
        slug: string;
        parent_id?: number;
    };
    createdAt?: number;
    updated_at?: string;
    sold?: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Shop {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    rating: string;
    total_sales: number;
    created_at: string;
    status: "activated" | "pending" | "suspended";
    email: string;
    slug: string;
    followers_count: number;
}

// ---- SWR fetcher ----
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
};

const PRICE_MIN = 0;
const PRICE_MAX = 50_000_000;

// Ẩn bớt chữ phía sau
const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

export default function ShopPageAntd() {
    const [slug, setSlug] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Price filter (temp vs applied)
    const [tempRange, setTempRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
    const [appliedRange, setAppliedRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

    // Sorting states
    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
    const [selectedDiscountSort, setSelectedDiscountSort] = useState<string | null>(null);
    const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);

    // Init slug from URL
    useEffect(() => {
        const pathSlug = window.location.pathname.split("/").pop();
        setSlug(pathSlug ?? null);
    }, []);

    // ---- Build API query ----
    const getSortingParam = () => {
        if (selectedNameSort === "asc") return "name_asc";
        if (selectedNameSort === "desc") return "name_desc";

        if (selectedPriceSort) return selectedPriceSort === "asc" ? "price_asc" : "price_desc";

        if (selectedDiscountSort) return selectedDiscountSort === "asc" ? "discount_asc" : "discount_desc";

        if (selectedSort === "Mới Nhất") return "latest";
        if (selectedSort === "Bán Chạy") return "sold_desc";
        if (selectedSort === "Phổ Biến") return "rating_desc";

        return "latest";
    };

    const buildQueryParams = (page: number) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());

        // price
        if (appliedRange[0] > PRICE_MIN) params.append("min_price", String(appliedRange[0]));
        if (appliedRange[1] < PRICE_MAX) params.append("max_price", String(appliedRange[1]));

        // sort
        const sorting = getSortingParam();
        if (sorting) params.append("sorting", sorting);

        return params.toString();
    };

    const getProductsUrl = () => {
        const qp = buildQueryParams(currentPage);
        if (selectedCategory) {
            return `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${qp}`;
        }
        return `${API_BASE_URL}/shop/${slug}/products?${qp}`;
    };

    // ---- SWR calls ----
    const { data: shopData, error: shopError } = useSWR(
        slug ? `${API_BASE_URL}/shop/${slug}` : null,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 300000 }
    );

    const { data: categoryData, error: categoryError } = useSWR(
        slug ? `${API_BASE_URL}/shop/${slug}/categories` : null,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 300000 }
    );

    const { data: productData, error: productError, isLoading: isLoadingProducts } = useSWR(
        slug ? getProductsUrl() : null,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 30000 }
    );

    // Prefetch next/prev
    useSWR(
        slug && productData?.products?.next_page_url
            ? selectedCategory
                ? `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${buildQueryParams(currentPage + 1)}`
                : `${API_BASE_URL}/shop/${slug}/products?${buildQueryParams(currentPage + 1)}`
            : null,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 }
    );

    useSWR(
        slug && currentPage > 1
            ? selectedCategory
                ? `${API_BASE_URL}/shop/${slug}/products-by-category/${selectedCategory}?${buildQueryParams(currentPage - 1)}`
                : `${API_BASE_URL}/shop/${slug}/products?${buildQueryParams(currentPage - 1)}`
            : null,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 }
    );

    // ---- Derive data ----
    const shop: Shop | null = shopData?.shop || null;
    const categories: Category[] = categoryData?.categories || [];

    const products: Product[] = productData?.products?.data || [];
    const pagination = {
        current_page: productData?.products?.current_page || 1,
        last_page: productData?.products?.last_page || 1,
        total: productData?.products?.total || 0,
        per_page: productData?.products?.per_page || 15,
    };

    const processedProducts = useMemo(
        () =>
            products.map((p: Product) => ({
                ...p,
                createdAt: p.updated_at ? new Date(p.updated_at).getTime() : 0,
                rating: p.rating?.toString?.() ?? "0",
                oldPrice: p.oldPrice ?? 0,
            })),
        [products]
    );

    const isLoadingShopAndCategories = !slug || !shopData || !categoryData;
    const error = shopError || categoryError || productError;

    const formatVND = (v: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    // ---- Render ----
    if (isLoadingShopAndCategories) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 pb-10">
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 pb-10">
                <Alert type="error" showIcon message={(error as Error).message || "Đã xảy ra lỗi"} />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 pb-10">
                <Alert type="warning" showIcon message="Không thể tải thông tin cửa hàng." />
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#db4444",
                    colorInfo: "#db4444",
                },
                components: {
                    Button: {
                        defaultHoverBorderColor: "#db4444",
                        defaultColor: "#db4444",
                        defaultHoverColor: "#db4444",
                    },
                    Slider: {
                        colorPrimary: "#db4444",
                    },
                    Tag: {
                        colorPrimary: "#db4444",
                    },
                    Pagination: {
                        colorPrimary: "#db4444",
                    },
                    Select: {
                        colorPrimary: "#db4444",
                    },
                },
            }}
        >
            <Layout className="max-w-[1200px] mx-auto bg-transparent px-4 pb-10">
                <Content style={{ background: "transparent" }}>
                    <Card bordered={false} style={{ marginTop: 16, marginBottom: 16 }}>
                        <ShopCard shop={shop} />
                    </Card>
                    <Layout style={{ background: "transparent" }}>
                        {/* Sidebar Filters */}
                        <Sider
                            width={280}
                            breakpoint="lg"
                            collapsedWidth={0}
                            style={{ background: "transparent", paddingRight: 16 }}
                        >
                            <Card title={<Space><FilterOutlined />Bộ lọc</Space>}>
                                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                    {/* Categories */}
                                    <div>
                                        <Space align="center">
                                            <Text strong>Danh mục</Text>
                                        </Space>
                                        <div style={{ marginTop: 12 }}>
                                            <Button
                                                type={!selectedCategory ? "primary" : "default"}
                                                block
                                                onClick={() => setSelectedCategory(null)}
                                            >
                                                Tất Cả Sản Phẩm
                                            </Button>
                                            <Divider style={{ margin: "12px 0" }} />
                                            {(showAllCategories ? categories : categories.slice(0, 6)).map((cat) => (
                                                <Button
                                                    key={cat.id}
                                                    block
                                                    style={{ marginBottom: 8, textAlign: "left" }}
                                                    type={selectedCategory === cat.slug ? "primary" : "default"}
                                                    onClick={() => {
                                                        setSelectedCategory(cat.slug);
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    {truncateText(cat.name, 25)}
                                                </Button>
                                            ))}
                                            {categories.length > 6 && (
                                                <Button type="link" onClick={() => setShowAllCategories(!showAllCategories)}>
                                                    {showAllCategories ? "Ẩn bớt" : "Xem thêm"}
                                                </Button>
                                            )}
                                            {selectedCategory && (
                                                <div style={{ marginTop: 8 }}>
                                                    <Tag color="red">
                                                        Đang lọc: {truncateText(selectedCategory, 20)}
                                                    </Tag>

                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <Space direction="vertical" style={{ width: "100%" }}>
                                            <Text strong>
                                                Giá <Text type="secondary">(VNĐ)</Text>
                                            </Text>
                                            <Row justify="space-between">
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
                                                <Button type="primary" onClick={() => { setAppliedRange(tempRange); setCurrentPage(1); }}>
                                                    Áp dụng
                                                </Button>
                                                <Button icon={<ReloadOutlined />} onClick={() => {
                                                    setSelectedSort("Phổ Biến");
                                                    setSelectedPriceSort(null);
                                                    setSelectedDiscountSort(null);
                                                    setSelectedNameSort(null);
                                                    setSelectedCategory(null);
                                                    setTempRange([PRICE_MIN, PRICE_MAX]);
                                                    setAppliedRange([PRICE_MIN, PRICE_MAX]);
                                                    setCurrentPage(1);
                                                }}>
                                                    Đặt lại
                                                </Button>
                                            </Space>
                                        </Space>
                                    </div>
                                </Space>
                            </Card>
                        </Sider>

                        {/* Main Content */}
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
                                                setCurrentPage(1);
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
                                                    setSelectedSort("Phổ Biến");
                                                    setSelectedDiscountSort(null);
                                                    setSelectedNameSort(null);
                                                }
                                                setCurrentPage(1);
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
                                                    setSelectedSort("Phổ Biến");
                                                    setSelectedPriceSort(null);
                                                    setSelectedNameSort(null);
                                                }
                                                setCurrentPage(1);
                                            }}
                                            allowClear
                                            options={[
                                                { label: "Cao đến thấp", value: "desc" },
                                            ]}
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
                                                    setSelectedSort("Phổ Biến");
                                                    setSelectedPriceSort(null);
                                                    setSelectedDiscountSort(null);
                                                }
                                                setCurrentPage(1);
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
                                            onClick={() => {
                                                setSelectedSort("Phổ Biến");
                                                setSelectedPriceSort(null);
                                                setSelectedDiscountSort(null);
                                                setSelectedNameSort(null);
                                                setCurrentPage(1);
                                            }}
                                            icon={<ReloadOutlined />}
                                        >
                                            Đặt lại
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Products Grid */}
                            <Card>
                                {isLoadingProducts ? (
                                    <Row gutter={[16, 16]}>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <Col key={i} xs={12} sm={8} md={6} lg={6}>
                                                <Card>
                                                    <Skeleton active paragraph={{ rows: 2 }} />
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : processedProducts.length === 0 ? (
                                    <Empty description="Không có sản phẩm nào" />
                                ) : (
                                    <>
                                        <List
                                                    grid={{
                                                        gutter: 16,
                                                        column: 3,   // mặc định 3 cột
                                                        xs: 1,       // mobile 1
                                                        sm: 2,       // tablet nhỏ 2
                                                        md: 3,       // từ md trở lên 3
                                                        lg: 3,
                                                        xl: 3,
                                                        xxl: 3,
                                                    }}
                                            dataSource={processedProducts}
                                            renderItem={(product: Product, idx: number) => (
                                                <List.Item key={`product-${product.id}-${currentPage}-${idx}`}>
                                                    {/* Truyền image như lúc đầu, không fallback */}
                                                    <ProductCardCate
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

                                        {/* Pagination */}
                                        <Row justify="center" style={{ marginTop: 16 }}>
                                            <Pagination
                                                current={pagination.current_page}
                                                total={pagination.total}
                                                pageSize={pagination.per_page}
                                                showSizeChanger={false}
                                                onChange={(page) => {
                                                    setCurrentPage(page);
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                            />
                                        </Row>
                                    </>
                                )}
                            </Card>
                        </Content>
                    </Layout>
                </Content>
            </Layout>
        </ConfigProvider>
    );
}
