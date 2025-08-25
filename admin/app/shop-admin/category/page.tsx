"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import CategoryListHeader from "@/app/components/shop-admin/category/list/Header";
import {
    Table,
    Tag,
    Card,
    Typography,
    Space,
    Tooltip,
    Button,
    Empty,
} from "antd";
import { EyeInvisibleOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";

type LocalCategory = {
    id: string;
    name: string;
    image?: string;
    priceRange?: string;
    slug?: string;
    description?: string;
    status?: string;
    parent_id?: string;
    parent?: { name: string };
    [key: string]: any;
};

type Product = {
    id: string;
    name: string;
    category_id: string;
};

export default function CategoryListPage() {
    const [token, setToken] = useState<string | null>(null);
    const [shopId, setShopId] = useState<string | null>(null);
    const [categories, setCategories] = useState<LocalCategory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination ngay trong Table (gộp luôn)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        const t = Cookies.get("authToken");
        setToken(t || null);
    }, []);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Không lấy được user");
                const data = await res.json();
                setShopId(data.shop?.id ?? null);
            } catch (err) {
                console.error("❌ Lỗi lấy shop id:", err);
            }
        })();
    }, [token]);

    const stripHtml = (s?: string) =>
        s ? s.replace(/<\/?[^>]+(>|$)/g, "") : "";

    const fetchCategories = useCallback(async () => {
        if (!token || !shopId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/shop/categories/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Lỗi khi lấy danh mục");
            const data = await res.json();

            // ✅ Loại các field có giá trị null ra khỏi object trước khi set state
            const cleaned: LocalCategory[] = (Array.isArray(data.categories) ? data.categories : []).map(
                (cat: any) => {
                    const withoutNulls = Object.fromEntries(
                        Object.entries(cat).filter(([, v]) => v !== null)
                    ) as LocalCategory;

                    // Chuẩn hoá một số field tuỳ biến (nếu còn null không mong muốn)
                    if (!withoutNulls.description) delete withoutNulls.description;
                    if (!withoutNulls.parent) delete withoutNulls.parent;
                    if (!withoutNulls.image) delete withoutNulls.image;

                    return withoutNulls;
                }
            );

            setCategories(cleaned);
        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    }, [token, shopId]);

    useEffect(() => {
        if (!shopId) return;
        fetchCategories();
    }, [shopId, fetchCategories]);

    const getProductCountForCategory = (categoryId: string) =>
        products.filter((p) => p.category_id === categoryId).length;

    const handleToggleStatus = async (cat: LocalCategory) => {
        try {
            const t = Cookies.get("authToken");
            const newStatus = cat.status === "activated" ? "deleted" : "activated";
            await fetch(`${API_BASE_URL}/shop/categories/${cat.id}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${t}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });
            setCategories((prev) =>
                prev.map((c) => (c.id === cat.id ? { ...c, status: newStatus } : c))
            );
        } catch (e) {
            console.error(e);
        }
    };

    const columns = [
        {
            title: "Danh mục",
            dataIndex: "name",
            key: "name",
            width: 320,
            render: (_: any, cat: LocalCategory) => (
                <Space direction="vertical" size={0} className="min-w-0">
                    <Typography.Text strong ellipsis={{ tooltip: cat.name }}>
                        {cat.name}
                    </Typography.Text>
                    {/* chỉ hiển thị parent nếu có */}
                    {cat.parent?.name && (
                        <Typography.Text
                            type="secondary"
                            className="!text-xs"
                            ellipsis={{ tooltip: cat.parent.name }}
                        >
                            Thuộc: {cat.parent.name}
                        </Typography.Text>
                    )}
                </Space>
            ),
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            width: 420,
            render: (desc?: string) => {
                const plain = stripHtml(desc);
                // Không hiển thị gì nếu rỗng/ null
                return plain ? (
                    <Typography.Paragraph className="!mb-0" ellipsis={{ rows: 2, tooltip: plain }}>
                        {plain}
                    </Typography.Paragraph>
                ) : (
                    <Typography.Text type="secondary"></Typography.Text>
                );
            },
        },
        // {
        //     title: "Số SP",
        //     key: "count",
        //     align: "center" as const,
        //     width: 100,
        //     render: (_: any, cat: LocalCategory) => getProductCountForCategory(cat.id),
        // },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            width: 140,
            render: (status?: string) =>
                status ? (
                    <Tag color={status === "activated" ? "green" : status === "deleted" ? "red" : "default"}>
                        {status === "activated" ? "Hoạt động" : status === "deleted" ? "Đã ẩn" : ""}
                    </Tag>
                ) : (
                    <></>
                ),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 180,
            render: (_: any, cat: LocalCategory) => (
                <Space>
                    <Tooltip title={cat.status === "activated" ? "Ẩn danh mục" : "Hiện danh mục"}>
                        <Button
                            shape="circle"
                            onClick={() => handleToggleStatus(cat)}
                            icon={cat.status === "activated" ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        />
                    </Tooltip>

                    <Tooltip title="Chỉnh sửa">
                        <Link href={`/shop-admin/category/${cat.id}/edit`}>
                            <Button shape="circle" icon={<EditOutlined />} />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <CategoryListHeader />

            <Card bodyStyle={{ padding: 0 }} className="shadow-sm">
                <Table
                    rowKey="id"
                    columns={columns as any}
                    dataSource={categories}
                    loading={loading}
                    locale={{ emptyText: <Empty description="Không có danh mục" /> }}
                    scroll={{ x: 980, y: 520 }}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total: categories.length,
                        showSizeChanger: false,
                        onChange: (p) => setCurrentPage(p),
                    }}
                />
            </Card>
        </div>
    );
}
