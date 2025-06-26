"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import PreviewCard from "@/app/components/product/edit/PreviewCard";
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(`${API_BASE_URL}/shop/products/${id}/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data) throw new Error("Không tìm thấy sản phẩm");

        setProduct(data.product);
        setCategory(data.product.category_id?.toString() || "");
        setSelectedImages(
          (Array.isArray(data.product.image) ? data.product.image : [data.product.image || ""]).map(
            (url: string, idx: number) => ({ id: String(idx), url })
          )
        );
        setOptionValues({
          option1: data.product.option1 || "",
          value1: data.product.value1 || "",
          option2: data.product.option2 || "",
          value2: data.product.value2 || "",
        });
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
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Chỉnh sửa sản phẩm (ID: {id})</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <PreviewCard
          image={selectedImages[0]?.url || "/placeholder.png"}
          name={product.name}
          category={category}
          price={product.price}
          discount={product.sale_price || 0}
          sizes={product.size || []}
          colors={[]}
          isFashion={category === "fashion"}
        />

        <div className="xl:col-span-2 space-y-6">
          <ImageDrop
            images={selectedImages}
            setImages={setSelectedImages}
          />


          <Form
            images={selectedImages}
            defaultValues={product}
            category={category}
            setCategory={setCategory}
            onOptionsChange={setOptionValues}
          />

          <ActionButtons
            productId={product.id}
            images={selectedImages}
            optionValues={optionValues}
          />
        </div>
      </div>
    </div>
  );
}
