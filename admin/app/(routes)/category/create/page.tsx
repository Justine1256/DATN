"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import CateImageDrop from "@/app/components/category/create/ImageDrop";
import CategoryInfoForm from "@/app/components/category/create/Form";
import ActionButtons from "@/app/components/category/create/ActionButtons";

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
        <form className="p-6 space-y-9 flex justify-center">
            <div className="w-full max-w-4xl">
                <h1 className="text-xl font-bold text-gray-800 mb-4">
                    Edit Category - ID: {formData.id}
                </h1>

                <div className="space-y-6 mt-8">
                    <CateImageDrop
                        image={formData.image}
                        setImage={(url) => handleSetData("image", url)}
                    />

                    <CategoryInfoForm data={formData} setData={handleSetData} />

                    <ActionButtons />
                </div>
            </div>
        </form>
    );
}
