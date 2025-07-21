"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Swal from "sweetalert2";
import { AiFillStar } from "react-icons/ai";
import { FiEye, FiEyeOff, FiEdit } from "react-icons/fi";

import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import ProductListHeader from "../../components/shop-admin/product/list/ListHeader";
import Pagination from "../../components/shop-admin/product/list/Pagination";
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
    const router = useRouter();
    const { user, isAuthReady } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
        if (!user?.shop?.id) return;

        try {
            setLoading(true);
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/shop/products/${user.shop.id}?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Fetch lỗi");

            const data = await res.json();
            const rawProducts = Array.isArray(data.products?.data) ? data.products.data : [];

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
                image: typeof p.image === "string" ? [p.image] : Array.isArray(p.image) ? p.image : [],
                option1: p.option1 ?? null,
                value1: p.value1 ?? null,
                option2: p.option2 ?? null,
                value2: p.value2 ?? null,
                status: p.status,
                created_at: p.created_at,
                updated_at: p.updated_at,
                deleted_at: p.deleted_at,
                size: typeof p.size === "string" ? p.size.split(",").map((s: string) => s.trim()) : [],
                category: p.category ?? null,
                rating: p.rating ? parseFloat(p.rating) : 0,
            }));

            setProducts(mapped);
            setTotalPages(data.products?.last_page || 1);
            setCurrentPage(data.products?.current_page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (productId: number, currentStatus: string) => {
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
           
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể cập nhật trạng thái sản phẩm.", "error");
        }
    };

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
                                <th className="py-2 px-3 text-center">Kho</th>
                                <th className="py-2 px-3">Danh mục con</th>
                                <th className="py-2 px-3 text-center">Đánh giá</th>
                                <th className="py-2 px-3 text-center">Trạng thái</th>
                                <th className="py-2 px-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)
                                : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">Không có sản phẩm nào.</td>
                                    </tr>
                                ) : products.map((product) => (
                                    <tr key={product.id} className="h-[80px] border-b border-gray-100 hover:bg-gray-50 text-gray-700 animate-fade-fast">
                                        <td className="py-2 px-3 align-middle">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={product.image?.[0] ? `${STATIC_BASE_URL}/${product.image[0]}` : `${STATIC_BASE_URL}/default-image.jpg`}
                                                    alt={product.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded object-cover shrink-0"
                                                />
                                                <div className="truncate">
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    <div className="text-xs text-gray-500">
                                                        {product.option1 && product.value1 && (
                                                            <div><span className="font-semibold">{product.option1}:</span> {product.value1}</div>
                                                        )}
                                                        {product.option2 && product.value2 && (
                                                            <div><span className="font-semibold">{product.option2}:</span> {product.value2}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 align-middle whitespace-nowrap">{product.price.toLocaleString()}</td>
                                        <td className="py-2 px-3 align-middle text-center">{product.stock}</td>
                                        <td className="py-2 px-3 align-middle whitespace-nowrap">
                                            {typeof product.category === "object" && product.category?.name
                                                ? product.category.name
                                                : typeof product.category === "string"
                                                    ? product.category
                                                    : "Không rõ"}
                                        </td>

                                        <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center gap-1 justify-center">
                                                {product.rating > 0 ? (
                                                    <>
                                                        <span className="text-sm font-medium">{(product.rating / 2).toFixed(1)}</span>
                                                        {[...Array(5)].map((_, i) => (
                                                            <AiFillStar key={i} className={`text-base ${i < Math.round(product.rating / 2) ? "text-yellow-400" : "text-gray-300"}`} />
                                                        ))}
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-[#db4444]">Chưa có đánh giá</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${product.status === "activated" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {product.status === "activated" ? "Hoạt động" : "Đã ẩn"}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 align-middle whitespace-nowrap">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(product.id, product.status)}
                                                    className={`p-2 rounded transition-colors ${product.status === "activated" ? "bg-red-100 hover:bg-red-200 text-red-600" : "bg-green-100 hover:bg-green-200 text-green-600"}`}
                                                    title={product.status === "activated" ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"}
                                                >
                                                    {product.status === "activated" ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/shop-admin/product/${product.id}/edit`)}
                                                    className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
                                                    title="Edit"
                                                >
                                                    <FiEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
            </div>

            {showPopup && (
                <div className="fixed top-6 right-6 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-in">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{popupMessage}</span>
                </div>
            )}
        </div>
    );
}
