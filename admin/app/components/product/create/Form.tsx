"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/utils/api";
import { Category } from "@/types/category";

import { CKEditor, ClassicEditor } from "../../CKEditorWrapper";



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

              {/* Tên sản phẩm */}
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

              {/* Danh mục */}
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
              {/* Option 1 */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Tuỳ chọn 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tên tuỳ chọn
                    </label>
                    <input
                      name="option1"
                      placeholder="Bộ nhớ, Kích thước..."
                      value={option1}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOption1(val);
                        if (!val) setValue1("");
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Giá trị
                    </label>
                    <input
                      name="value1"
                      placeholder="256GB, Large..."
                      value={value1}
                      onChange={(e) => setValue1(e.target.value)}
                      disabled={!option1}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] ${!option1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Tuỳ chọn 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tên tuỳ chọn
                    </label>
                    <input
                      name="option2"
                      placeholder="Màu sắc, Chất liệu..."
                      value={option2}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOption2(val);
                        if (!val) setValue2("");
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Giá trị
                    </label>
                    <input
                      name="value2"
                      placeholder="Đen, Trắng, Xám..."
                      value={value2}
                      onChange={(e) => setValue2(e.target.value)}
                      disabled={!option2}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] ${!option2 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center">
              <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
              Mô tả sản phẩm
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden transition-all min-h-[300px]">
              <CKEditor
                editor={ClassicEditor}
                data={description}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setDescription(data);
                }}
                config={{
                  toolbar: [
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "underline",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "outdent",
                    "indent",
                    "|",
                    "blockQuote",
                    "insertTable",
                    "|",
                    "undo",
                    "redo",
                  ],
                  placeholder: "Nhập mô tả chi tiết về sản phẩm...",
                }}
              />


            </div>
            <p className="text-xs text-slate-500 mt-2">
              Mô tả chi tiết sẽ giúp khách hàng hiểu rõ hơn về sản phẩm của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Popup thông báo trái */}
      {showPopup && (
        <div className="fixed top-20 left-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-l-4 border-[#db4444] animate-slideInLeft">
          {popupMessage}
        </div>
      )}
    </>
  );
}
