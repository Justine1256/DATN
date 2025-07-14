"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import ImageDrop from "@/app/components/product/edit/ImageDrop";
import Form from "@/app/components/product/edit/Form";
import ActionButtons from "@/app/components/product/edit/ActionButtons";
import { Product } from "@/types/product";
import VariantModal from "@/app/components/product/edit/VariantModal";

interface Variant {
  value1: string;
  value2: string;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string[];
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string }[]>([]);
  const [category, setCategory] = useState("");
  const [optionValues, setOptionValues] = useState({
    option1: "",
    value1: "",
    option2: "",
    value2: "",
  });
  const [formValues, setFormValues] = useState({
    name: "",
    price: 0,
    sale_price: 0,
    stock: 0,
    description: "",
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");

  const handleShowPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = Cookies.get("authToken");
        if (!token) throw new Error("Chưa đăng nhập");

        const res = await fetch(`${API_BASE_URL}/shop/products/${id}/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        
        if (!res.ok) throw new Error("Không tìm thấy sản phẩm hoặc không có quyền");

        const data = await res.json();
        const p = data.product;
        console.log("variant",p)
        setProduct(p);
        setCategory(p.category_id?.toString() || "");
        setSelectedImages(
          (Array.isArray(p.image) ? p.image : [p.image || ""]).map((url: string, idx: number) => ({
            id: String(idx),
            url,
          }))
        );
        setOptionValues({
          option1: p.option1 || "",
          value1: p.value1 || "",
          option2: p.option2 || "",
          value2: p.value2 || "",
        });
        if (Array.isArray(p.variants) && p.variants.length > 0) {
  const v = p.variants[0]; // Lấy biến thể đầu tiên làm đại diện
  setFormValues({
    name: p.name,
    price: v.price,
    sale_price: v.sale_price || 0,
    stock: v.stock || 0,
    description: p.description || "",
  });
} else {
  setFormValues({
    name: p.name,
    price: p.price,
    sale_price: p.sale_price || 0,
    stock: p.stock || 0,
    description: p.description || "",
  });
}

        setVariants(
  Array.isArray(p.variants)
    ? p.variants
        .filter((v: any) => v.value1 && v.value2 && typeof v.price === "number")
        .map((v: any) => ({
          value1: v.value1,
          value2: v.value2,
          price: v.price,
          sale_price: v.sale_price || 0,
          stock: v.stock || 0,
          image: Array.isArray(v.image) ? v.image : [],
        }))
    : []
);

      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        router.push("/product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải sản phẩm...</div>;
  if (!product) return <div className="p-6 text-red-500">Không tìm thấy sản phẩm.</div>;

  return (
    <form className="space-y-9 flex justify-center relative">
      <div className="w-full max-w-4xl">
        <h1 className="text-xl font-bold text-[#db4444] mb-4">
          Chỉnh sửa sản phẩm (ID: {id})
        </h1>

        <div className="space-y-6">
          <ImageDrop images={selectedImages} setImages={setSelectedImages} />

          <Form
            images={selectedImages}
            defaultValues={product}
            category={category}
            setCategory={setCategory}
            onOptionsChange={setOptionValues}
            onFormChange={setFormValues}
          />

          {/* Biến thể */}
          <div className="space-y-4 mt-6">
            <h3 className="text-base font-medium text-gray-700">Biến thể</h3>
            <button
              type="button"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                setEditingVariant(null);
                setShowVariantModal(true);
              }}
            >
              + Thêm biến thể
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {variants.map((v, i) => (
                <div key={i} className="border rounded p-3 relative">
                  <div className="text-sm text-gray-700 mb-1">
                    <strong>{v.value1}</strong> / {v.value2}
                  </div>
                  <div className="text-xs text-gray-500">
                    Giá: {v.price.toLocaleString()} | Tồn: {v.stock}
                  </div>
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-blue-500 text-xs underline"
                    onClick={() => {
                      setEditingVariant(v);
                      setShowVariantModal(true);
                    }}
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ActionButtons
            productId={product.id}
            images={selectedImages}
            optionValues={optionValues}
            categoryId={category}
            formValues={formValues}
            variants={variants}
            onPopup={handleShowPopup}
          />
        </div>
      </div>

      {popupMessage && (
        <div
          className={`fixed top-6 right-6 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-in
            ${popupType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
        >
          {popupType === "success" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium">{popupMessage}</span>
        </div>
      )}

      {showVariantModal && (
        <VariantModal
          onClose={() => {
            setEditingVariant(null);
            setShowVariantModal(false);
          }}
          onSave={(newVariant) => {
            if (editingVariant) {
              setVariants((prev) =>
                prev.map((v) =>
                  v.value1 === editingVariant.value1 && v.value2 === editingVariant.value2
                    ? newVariant
                    : v
                )
              );
            } else {
              setVariants((prev) => [...prev, newVariant]);
            }
            setShowVariantModal(false);
          }}
          initialData={editingVariant || undefined}
        />
      )}
    </form>
  );
}
