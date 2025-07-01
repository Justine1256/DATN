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

    // ✅ Popup
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const handleShowPopup = (message: string) => {
        setPopupMessage(message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    useEffect(() => {
        const tk = Cookies.get("authToken");
        setToken(tk || null);
    }, []);

    // ✅ Lấy shop_id
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
                console.log("🚀 shop_id:", sid);
            } catch (err) {
                console.error("❌ Lỗi lấy shop id:", err);
            }
        };
        fetchShopId();
    }, [token]);

    // ✅ Fetch danh mục đúng shop_id
    const fetchCategories = useCallback(async () => {
        if (!token || !shopId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/shop/categories/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Lỗi khi lấy danh mục");
            const data = await res.json();
            console.log("📌 categories:", data);
            setCategories(Array.isArray(data.categories) ? data.categories : []);
            handleShowPopup("Đã tải danh mục thành công.");
        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    }, [token, shopId]);

    // ✅ Fetch sản phẩm
    const fetchProducts = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/shop/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Lỗi khi lấy sản phẩm");
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
        }
    }, [token]);

    // ✅ Đếm số sản phẩm
    const getProductCountForCategory = (categoryId: string) => {
        return products.filter((p) => p.category_id === categoryId).length;
    };

    // ✅ Phân trang
    const totalPages = Math.ceil(categories.length / categoriesPerPage);
    const startIndex = (currentPage - 1) * categoriesPerPage;
    const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

    // ✅ Gọi chỉ khi đã có shopId
    useEffect(() => {
        if (!shopId) return;
        fetchCategories();
        fetchProducts();
    }, [shopId, fetchCategories, fetchProducts]);

    return (
        <div className="p-6 relative">
            <CategoryListHeader />

            <table className="w-full text-sm text-left table-fixed">
                <thead>
                    <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                        <th className="py-2 px-3 w-1/5">Categories</th>
                        <th className="py-2 px-3 w-1/5">Description</th>
                        <th className="py-2 px-3 w-1/5 text-center">Product Count</th>
                        <th className="py-2 px-3 w-1/5 text-center">Status</th>
                        <th className="py-2 px-3 w-1/5">Action</th>
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

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
            />

            {showPopup && (
                <div className="fixed top-6 right-6 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-in">
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{popupMessage}</span>
                </div>
            )}
        </div>
    );
}
