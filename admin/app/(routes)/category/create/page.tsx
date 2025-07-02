"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

import CateImageDrop from "@/app/components/category/create/ImageDrop";
import CategoryInfoForm from "@/app/components/category/create/Form";
import ActionButtons from "@/app/components/category/create/ActionButtons";
import { API_BASE_URL } from "@/utils/api";

interface Category {
    id: string;
    shop_id: string;
    parent_id?: string | null;
    name: string;
    slug: string;
    description: string;
    image: string;
    status: string;
}

export default function CreateCategoryPage() {
    const [token, setToken] = useState<string | null>(null);
    const [shopId, setShopId] = useState<string | null>(null);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<Omit<Category, "id" | "status">>({
        shop_id: "",
        parent_id: null,
        name: "",
        slug: "",
        description: "",
        image: "", // gửi rỗng hoặc URL để không bị validation Laravel fail
    });

    // ✅ Lấy token
    useEffect(() => {
        const tk = Cookies.get("authToken");
        setToken(tk || null);
    }, []);

    // ✅ Lấy shop_id
    useEffect(() => {
        if (!token) return;
        axios
            .get(`${API_BASE_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const sid = res.data.shop?.id;
                setShopId(sid);
                setFormData((prev) => ({ ...prev, shop_id: sid }));
            })
            .catch((err) => console.error("❌ Lỗi lấy shop_id:", err));
    }, [token]);

    // ✅ Lấy danh mục cha shop + admin
    useEffect(() => {
        if (!token || !shopId) return;

        const fetchAllCategories = async () => {
            try {
                const [shopRes, adminRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/shop/categories/${shopId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API_BASE_URL}/admin/categories`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const shopData = Array.isArray(shopRes.data.categories)
                    ? shopRes.data.categories
                    : [];
                const adminData = Array.isArray(adminRes.data)
                    ? adminRes.data
                    : adminRes.data.data || [];

                setParentCategories([...shopData, ...adminData]);
            } catch (err) {
                console.error("❌ Lỗi lấy danh mục:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCategories();
    }, [token, shopId]);

    // ✅ Xử lý thay đổi form
    const handleSetData = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // ✅ Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId || !token) return;

        if (!formData.parent_id) {
            await Swal.fire({
                icon: "warning",
                title: "Thiếu danh mục cha",
                text: "Vui lòng chọn danh mục cha.",
                confirmButtonColor: "#db4444",
            });
            return;
        }

        console.log("🚀 Data gửi lên:", { ...formData, shop_id: shopId });

        setSubmitting(true);
        try {
            await axios.post(
                `${API_BASE_URL}/shop/categories`,
                {
                    ...formData,
                    shop_id: shopId,
                    image: formData.image || "", // bảo vệ
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSuccess(true);
            await Swal.fire({
                icon: "success",
                title: "Tạo thành công!",
                text: "Danh mục đã được thêm.",
                confirmButtonColor: "#db4444",
            });
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                console.error("❌ Axios error:", err.response?.data || err.message);
                await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text:
                        err.response?.data?.error ||
                        err.response?.data?.message ||
                        "Không thể tạo danh mục.",
                    confirmButtonColor: "#db4444",
                });
            } else {
                console.error("❌ Unknown error:", err);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return <div className="p-6 text-center text-gray-600">Loading...</div>;

    return (
        <form
            onSubmit={handleSubmit}
            className="p-6 space-y-9 flex justify-center"
        >
            <div className="w-full max-w-4xl">
                {/* <h1 className="text-xl font-bold text-gray-800 mb-4">
                    Tạo mới danh mục
                </h1> */}

                <div className="space-y-6 mt-8">
                    {/* ✅ Thêm lại ảnh */}
                    <CateImageDrop
                        image={formData.image}
                        setImage={(url) => handleSetData("image", url)}
                    />

                    <CategoryInfoForm
                        data={formData}
                        setData={handleSetData}
                        categories={parentCategories}
                    />

                    <ActionButtons
                        loading={submitting}
                        success={success}
                        submitLabel="Tạo mới"
                    />
                </div>
            </div>
        </form>
    );
}
