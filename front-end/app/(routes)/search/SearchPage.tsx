'use client';

import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/utils/api';
import ProductCard, { Product } from '../../components/product/ProductCard';
import Link from 'next/link';

import { Typography, Row, Col, Empty, Tag, Spin, Alert, Card } from 'antd';

const { Title, Text } = Typography;

export default function SearchPageClient() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!query) {
            setResults([]);
            setErrMsg(null);
            return;
        }
        setLoading(true);
        setErrMsg(null);
        axios
            .get(`${API_BASE_URL}/search`, { params: { query } })
            .then((res) => setResults(res.data))
            .catch((err) => {
                console.error('Search error:', err);
                setErrMsg('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
                setResults([]);
            })
            .finally(() => setLoading(false));
    }, [query]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <Title level={3} style={{ marginBottom: 16 }}>
                Kết quả cho: <Tag color="red">{query || '—'}</Tag>
            </Title>

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
                            {results.map((product) => {
                                const shopSlug =
                                    product.shop_slug || (product as any)?.shop?.slug || 'shop';
                                return (
                                    <Col key={product.id} xs={12} sm={8} md={6} lg={6}>
                                        <Link href={`/shop/${shopSlug}/product/${product.slug}`} className="block">
                                            <Card
                                                hoverable
                                                bodyStyle={{ padding: 0 }}
                                                style={{ height: '100%' }}
                                            >
                                                {/* Giữ nguyên component hiển thị sản phẩm của bạn */}
                                                <ProductCard product={product} />
                                            </Card>
                                        </Link>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </>
            )}
        </div>
    );
}
