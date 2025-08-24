"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Layout,
    Card,
    Row,
    Col,
    Typography,
    Select,
    Slider,
    Button,
    Space,
    List,
    Skeleton,
    Alert,
    Empty,
    Pagination,
    ConfigProvider,
    Modal,
} from "antd";
import { FilterOutlined, ReloadOutlined, AppstoreOutlined } from "@ant-design/icons";
import LandingSlider from "@/app/components/home/LandingSlider";
import ProductCard from "@/app/components/product/ProductCard";

import { type NormalizedProduct } from "@/app/components/product/hooks/Product";

const MARKETO_BASE = "https://api.marketo.info.vn/api";
const { Text } = Typography;

interface RawProduct { [k: string]: any }

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

const pickNumber = (...candidates: any[]): number | undefined => {
    for (const c of candidates) {
        const n = Number(c);
        if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    }
    return undefined;
};

const ensureArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string") {
        try {
            const maybe = JSON.parse(val);
            if (Array.isArray(maybe)) return maybe.map(String);
        } catch { }
        return [val];
    }
    return [];
};

export default function CategoryPageAntd() {
    const [allProducts, setAllProducts] = useState<NormalizedProduct[]>([]);
    const [products, setProducts] = useState<NormalizedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [tempRange, setTempRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
    const [appliedRange, setAppliedRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

    const [selectedSort, setSelectedSort] = useState<string>("Phổ Biến");
    const [selectedPriceSort, setSelectedPriceSort] = useState<string | null>(null);
    const [selectedDiscountSort, setSelectedDiscountSort] = useState<string | null>(null);
    const [selectedNameSort, setSelectedNameSort] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageInfo, setPageInfo] = useState<PaginationInfo | null>(null);
    const itemsPerPage = 15;

    const [filterOpen, setFilterOpen] = useState(false);

    // ====== FETCH SẢN PHẨM ======
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${MARKETO_BASE}/product`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const raw = await res.json();
                const list: RawProduct[] =
                    (Array.isArray(raw) ? raw : (raw?.data ?? raw?.products ?? raw?.items ?? [])) || [];

                const normalized: NormalizedProduct[] = list.map((r) => {
                    const price = pickNumber(r.price, r.unit_price, r.base_price, r.min_price);
                    const sale_price = pickNumber(r.sale_price, r.promo_price, r.discount_price);
                    const rating = pickNumber(r.rating, r.rating_avg);
                    const rating_avg = pickNumber(r.rating_avg, r.rating);
                    const review_count = pickNumber(r.review_count, r.reviews_count, r.total_reviews);

                    return {
                        id: r.id ?? r.product_id ?? r._id ?? Math.random(),
                        name: r.name ?? r.title ?? "Sản phẩm",
                        slug: r.slug ?? r.handle ?? String(r.id),
                        image: ensureArray(r.images ?? r.image ?? r.thumbnail ?? []),
                        shop: r.shop,
                        shop_slug: r.shop_slug,
                        price,
                        sale_price,
                        rating,
                        rating_avg,
                        review_count,
                        discount:
                            pickNumber(r.discount, r.discount_percent) ??
                            (sale_price && price
                                ? Math.max(0, Math.round(((price - sale_price) / price) * 100))
                                : undefined),
                        sold: pickNumber(r.sold, r.total_sales, r.sales),
                        createdAt: pickNumber(r.createdAt, r.created_at, Date.parse?.(r.created_at)),
                        variants: Array.isArray(r.variants) ? r.variants : [],
                    };
                });

                setAllProducts(normalized);
            } catch (e: any) {
                setError(e?.message || "Đã xảy ra lỗi");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getSortingParam = () => {
        if (selectedNameSort) return selectedNameSort === "asc" ? "name_asc" : "name_desc";
        if (selectedPriceSort) return selectedPriceSort === "asc" ? "price_asc" : "price_desc";
        if (selectedDiscountSort) return "discount_desc";
        if (selectedSort === "Bán Chạy") return "sold_desc";
        if (selectedSort === "Mới Nhất") return "latest";
        return "rating_desc";
    };

    // Map sang đúng type của ProductCard
    // Dùng NormalizedProduct luôn
    const cardProducts: NormalizedProduct[] = useMemo(
        () =>
            products.map((p) => ({
                ...p,
                price: p.price && p.price > 0 ? p.price : undefined,
                sale_price: p.sale_price && p.sale_price > 0 ? p.sale_price : undefined,
                rating: p.rating,
                rating_avg: p.rating_avg,
                review_count: p.review_count,
                discount: p.discount && p.discount > 0 ? p.discount : undefined,
                sold: p.sold && p.sold > 0 ? p.sold : undefined,
                variants: p.variants ?? [],
            })),
        [products]
    );


    // Filter + Sort + Paginate
    useEffect(() => {
        if (loading) return;

        const effectivePrice = (p: NormalizedProduct) =>
            (p.sale_price != null ? Number(p.sale_price) : Number(p.price)) || 0;

        let filtered = allProducts.filter(
            (p) =>
                effectivePrice(p) >= appliedRange[0] &&
                effectivePrice(p) <= appliedRange[1]
        );

        const sorting = getSortingParam();
        const cmp = (a: NormalizedProduct, b: NormalizedProduct) => {
            switch (sorting) {
                case "name_asc": return (a.name || "").localeCompare(b.name || "");
                case "name_desc": return (b.name || "").localeCompare(a.name || "");
                case "price_asc": return effectivePrice(a) - effectivePrice(b);
                case "price_desc": return effectivePrice(b) - effectivePrice(a);
                case "discount_desc": return (Number(b.discount ?? 0)) - (Number(a.discount ?? 0));
                case "sold_desc": return (Number(b.sold ?? 0)) - (Number(a.sold ?? 0));
                case "latest": return (Number(b.createdAt ?? 0)) - (Number(a.createdAt ?? 0));
                case "rating_desc":
                default:
                    return (Number(b.rating_avg ?? b.rating ?? 0)) - (Number(a.rating_avg ?? a.rating ?? 0));
            }
        };
        filtered = filtered.sort(cmp);

        const total = filtered.length;
        const last_page = Math.max(1, Math.ceil(total / itemsPerPage));
        const current_page = Math.min(page, last_page);
        const start = (current_page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, total);
        const pageItems = filtered.slice(start, end);

        setProducts(pageItems);
        setPageInfo({
            current_page,
            last_page,
            per_page: itemsPerPage,
            total,
            from: total === 0 ? 0 : start + 1,
            to: end,
        });
    }, [
        loading, allProducts, appliedRange,
        selectedSort, selectedPriceSort, selectedDiscountSort, selectedNameSort, page,
    ]);

    const formatVND = (v: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const isInitialLoading = loading && allProducts.length === 0;

    const BannerSkeleton = (
        <Card style={{ borderRadius: 12, overflow: "hidden" }}>
            <div style={{
                width: "100%", aspectRatio: "16 / 6", background: "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Skeleton.Image active style={{ width: "95%", height: "90%", borderRadius: 12 }} />
            </div>
        </Card>
    );

    const renderFilterContent = () => (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
                <Text strong>
                    Giá <Text type="secondary">(VNĐ)</Text>
                </Text>
                <Slider
                    range
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={100_000}
                    value={tempRange}
                    onChange={(v) => setTempRange(v as [number, number])}
                    tooltip={{ formatter: (v) => formatVND(Number(v)) }}
                    style={{ width: "100%" }}
                />
                <Row justify="space-between">
                    <Text>{formatVND(tempRange[0])}</Text>
                    <Text>{formatVND(tempRange[1])}</Text>
                </Row>
                <Space style={{ marginTop: 12 }}>
                    <Button
                        type="primary"
                        onClick={() => {
                            setAppliedRange(tempRange);
                            setFilterOpen(false);
                            setPage(1);
                        }}
                    >
                        Áp dụng
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            setTempRange([PRICE_MIN, PRICE_MAX]);
                            setAppliedRange([PRICE_MIN, PRICE_MAX]);
                            setSelectedSort("Phổ Biến");
                            setSelectedPriceSort(null);
                            setSelectedDiscountSort(null);
                            setSelectedNameSort(null);
                            setFilterOpen(false);
                            setPage(1);
                        }}
                    >
                        Đặt lại
                    </Button>
                </Space>
            </div>
        </Space>
    );

    return (
        <ConfigProvider theme={{ token: { colorPrimary: "#db4444", colorInfo: "#db4444" } }}>
            <div className="max-w-[1170px] mx-auto px-4 pt-16 pb-10">
                <div style={{ marginBottom: 32 }}>
                    {isInitialLoading ? BannerSkeleton : <LandingSlider />}
                </div>

                {/* Toolbar */}
                <Card variant="borderless" style={{ marginBottom: 12 }}>
                    <Row align="middle" justify="space-between" gutter={[8, 8]} wrap>
                        <Col flex="none">
                            <Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>
                                Bộ lọc
                            </Button>
                        </Col>
                        <Col flex="auto">
                            <Space wrap size={8} style={{ width: "100%", justifyContent: "flex-end" }} align="center">
                                <span style={{ whiteSpace: "nowrap" }} className="hidden md:inline-flex">
                                    <AppstoreOutlined />
                                    <Text strong style={{ color: "#1f1f1f", marginLeft: 6 }}>Sắp xếp theo</Text>
                                </span>

                                <Select
                                    value={selectedSort}
                                    onChange={(v) => {
                                        setSelectedSort(v);
                                        setSelectedPriceSort(null);
                                        setSelectedDiscountSort(null);
                                        setSelectedNameSort(null);
                                        setPage(1);
                                    }}
                                    options={[
                                        { label: "Phổ Biến", value: "Phổ Biến" },
                                        { label: "Mới Nhất", value: "Mới Nhất" },
                                        { label: "Bán Chạy", value: "Bán Chạy" },
                                    ]}
                                />
                                <Select
                                    style={{ minWidth: 150 }}
                                    value={selectedPriceSort || undefined}
                                    placeholder="Giá"
                                    onChange={(v) => {
                                        setSelectedPriceSort(v ?? null);
                                        if (v) {
                                            setSelectedDiscountSort(null);
                                            setSelectedNameSort(null);
                                        }
                                        setPage(1);
                                    }}
                                    allowClear
                                    options={[
                                        { label: "Thấp đến cao", value: "asc" },
                                        { label: "Cao đến thấp", value: "desc" },
                                    ]}
                                />
                                <Select
                                    style={{ minWidth: 150 }}
                                    value={selectedDiscountSort || undefined}
                                    placeholder="Khuyến mãi"
                                    onChange={(v) => {
                                        setSelectedDiscountSort(v ?? null);
                                        if (v) {
                                            setSelectedPriceSort(null);
                                            setSelectedNameSort(null);
                                        }
                                        setPage(1);
                                    }}
                                    allowClear
                                    options={[{ label: "Cao đến thấp", value: "desc" }]}
                                />
                                <Select
                                    style={{ minWidth: 150 }}
                                    value={selectedNameSort || undefined}
                                    placeholder="Tên"
                                    onChange={(v) => {
                                        setSelectedNameSort(v ?? null);
                                        if (v) {
                                            setSelectedPriceSort(null);
                                            setSelectedDiscountSort(null);
                                        }
                                        setPage(1);
                                    }}
                                    allowClear
                                    options={[
                                        { label: "A đến Z", value: "asc" },
                                        { label: "Z đến A", value: "desc" },
                                    ]}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Products */}
                <Card>
                    {error ? (
                        <Alert type="error" showIcon message={error} />
                    ) : loading && allProducts.length === 0 ? (
                        <Row gutter={[16, 16]}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                                    <Card
                                        hoverable
                                        bordered
                                        style={{ borderRadius: 12, overflow: "hidden", height: "100%" }}
                                        cover={
                                            <div
                                                style={{
                                                    width: "100%",
                                                    aspectRatio: "1 / 1",
                                                    background: "#f5f5f5",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Skeleton.Image active style={{ width: "80%", height: "80%", borderRadius: 8 }} />
                                            </div>
                                        }
                                    >
                                        <Skeleton active title={false} paragraph={{ rows: 2, width: ["90%", "60%"] }} />
                                        <div style={{ marginTop: 8 }}>
                                            <Skeleton.Button active size="small" style={{ width: "60%" }} />
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : cardProducts.length === 0 ? (
                        <Empty description="Không có sản phẩm nào" />
                    ) : (
                        <>
                            {pageInfo && (
                                <div className="mb-4 text-sm text-gray-600">
                                    Hiển thị {pageInfo.from}-{pageInfo.to} / {pageInfo.total} sản phẩm
                                </div>
                            )}
                                        <List
                                            grid={{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
                                            dataSource={cardProducts}
                                            renderItem={(product, idx) => (
                                                <List.Item key={`${product.id}-${idx}`}>
                                                    <ProductCard product={product as any} />
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
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                    />
                                </Row>
                            )}
                        </>
                    )}
                </Card>
            </div>

            <Modal
                title={<Space><FilterOutlined /> Bộ lọc</Space>}
                open={filterOpen}
                onCancel={() => setFilterOpen(false)}
                footer={null}
                width={420}
                centered
                bodyStyle={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: 16,
                }}
            >
                {renderFilterContent()}
            </Modal>
        </ConfigProvider>
    );
}
