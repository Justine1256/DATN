"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/utils/api";
import { Category } from "@/types/category";
import { useCKEditorConfig } from "../../ckeditor/CKEditorWrapper";

const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);

interface ProductFormProps {
  images: { id: string; url: string }[];
  onOptionsChange?: (opts: {
    option1: string;
    value1: string;
    option2: string;
    value2: string;
  }) => void;
}

export default function ProductForm({ images, onOptionsChange }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [option1, setOption1] = useState("");
  const [value1, setValue1] = useState("");
  const [option2, setOption2] = useState("");
  const [value2, setValue2] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const { ClassicEditor, editorConfig } = useCKEditorConfig();

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseInt(value) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  useEffect(() => {
    const fetchUserAndCategories = async () => {
      try {
        const token = Cookies.get("authToken");
        const userRes = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        const shopId = userData?.shop?.id;
        setShopId(shopId);

        const catRes = await fetch(`${API_BASE_URL}/shop/categories/${shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const catData = await catRes.json();
        const onlySubCategories = (catData.categories || []).filter(
          (cat: Category) => cat.parent_id !== null
        );
        setCategories(onlySubCategories);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        setPopupMessage("Lỗi khi tải danh mục!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCategories();
  }, []);

  useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange({ option1, value1, option2, value2 });
    }
  }, [option1, value1, option2, value2]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-[#db4444] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Đang tải danh mục...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin sản phẩm</h2>
          <p className="text-sm text-slate-500 mt-1">Nhập thông tin chi tiết về sản phẩm</p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Basic Info */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
              <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên sản phẩm <span className="text-[#db4444]">*</span>
                </label>
                <input
                  name="name"
                  placeholder="Nhập tên sản phẩm"
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Danh mục <span className="text-[#db4444]">*</span>
                </label>
                <select
                  name="category_id"
                  defaultValue=""
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all bg-white"
                >
                  <option value="" disabled className="text-slate-400">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
              <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
              Giá & Kho hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giá gốc (VND) <span className="text-[#db4444]">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giá khuyến mãi (VND)
                </label>
                <input
                  type="number"
                  name="sale_price"
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng tồn kho <span className="text-[#db4444]">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  placeholder="0"
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Product Options */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
              <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
              Tuỳ chọn sản phẩm
            </h3>
            <div className="space-y-4">
              {[{ option: option1, setOption: setOption1, value: value1, setValue: setValue1, label: "Tuỳ chọn 1" },
              { option: option2, setOption: setOption2, value: value2, setValue: setValue2, label: "Tuỳ chọn 2" }]
                .map((opt, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">{opt.label}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Tên tuỳ chọn</label>
                        <input
                          placeholder="VD: Bộ nhớ, Kích thước..."
                          value={opt.option}
                          onChange={(e) => {
                            const val = e.target.value;
                            opt.setOption(val);
                            if (!val) opt.setValue("");
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Giá trị</label>
                        <input
                          placeholder="VD: 256GB, Đen, Xám..."
                          value={opt.value}
                          onChange={(e) => opt.setValue(e.target.value)}
                          disabled={!opt.option}
                          className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all
                            ${!opt.option ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
              <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
              Mô tả sản phẩm
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden transition-all min-h-[300px]">
              {editorConfig && (
                <CKEditor
                  editor={ClassicEditor}
                  config={editorConfig as any}
                  data={description}
                  onChange={(event, editor) => setDescription(editor.getData())}
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Mô tả chi tiết sẽ giúp khách hàng hiểu rõ hơn về sản phẩm của bạn
            </p>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed top-20 left-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-l-4 border-[#db4444] animate-slideInLeft">
          {popupMessage}
        </div>
      )}
    </>
  );
}
