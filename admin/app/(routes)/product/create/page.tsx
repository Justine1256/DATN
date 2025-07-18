"use client";

import { useState } from "react";
import ImageDrop from "@/app/components/product/create/ImageDrop";
import ProductInfoForm from "@/app/components/product/create/Form";
import VariantModal from "@/app/components/product/create/VariantModal";
import ActionButtons from "@/app/components/product/create/ActionButtons";
import { API_BASE_URL } from "@/utils/api";
import { useAuth } from "@/app/AuthContext";
import Cookies from "js-cookie";

export default function AddProductPage() {
    const [images, setImages] = useState<{ id: string; url: string }[]>([]);
    const [category, setCategory] = useState("fashion");
    const [option1Values, setOption1Values] = useState<string[]>([]);
    const [option2Values, setOption2Values] = useState<string[]>([]);
    const [variants, setVariants] = useState<any[]>([]);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [productOptions, setProductOptions] = useState({
        option1: "",
        value1: "",
        option2: "",
        value2: "",
    });

    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<"success" | "error">("success");
    const [showPopup, setShowPopup] = useState(false);

    const { user } = useAuth();

    const handlePopup = (msg: string, type: "success" | "error") => {
        setPopupMessage(msg);
        setPopupType(type);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const payload: any = {
            name: formData.get("name"),
            category_id: parseInt(formData.get("category_id") as string, 10),
            description: formData.get("description"),
            price: parseFloat(formData.get("price") as string),
            sale_price: parseFloat(formData.get("sale_price") as string),
            stock: parseInt(formData.get("stock") as string, 10),
            option1: productOptions.option1,
            value1: productOptions.value1,
            option2: productOptions.option2,
            value2: productOptions.value2,
            image: images.map((img) => img.url),
            variants,
        };

        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/shop/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                handlePopup("Lỗi: " + text, "error");
                return;
            }

            handlePopup("Thêm sản phẩm thành công!", "success");
        } catch (error) {
            handlePopup("Gửi sản phẩm thất bại.", "error");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-9 flex justify-center relative"
        >
            <div className="w-full max-w-4xl">
                <div className="space-y-6">
                    <ImageDrop images={images} setImages={setImages} />
                    <ProductInfoForm
                        images={images}
                        onOptionsChange={(opts) => setProductOptions(opts)}
                    />

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => {
                                const { option1, value1, option2, value2 } = productOptions;
                                if (!option1.trim() || !value1.trim()) {
                                    handlePopup("Vui lòng nhập Option 1 và Value 1", "error");
                                    return;
                                }
                                if (option2.trim() && !value2.trim()) {
                                    handlePopup("Bạn đã nhập Option 2 nhưng thiếu Value 2", "error");
                                    return;
                                }
                                setShowVariantModal(true);
                                setEditingIndex(null);
                            }}
                            className="px-4 py-2 rounded border border-[#db4444] text-[#db4444] font-medium hover:bg-[#ffeaea] transition-colors duration-200"
                        >
                            Thêm biến thể
                        </button>

                        <div className="space-y-2">
                            {variants.length === 0 && (
                                <p className="text-sm text-gray-500">Chưa có biến thể nào.</p>
                            )}
                            {variants.map((variant, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-100 rounded border"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">
                                            {variant.value1} / {variant.value2}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Giá: {variant.price.toLocaleString()}đ
                                            {variant.sale_price > 0 && (
                                                <> - KM: {variant.sale_price.toLocaleString()}đ</>
                                            )}{" "}
                                            - SL: {variant.stock}
                                        </p>
                                    </div>
                                    {variant.image?.length > 0 && (
                                        <div className="flex gap-1 overflow-x-auto">
                                            {variant.image.slice(0, 3).map((img: string, i: number) => (
                                                <img
                                                    key={i}
                                                    src={img}
                                                    alt={`img-${i}`}
                                                    className="w-12 h-12 object-cover rounded border"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingIndex(index);
                                                setShowVariantModal(true);
                                            }}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVariants((prev) => prev.filter((_, i) => i !== index))
                                            }
                                            className="text-red-500 hover:underline"
                                        >
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {showVariantModal && (
                        <VariantModal
                            initialData={editingIndex !== null ? variants[editingIndex] : undefined}
                            onClose={() => {
                                setShowVariantModal(false);
                                setEditingIndex(null);
                            }}
                            onSave={(variant) => {
                                if (editingIndex !== null) {
                                    setVariants((prev) =>
                                        prev.map((v, i) => (i === editingIndex ? variant : v))
                                    );
                                } else {
                                    setVariants((prev) => [...prev, variant]);
                                }
                                setShowVariantModal(false);
                                setEditingIndex(null);
                            }}
                            disableValue1={!productOptions.option1.trim()}
                            disableValue2={!productOptions.option2.trim()}
                        />
                    )}

                    <ActionButtons />
                </div>
            </div>

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
        </form>
    );
}
