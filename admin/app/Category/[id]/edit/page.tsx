"use client";

import ActionButtons from "@/app/components/Categories/edit/ActionButtons";
import CategoryInfoForm from "@/app/components/Categories/edit/Form";
import CateImageDrop from "@/app/components/Categories/edit/ImageDrop";
import CategoryPreviewCard from "@/app/components/Categories/edit/PreviewCard";
import { useParams } from "next/navigation";
import { useState } from "react";



// ✅ Dữ liệu giả category (mock)
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

export default function EditCategoryPage() {
  const { id } = useParams() as { id: string };
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
        Edit Category - ID: {formData.id}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Preview Card */}
        <CategoryPreviewCard
          image={formData.image}
          title={formData.title}
          createdBy={formData.createdBy}
          stock={formData.stock}
          id={formData.id}
        />

        {/* Form Area */}
        <div className="xl:col-span-2 space-y-6">
          <CateImageDrop
            image={formData.image}
            setImage={(url) => handleSetData("image", url)}
          />

          <CategoryInfoForm
            data={formData}
            setData={handleSetData}
          />

          <ActionButtons />
        </div>
      </div>
    </div>
  );
}
