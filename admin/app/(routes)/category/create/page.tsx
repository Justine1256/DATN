"use client";

import { useEffect, useState, useCallback } from "react";

import Cookies from "js-cookie";
import { CategoryRowSkeleton } from "../../../components/loading/loading";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/utils/api";
import CategoryListHeader from "../../../components/category/list/Header";
import Pagination from "../../../components/category/list/Pagination";
import CategoryRow from "../../../components/category/list/Row";


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
    const [categories, setCategories] = useState<LocalCategory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 4;

    // ✅ Fetch danh mục
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const token = Cookies.get("authToken");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/shop/categories`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Lỗi khi lấy danh mục");

            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Fetch sản phẩm
    const fetchProducts = useCallback(async () => {
        try {
            const token = Cookies.get("authToken");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/shop/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("🧪 DEBUG FETCH SẢN PHẨM:", res);
            if (!res.ok) throw new Error("Lỗi khi lấy sản phẩm");

            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
        }
    }, []);

    // ✅ Đếm số sản phẩm thuộc mỗi danh mục
    const getProductCountForCategory = (categoryId: string) => {
        if (!Array.isArray(products)) return 0;
        return products.filter((p) => p.category_id === categoryId).length;
    };

    // ✅ Hàm xoá danh mục
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Bạn chắc chắn muốn xoá?",
            text: "Thao tác này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e53e3e",
            cancelButtonColor: "#d1d5db",
            confirmButtonText: "Vâng, xoá đi",
            cancelButtonText: "Huỷ",
            reverseButtons: true,
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const token = Cookies.get("authToken");

                    console.log("🧪 DEBUG XOÁ:", {
                        id,
                        token,
                        deleteUrl: `${API_BASE_URL}/shop/categories/${id}`,
                    });

                    if (!token) {
                        Swal.showValidationMessage("Không tìm thấy token.");
                        return false;
                    }

                    const res = await fetch(`${API_BASE_URL}/shop/categories/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        Swal.showValidationMessage(errData.message || "Xoá thất bại");
                        return false;
                    }

                    return true;
                } catch (error) {
                    Swal.showValidationMessage("Không thể xoá sản phẩm");
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading(),
        });

        if (result.isConfirmed) {
            await Swal.fire({
                icon: "success",
                title: "Đã xoá!",
                text: "Danh mục đã được xoá thành công.",
                timer: 1500,
                showConfirmButton: false,
            });
            fetchCategories();
            fetchProducts();
        }
    };

    // ✅ Phân trang
    const totalPages = Math.ceil(categories.length / categoriesPerPage);
    const startIndex = (currentPage - 1) * categoriesPerPage;
    const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);


    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [fetchCategories, fetchProducts]);

    return (
        <div className="p-6">
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
                                onDelete={handleDelete}
                            />
                        ))}
                </tbody>
            </table>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
}
