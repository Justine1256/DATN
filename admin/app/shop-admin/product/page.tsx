"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    EditOutlined,
} from "@ant-design/icons";
import {
    Table,
    Tag,
    Button,
    Tooltip,
    Rate,
    message,
    Card,
    Space,
    Typography,
    Pagination as AntPagination,
    Empty,
} from "antd";

import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import ProductListHeader from "../../components/shop-admin/product/list/ListHeader";
import { useAuth } from "../../AuthContext";

export default function ProductListPage() {
    const router = useRouter();
    const { user, isAuthReady } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const [messageApi, contextHolder] = message.useMessage();

    const categoriesMap = useMemo(() => {
        const map = new Map<number, Category>();
        categories.forEach((c) => {
            map.set(c.id, c);
            if (c.parent && c.parent.id) map.set(c.parent.id, c.parent);
        });
        return map;
    }, [categories]);

    const fetchProducts = async (page = 1) => {
        if (!user?.shop?.id) return;
        try {
            setLoading(true);
            const token = Cookies.get("authToken");
            const res = await fetch(
                `${API_BASE_URL}/shop/products/${user.shop.id}?page=${page}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Fetch lỗi");
            const data = await res.json();
            const rawProducts = Array.isArray(data.products?.data)
                ? data.products.data
                : [];
            const mapped: Product[] = rawProducts.map((p: any): Product => ({
                id: p.id,
                category_id: p.category_id,
                shop_id: p.shop_id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: parseFloat(p.price),
                sale_price: p.sale_price ? parseFloat(p.sale_price) : null,
                stock: p.stock,
                sold: p.sold,
                image:
                    typeof p.image === "string"
                        ? [p.image]
                        : Array.isArray(p.image)
                            ? p.image
                            : [],
                option1: p.option1 ?? null,
                value1: p.value1 ?? null,
                option2: p.option2 ?? null,
                value2: p.value2 ?? null,
                status: p.status,
                created_at: p.created_at,
                updated_at: p.updated_at,
                deleted_at: p.deleted_at,
                size:
                    typeof p.size === "string"
                        ? p.size.split(",").map((s: string) => s.trim())
                        : [],
                category: p.category ?? null,
                rating: p.rating ? parseFloat(p.rating) : 0,
            }));
            setProducts(mapped);
            setTotalPages(data.products?.last_page || 1);
            setCurrentPage(data.products?.current_page || 1);
        } catch (err) {
            console.error(err);
            messageApi.error("Không thể tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (
        productId: number,
        currentStatus: string
    ) => {
        try {
            const token = Cookies.get("authToken");
            const newStatus = currentStatus === "activated" ? "deleted" : "activated";
            await axios.patch(
                `${API_BASE_URL}/shop/products/${productId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
            );
            const msg = newStatus === "activated" ? "Đã kích hoạt sản phẩm" : "Đã ẩn sản phẩm";
            setPopupMessage(msg);
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
        } catch (err) {
            console.error(err);
            messageApi.error("Không thể cập nhật trạng thái sản phẩm.");
        }
    };

    useEffect(() => {
        if (isAuthReady && user?.shop?.id) {
            fetchProducts(currentPage);
        }
    }, [isAuthReady, user, currentPage]);

    const columns = [
        {
            title: "Tên sản phẩm & Thuộc tính",
            dataIndex: "name",
            key: "name",
            width: 380,
            render: (_: any, product: Product) => (
                <Space align="start">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md">
                        <Image
                            src={
                                product.image?.[0]
                                    ? `${STATIC_BASE_URL}/${product.image[0]}`
                                    : `${STATIC_BASE_URL}/default-image.jpg`
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="min-w-0 max-w-[250px]">
                        <Typography.Text strong ellipsis={{ tooltip: product.name }}>
                            {product.name}
                        </Typography.Text>
                        <div className="text-xs text-gray-500 truncate">
                            {product.option1 && product.value1 && (
                                <div>
                                    <span className="font-semibold">{product.option1}:</span> {product.value1}
                                </div>
                            )}
                            {product.option2 && product.value2 && (
                                <div>
                                    <span className="font-semibold">{product.option2}:</span> {product.value2}
                                </div>
                            )}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            width: 120,
            render: (price: number) => (
                <Typography.Text>{price.toLocaleString()}</Typography.Text>
            ),
        },
        {
            title: "Kho",
            dataIndex: "stock",
            key: "stock",
            align: "center" as const,
            width: 100,
        },
        {
            title: "Danh mục con",
            dataIndex: "category",
            key: "category",
            width: 180,
            render: (category: Product["category"]) => (
                <Typography.Text>
                    {typeof category === "object" && (category as any)?.name
                        ? (category as any).name
                        : typeof category === "string"
                            ? category
                            : "Không rõ"}
                </Typography.Text>
            ),
        },
        {
            title: "Đánh giá",
            dataIndex: "rating",
            key: "rating",
            align: "center" as const,
            width: 200,
            render: (rating: number) => (
                <Space size={6} className="justify-center">
                    {rating > 0 ? (
                        <>
                            <Typography.Text>{(rating / 2).toFixed(1)}</Typography.Text>
                            <Rate disabled allowHalf defaultValue={rating / 2} />
                        </>
                    ) : (
                        <Typography.Text type="danger">Chưa có đánh giá</Typography.Text>
                    )}
                </Space>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            width: 140,
            render: (status: string) => (
                <Tag color={status === "activated" ? "green" : "red"}>
                    {status === "activated" ? "Hoạt động" : "Đã ẩn"}
                </Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "actions",
            align: "center" as const,
            width: 150,
            render: (_: any, product: Product) => (
                <Space>
                    <Tooltip
                        title={
                            product.status === "activated" ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"
                        }
                    >
                        <Button
                            shape="circle"
                            onClick={() => handleStatusChange(product.id, product.status)}
                            icon={
                                product.status === "activated" ? (
                                    <EyeInvisibleOutlined />
                                ) : (
                                    <EyeOutlined />
                                )
                            }
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            shape="circle"
                            onClick={() => router.push(`/shop-admin/product/${product.id}/edit`)}
                            icon={<EditOutlined />}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            {showPopup && (
                <div className="fixed top-6 right-6 z-50">
                    <div className="px-5 py-3 rounded-xl shadow-lg bg-green-500 text-white flex items-center gap-2 slide-in">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">{popupMessage}</span>
                    </div>
                </div>
            )}
            <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-in { animation: slideInRight .35s ease-out; }
      `}</style>
            {contextHolder}
            <ProductListHeader />

            <Card bodyStyle={{ padding: 0 }} className="shadow-sm">
                <Table
                    rowKey="id"
                    columns={columns as any}
                    dataSource={products}
                    loading={loading}
                    pagination={false}
                    locale={{ emptyText: <Empty description="Không có sản phẩm nào" /> }}
                    scroll={{ x: 980, y: 520 }}
                />
            </Card>

            <div className="flex justify-center">
                <AntPagination
                    current={currentPage}
                    total={totalPages}
                    pageSize={1}
                    showSizeChanger={false}
                    onChange={(page) => setCurrentPage(page)}
                />
            </div>
        </div>
    );
}
