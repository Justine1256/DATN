"use client";

import React from "react";
import dynamic from "next/dynamic";

// Load CKEditor chỉ khi client render (Next.js)
const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface CategoryInfoFormProps {
  data: any;
  setData: (field: string, value: string) => void;
}

export default function CategoryInfoForm({ data, setData }: CategoryInfoFormProps) {
  return (
    <div className="space-y-6">
      {/* THÔNG TIN DANH MỤC */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Thông tin danh mục
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục
            </label>
            <input
              type="text"
              value={data.name || ""}
              onChange={(e) => setData("name", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
              placeholder="Nhập tên danh mục"
            />
          </div>

          {/* Người tạo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người tạo
            </label>
            <select
              value={data.createdBy || ""}
              onChange={(e) => setData("createdBy", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
            >
              <option value="">Chọn</option>
              <option value="Admin">Admin</option>
              <option value="Seller">Seller</option>
            </select>
          </div>

          {/* Tồn kho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tồn kho
            </label>
            <input
              type="number"
              value={data.stock || ""}
              onChange={(e) => setData("stock", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
              placeholder="VD: 1000"
            />
          </div>

          {/* Tag ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag ID
            </label>
            <input
              type="text"
              value={data.id || ""}
              onChange={(e) => setData("id", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
              placeholder="VD: FS1234"
            />
          </div>
        </div>

        {/* Mô tả - CKEditor */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả chi tiết
          </label>
          <div className="border border-gray-300 rounded bg-white p-2">
            <CKEditor
              editor={ClassicEditor}
              data={data.description || ""}
              config={{
                toolbar: [
                  "heading", "|",
                  "bold", "italic", "underline", "|",
                  "bulletedList", "numberedList", "|",
                  "undo", "redo",
                ],
              }}
              onChange={(_, editor) => {
                const content = editor.getData();
                setData("description", content);
              }}
            />
          </div>
        </div>
      </div>

      {/* TỐI ƯU SEO */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Tối ưu SEO
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={data.metaTitle || ""}
              onChange={(e) => setData("metaTitle", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
              placeholder="Tiêu đề SEO"
            />
          </div>

          {/* Meta Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Keyword
            </label>
            <input
              type="text"
              value={data.metaKeyword || ""}
              onChange={(e) => setData("metaKeyword", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-gray-800"
              placeholder="fashion, áo sơ mi..."
            />
          </div>
        </div>

        {/* Meta Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <textarea
            value={data.metaDescription || ""}
            onChange={(e) => setData("metaDescription", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 p-2 rounded text-gray-800"
            placeholder="Mô tả xuất hiện trên Google"
          />
        </div>
      </div>
    </div>
  );
}
