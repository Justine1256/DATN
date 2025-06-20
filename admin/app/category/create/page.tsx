"use client";

import ActionButtons from "@/app/components/categories/create/ActionButtons";
import CategoryInfoForm from "@/app/components/categories/create/Form";
import CateImageDrop from "@/app/components/categories/create/ImageDrop";
import CategoryPreviewCard from "@/app/components/categories/create/PreviewCard";
import { useParams } from "next/navigation";
import { useState } from "react";


// ✅ Dữ liệu giả category
const mockCategories = [
  {
    id: "FS16276",
    title: "Fashion Men , Women & Kid's",
    image: "/images/categories/fashion.png",
    createdBy: "Seller",
    stock: 46233,
    description:
      "Aurora Fashion has once again captivated fashion enthusiasts with its latest collection, seamlessly blending elegance with comfort in a range of exquisite designs.",
    metaTitle: "Fashion Brand",
    metaKeyword: "fashion",
    metaDescription: "Type description",
  },
];

export default function EditCategoryMockPage() {
  const id = useParams()?.id as string;
  const data = mockCategories.find((c) => c.id === id);

  const [formData, setFormData] = useState({
    id: data?.id || "",
    title: data?.title || "",
    image: data?.image || "/placeholder.png",
    createdBy: data?.createdBy || "",
    stock: data?.stock || 0,
    description: data?.description || "",
    metaTitle: data?.metaTitle || "",
    metaKeyword: data?.metaKeyword || "",
    metaDescription: data?.metaDescription || "",
  });

  const handleSetData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Category Edit (ID: {formData.id})
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <CategoryPreviewCard
          image={formData.image}
          title={formData.title}
          createdBy={formData.createdBy}
          stock={formData.stock}
          id={formData.id}
        />

        <div className="xl:col-span-2 space-y-6">
          <CateImageDrop image={formData.image} setImage={(url) => handleSetData("image", url)} />

          <CategoryInfoForm data={formData} setData={handleSetData} />

          <ActionButtons />
        </div>
      </div>
    </div>
  );
}
