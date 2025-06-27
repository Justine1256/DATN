"use client";

import React from "react";
import dynamic from "next/dynamic";

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
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Thông tin danh mục</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nhập thông tin chi tiết về danh mục sản phẩm
        </p>
      </div>

      {/* Form content */}
      <div className="p-6 space-y-8">
        {/* Thông tin cơ bản */}
        <div>
          <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên danh mục <span className="text-[#db4444]">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên danh mục"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Người tạo
              </label>
              <select
                value={data.createdBy}
                onChange={(e) => setData("createdBy", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] bg-white transition-all"
              >
                <option value="">Chọn người tạo</option>
                <option value="Admin">Admin</option>
                <option value="Seller">Seller</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                value={data.stock}
                onChange={(e) => setData("stock", e.target.value)}
                placeholder="Nhập số lượng"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tag ID
              </label>
              <input
                type="text"
                value={data.id}
                onChange={(e) => setData("id", e.target.value)}
                placeholder="VD: CTGR123"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mô tả với CKEditor */}
        <div>
          <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Mô tả danh mục
          </h3>
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <CKEditor
              editor={ClassicEditor}
              data={data.description}
              onChange={(_, editor) => {
                const value = editor.getData();
                setData("description", value);
              }}
              config={{
                toolbar: [
                  "heading", "|",
                  "bold", "italic", "underline", "|",
                  "bulletedList", "numberedList", "|",
                  "blockQuote", "insertTable", "|",
                  "undo", "redo",
                ],
                placeholder: "Nhập mô tả chi tiết cho danh mục...",
              }}
            />
          </div>
        </div>

        {/* Meta SEO */}
        <div>
          <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Tối ưu SEO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={data.metaTitle}
                onChange={(e) => setData("metaTitle", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta Keyword
              </label>
              <input
                type="text"
                value={data.metaKeyword}
                onChange={(e) => setData("metaKeyword", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={data.metaDescription}
              onChange={(e) => setData("metaDescription", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
