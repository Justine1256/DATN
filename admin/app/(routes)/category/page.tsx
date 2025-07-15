"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { CategoryRowSkeleton } from "../../components/loading/loading";
import { API_BASE_URL } from "@/utils/api";
import CategoryListHeader from "../../components/category/list/Header";
import Pagination from "../../components/category/list/Pagination";
import CategoryRow from "../../components/category/list/Row";

type LocalCategory = {
    id: string;
    name: string;
    image: string | null;
    priceRange?: string;
    slug?: string;
    description?: string;
    status?: string;
    parent_id?: string | null;
    parent?: { name: string } | null;
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
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 10;

    useEffect(() => {
        const tk = Cookies.get("authToken");
        setToken(tk || null);
    }, []);

    useEffect(() => {
        if (!token) return;
        const fetchShopId = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Không lấy được user");
                const data = await res.json();
                const sid = data.shop?.id;
                setShopId(sid);
            } catch (err) {
                console.error("❌ Lỗi lấy shop id:", err);
            }
        };
        fetchShopId();
    }, [token]);

    const fetchCategories = useCallback(async () => {
        if (!token || !shopId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/shop/categories/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Lỗi khi lấy danh mục");
            const data = await res.json();
            setCategories(Array.isArray(data.categories) ? data.categories : []);
        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    }, [token, shopId]);

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/shop/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
        }
    }, [token]);

    const getProductCountForCategory = (categoryId: string) => {
        return products.filter((p) => p.category_id === categoryId).length;
    };

    const totalPages = Math.ceil(categories.length / categoriesPerPage);
    const startIndex = (currentPage - 1) * categoriesPerPage;
    const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

    useEffect(() => {
        if (!shopId) return;
        fetchCategories();
        fetchProducts();
    }, [shopId, fetchCategories, fetchProducts]);

    return (
        <div className="flex flex-col relative">
            <CategoryListHeader />
            <div className="flex-1 flex flex-col gap-8">
                <div className="h-[600px] border border-gray-200 rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                                <th className="py-2 px-3 w-1/5">Danh mục</th>
                                <th className="py-2 px-3 w-1/5">Mô tả</th>
                                <th className="py-2 px-3 w-1/5 text-center">Số SP</th>
                                <th className="py-2 px-3 w-1/5 text-center">Trạng thái</th>
                                <th className="py-2 px-3 w-1/5">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: categoriesPerPage }).map((_, i) => (
                                    <CategoryRowSkeleton key={i} />
                                ))
                                : paginatedCategories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        productCount={getProductCountForCategory(category.id)}
                                    />
                                ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            </div>
        </div>
    );
      
    
}
