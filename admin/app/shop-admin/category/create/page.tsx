"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

// import CateImageDrop from "@/app/components/shop-admin/category/create/ImageDrop";
import CategoryInfoForm from "@/app/components/shop-admin/category/create/Form";
import ActionButtons from "@/app/components/shop-admin/category/create/ActionButtons";
import { API_BASE_URL } from "@/utils/api";

interface Category {
    id: string;
    shop_id: string;
    parent_id: string | null; // bỏ dấu ? để không có undefined
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

    const [formData, setFormData] = useState<Omit<Category, "id" | "status">>({
        shop_id: "",
        parent_id: null,
        name: "",
        slug: "",
        description: "",
        image: "",
    });

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');

    // ✅ lấy token
    useEffect(() => {
        const tk = Cookies.get("authToken");
        setToken(tk || null);
    }, []);

    // ✅ lấy shop_id
    useEffect(() => {
        if (!token) return;
        axios.get(`${API_BASE_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                const sid = res.data.shop?.id;
                setShopId(sid);
                setFormData((prev) => ({ ...prev, shop_id: sid }));
            })
            .catch((err) => console.error("❌ Lỗi lấy shop_id:", err));
    }, [token]);

    // ✅ lấy danh mục cha shop + admin
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
                    ? shopRes.data.categories : [];

                const adminRawData = Array.isArray(adminRes.data)
                    ? adminRes.data
                    : adminRes.data.data || [];

                const adminData = adminRawData.map((cate: Category) => ({
                    ...cate,
                    name: cate.parent_id === null ? `(Mặc định) ${cate.name}` : cate.name
                }));

                setParentCategories([...shopData, ...adminData]);
            } catch (err) {
                console.error("❌ Lỗi lấy danh mục:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCategories();
    }, [token, shopId]);

    // ✅ xử lý thay đổi form
    const handleSetData = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // ✅ submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId || !token) return;

        if (!formData.parent_id) {
            setPopupType('error');
            setPopupMessage('Vui lòng chọn danh mục cha.');
            setShowPopup(true);
            return;
        }


        setSubmitting(true);
        try {
            await axios.post(
                `${API_BASE_URL}/shop/categories`,
                {
                    ...formData,
                    shop_id: shopId,
                    parent_id: formData.parent_id ?? null, // ép null an toàn
                    image: formData.image || "",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setPopupType('success');
            setPopupMessage('Tạo danh mục thành công!');
            setShowPopup(true);

            // reset form
            setFormData({
                shop_id: shopId,
                parent_id: null,
                name: "",
                slug: "",
                description: "",
                image: "",
            });

        } catch (err: any) {
            console.error("❌ Lỗi:", err.response?.data || err.message);
            setPopupType('error');
            setPopupMessage(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Không thể tạo danh mục."
            );
            setShowPopup(true);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (showPopup) {
            const timer = setTimeout(() => setShowPopup(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showPopup]);

    if (loading)
        return <div className="p-6 text-center text-gray-600">Loading...</div>;

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="p-6 space-y-9 flex justify-center"
            >
                <div className="w-full max-w-4xl">
                    <div className="space-y-6 mt-8">
                        {/* <CateImageDrop
                            image={formData.image}
                            setImage={(url) => handleSetData("image", url)}
                        /> */}

                        <CategoryInfoForm
                            data={formData}
                            setData={handleSetData}
                            categories={parentCategories}
                        />

                        <ActionButtons
                            loading={submitting}
                            success={popupType === 'success'}
                            submitLabel="Tạo mới"
                        />
                    </div>
                </div>
            </form>

            {showPopup && (
                <div
                    className={`fixed top-6 right-6 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-in ${popupType === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                >
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                                popupType === "success"
                                    ? "M5 13l4 4L19 7"
                                    : "M6 18L18 6M6 6l12 12"
                            }
                        />
                    </svg>
                    <span className="text-sm font-medium">{popupMessage}</span>
                </div>
            )}
        </>
    );
}
