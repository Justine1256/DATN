"use client";

import Image from "next/image";

interface Props {
  image: string;
  title: string;
  createdBy: string;
  stock: number;
  id: string;
}

export default function CategoryPreviewCard({
  image,
  title,
  createdBy,
  stock,
  id,
}: Props) {
  return (
    <div className="inline-block align-top w-full max-w-sm">
      <div className="bg-white border border-gray-200 p-4 rounded shadow-sm">
        {/* Ảnh */}
        <div className="bg-gray-100 rounded p-2 flex justify-center">
          <Image
            src={image || "/placeholder.png"}
            width={200}
            height={200}
            alt="category"
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Tiêu đề */}
        <h2 className="text-lg font-semibold text-gray-800 mt-4">
          {title}
        </h2>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700 mt-2">
          <div>
            <p className="text-gray-500">Created By :</p>
            <p className="font-semibold">{createdBy}</p>
          </div>
          <div>
            <p className="text-gray-500">Stock :</p>
            <p className="font-semibold">{stock}</p>
          </div>
          <div>
            <p className="text-gray-500">ID :</p>
            <p className="font-semibold">{id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
