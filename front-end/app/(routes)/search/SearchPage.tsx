'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/utils/api';
import ProductCard, { Product } from '../../components/product/ProductCard';
import { Typography, Row, Col, Empty, Tag, Spin, Alert, Input } from 'antd';
import { Button } from 'antd';
const { Title, Text } = Typography;

export default function SearchPageClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('query') || '';
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState(query);

    useEffect(() => {
        if (!query) {
            setResults([]);
            setErrMsg(null);
            return;
        }
        setLoading(true);
        setErrMsg(null);

        axios
            .get(`${API_BASE_URL}/products/search`, { params: { q: query } })
            .then((res) => {
                const normalized: Product[] = res.data.map((p: any) => ({
                    // --- thông tin cơ bản ---
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: p.price ?? 0,
                    oldPrice: p.oldPrice ?? undefined,

                    // --- ảnh (luôn là array) ---
                    image: Array.isArray(p.image) ? p.image : (p.image ? [p.image] : []),

                    // --- shop info ---
                    shop_slug: p.shop_slug ?? p?.shop?.slug ?? '',
                    shop_name: p.shop_name ?? p?.shop?.name ?? 'Shop',
                    shop_logo: p.shop_logo ?? p?.shop?.logo ?? '',
                    shop: p.shop ?? { name: p.shop_name ?? 'Shop', slug: p.shop_slug },

                    // --- rating + review + sold ---
                    rating_avg: p.rating_avg ?? 0,
                    review_count: p.review_count ?? 0,
                    sold: p.sold ?? 0,
                    rating: p.rating ?? 0,

                    // --- variants ---
                    variants: p.variants ?? [],

                    // --- sale info ---
                    sale_price: p.sale_price && p.sale_price < p.price ? p.sale_price : null,

                    // sale_price: p.sale_price ?? null,
                    sale_starts_at: p.sale_starts_at ?? null,
                    sale_ends_at: p.sale_ends_at ?? null,

                    // --- discount % ---
                    discount: p.discount ?? undefined,
                }));

                setResults(normalized);
            })
            .catch((err) => {
                console.error('Search error:', err);
                setErrMsg('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
                setResults([]);
            })
            .finally(() => setLoading(false));
    }, [query]);

    const handleSearch = () => {
        const keyword = searchValue.trim();
        if (!keyword) return;
        router.push(`/search?query=${encodeURIComponent(keyword)}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <Title level={3} style={{ marginBottom: 16 }}>
                Kết quả cho: <Tag color="red">{query || '—'}</Tag>
            </Title>

            {/* Ô tìm kiếm dành riêng cho mobile */}
            <div className="block sm:hidden mb-4">
                <Input.Search
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onSearch={handleSearch}
                    enterButton={
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: "#DB4444",
                                borderColor: "#DB4444",
                            }}
                        >
                            Tìm
                        </Button>
                    }
                />
            </div>

            {!query && (
                <Empty
                    description={<Text type="secondary">Nhập từ khóa để bắt đầu tìm kiếm</Text>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}

            {errMsg && (
                <div style={{ marginBottom: 16 }}>
                    <Alert type="error" message={errMsg} showIcon />
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <Spin tip="Đang tìm kiếm..." />
                </div>
            ) : (
                <>
                    {query && results.length === 0 ? (
                        <Empty
                            description={<Text type="secondary">Không tìm thấy sản phẩm nào.</Text>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {results.map((product) => (
                                <Col key={product.id} xs={12} sm={8} md={6} lg={6}>
                                    {/* ProductCard đã xử lý click detail + click shop */}
                                    <ProductCard product={product} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            )}
        </div>
    );
}
