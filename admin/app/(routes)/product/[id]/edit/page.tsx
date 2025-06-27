"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

import ImageDrop from "@/app/components/product/edit/ImageDrop";
import Form from "@/app/components/product/edit/Form";
import ActionButtons from "@/app/components/product/edit/ActionButtons";
import { Product } from "@/types/product";

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

  // ✅ Popup state
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");

  // ✅ Show popup with type
  const handleShowPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  useEffect(() => {
    const fetchUserAndProduct = async () => {
      try {
        const token = Cookies.get("authToken");
        if (!token) throw new Error("Chưa đăng nhập");

        const userRes = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Lỗi lấy thông tin user");
        const userData = await userRes.json();

        const shopId = userData?.shop?.id;
        if (!shopId) throw new Error("User chưa có shop");

        const productRes = await fetch(`${API_BASE_URL}/shop/products/${id}/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!productRes.ok) throw new Error("Không tìm thấy sản phẩm hoặc không có quyền");

        const data = await productRes.json();
        const p = data.product;

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
        setFormValues({
          name: p.name,
          price: p.price,
          sale_price: p.sale_price || 0,
          stock: p.stock || 0,
          description: p.description || "",
        });
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        router.push("/product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUserAndProduct();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải sản phẩm...</div>;
  if (!product) return <div className="p-6 text-red-500">Không tìm thấy sản phẩm.</div>;

  return (
    <form className="p-6 space-y-9 flex justify-center relative">
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

          <ActionButtons
            productId={product.id}
            images={selectedImages}
            optionValues={optionValues}
            categoryId={category}
            formValues={formValues}
            onPopup={handleShowPopup}
          />
        </div>
      </div>

      {/* ✅ Popup đẹp ở góc phải */}
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
    </form>
  );
}
