"use client";

import { useEffect, useState } from "react";
import ProductListHeader from "../../components/product/list/ListHeader";
import ProductRow from "../../components/product/list/Row";
import Pagination from "../../components/product/list/Pagination";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { useAuth } from "../../AuthContext";

const ProductRowSkeleton = () => (
    <tr className="border-b border-gray-100 animate-pulse">
        <td className="py-4 px-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div className="flex flex-col gap-1">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
        </td>
        <td className="py-4 px-3"><div className="h-4 w-16 bg-gray-300 rounded"></div></td>
        <td className="py-4 px-3"><div className="h-4 w-10 bg-gray-300 rounded"></div></td>
        <td className="py-4 px-3"><div className="h-4 w-24 bg-gray-300 rounded"></div></td>
        <td className="py-4 px-3"><div className="h-4 w-24 bg-gray-300 rounded"></div></td>
        <td className="py-4 px-3"><div className="h-4 w-12 bg-gray-300 rounded"></div></td>
        <td className="py-4 px-3 text-center">
            <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
        </td>
    </tr>
);

export default function ProductListPage() {
    const { user, isAuthReady } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ✅ popup custom
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const handleShowPopup = (message: string) => {
        setPopupMessage(message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    const categoriesMap = new Map<number, Category>();
    categories.forEach((c) => {
        categoriesMap.set(c.id, c);
        if (c.parent && c.parent.id) {
            categoriesMap.set(c.parent.id, c.parent);
        }
    });

    const fetchProducts = async (page = 1) => {
        if (!user?.shop?.id) {
            console.warn("Không có shop_id từ user");
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get("authToken");
            const res = await fetch(
                `${API_BASE_URL}/shop/products/${user.shop.id}?page=${page}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Lỗi fetch sản phẩm");

            const data = await res.json();
            const rawProducts = Array.isArray(data.products?.data) ? data.products.data : [];

            const mapped: Product[] = rawProducts.map((p: any): Product => {
                console.log("➡️ Product:", {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    parent: p.category?.parent,
                });
                return {
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
                    image: typeof p.image === "string" ? [p.image] : Array.isArray(p.image) ? p.image : [],
                    option1: p.option1 ?? null,
                    value1: p.value1 ?? null,
                    option2: p.option2 ?? null,
                    value2: p.value2 ?? null,
                    status: p.status,
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    deleted_at: p.deleted_at,
                    size: typeof p.size === "string" ? p.size.split(",").map((s: string) => s.trim()) : Array.isArray(p.size) ? p.size : [],
                    category: p.category ?? null,
                    rating: p.rating ? parseFloat(p.rating) : 0,
                }
            });
            

            setProducts(mapped);
            setTotalPages(data.products?.last_page || 1);
            setCurrentPage(data.products?.current_page || 1);

            // handleShowPopup(`Đã tải danh sách sản phẩm`);
        } catch (error) {
            console.error("Lỗi khi load sản phẩm:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => { /* giữ nguyên */ };

    const handleDelete = async (id: number) => { /* giữ nguyên */ };

    useEffect(() => {
        if (isAuthReady) {
            fetchCategories();
        }
    }, [isAuthReady]);

    useEffect(() => {
        if (isAuthReady && user?.shop?.id) {
            fetchProducts(currentPage);
        }
    }, [isAuthReady, user, currentPage]);

    return (
        <div className="flex flex-col relative">
            <ProductListHeader />
            <div className="flex-1 flex flex-col gap-8">
                <div className="h-[600px] border border-gray-200 rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                                <th className="py-2 px-3">Tên sản phẩm & Kích thước</th>
                                <th className="py-2 px-3">Giá</th>
                                <th className="py-2 px-3">Kho</th>
                                <th className="py-2 px-3">Danh mục con</th>
                                <th className="py-2 px-3">Đánh giá</th>
                                <th className="py-2 px-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody key={currentPage}>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        Không có sản phẩm nào.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        onDelete={handleDelete}
                                        categoriesMap={categoriesMap}
                                    />
                                  
                                ))
                            )}
                        </tbody>

                    </table>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
            </div>

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