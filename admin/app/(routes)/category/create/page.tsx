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
    const [formData, setFormData] = useState<Omit<Category, "id" | "status">>({
        shop_id: "",
        parent_id: null,
        name: "",
        slug: "",
        description: "",
        image: "/placeholder.png",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // ✅ Lấy token
    useEffect(() => {
        const tk = Cookies.get("authToken");
        setToken(tk || null);
    }, []);

    // ✅ Lấy shop_id
    useEffect(() => {
        if (!token) return;
        axios.get(`${API_BASE_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                const sid = res.data.shop?.id;
                setShopId(sid);
                setFormData((prev) => ({ ...prev, shop_id: sid }));
                console.log("🚀 shop_id:", sid);
            })
            .catch(err => console.error("❌ Lỗi lấy user:", err));
    }, [token]);

    // ✅ Lấy danh mục cha shop
    useEffect(() => {
        if (!token || !shopId) return;
        axios.get(`${API_BASE_URL}/shop/categories/${shopId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                console.log("📌 categories shop:", res.data);
                setParentCategories((prev) => [
                    ...prev,
                    ...(Array.isArray(res.data.categories) ? res.data.categories : [])
                ]);
            })
            .catch(err => console.error("❌ Lỗi lấy categories shop:", err))
            .finally(() => setLoading(false));
    }, [token, shopId]);

    // ✅ Lấy danh mục cha admin
    useEffect(() => {
        if (!token) return;
        axios.get(`${API_BASE_URL}/category`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                console.log("📌 categories admin:", res.data);
                setParentCategories((prev) => [
                    ...prev,
                    ...(Array.isArray(res.data) ? res.data : res.data.data || [])
                ]);
            })
            .catch(err => console.error("❌ Lỗi lấy categories admin:", err));
    }, [token]);

    const handleSetData = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId || !token) return;

        // ✅ Bắt buộc chọn danh mục cha
        if (!formData.parent_id) {
            await Swal.fire({
                icon: "warning",
                title: "Thiếu danh mục cha",
                text: "Vui lòng chọn danh mục cha trước khi tạo.",
                confirmButtonColor: "#db4444"
            });
            return;
        }

        console.log("🚀 Data gửi lên:", { ...formData, shop_id: shopId });

        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/shop/categories`, {
                ...formData,
                shop_id: shopId,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess(true);
            console.log("✅ Tạo category thành công");
            await Swal.fire({
                icon: "success",
                title: "Thành công!",
                text: "Danh mục đã được tạo.",
                confirmButtonColor: "#db4444"
            });
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                console.error("❌ Axios error:", err.response?.data || err.message);
                await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: err.response?.data?.error || "Không thể tạo danh mục.",
                    confirmButtonColor: "#db4444"
                });
            } else {
                console.error("❌ Unknown error:", err);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-9 flex justify-center">
            <div className="w-full max-w-4xl">
                <h1 className="text-xl font-bold text-gray-800 mb-4">
                    Tạo mới danh mục
                </h1>

                <div className="space-y-6 mt-8">
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
