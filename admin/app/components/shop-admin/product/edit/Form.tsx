"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";
import { Category } from "@/types/category";
import { Product } from "@/types/product";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useCKEditorConfig } from "@/app/components/ckeditor/CKEditorWrapper";

interface ProductFormProps {
  images: { id: string; url: string }[];
  defaultValues?: Product;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  onOptionsChange?: (opts: {
    option1: string;
    value1: string;
    option2: string;
    value2: string;
  }) => void;
  onFormChange?: (values: {
    name: string;
    price: number;
    sale_price: number;
    stock: number;
    description: string;
  }) => void;
}

export default function ProductForm({
  images,
  defaultValues,
  category,
  setCategory,
  onOptionsChange,
  onFormChange,
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(defaultValues?.name || "");
  const [price, setPrice] = useState(defaultValues?.price || 0);
  const [salePrice, setSalePrice] = useState(defaultValues?.sale_price || 0);
  const [stock, setStock] = useState(defaultValues?.stock || 0);
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [option1, setOption1] = useState(defaultValues?.option1 || "");
  const [value1, setValue1] = useState(defaultValues?.value1 || "");
  const [option2, setOption2] = useState(defaultValues?.option2 || "");
  const [value2, setValue2] = useState(defaultValues?.value2 || "");

  const { ClassicEditor, editorConfig } = useCKEditorConfig();

  useEffect(() => {
    const fetchUserAndCategories = async () => {
      try {
        const token = Cookies.get("authToken");
        const userRes = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        const shopId = userData?.shop?.id;

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
  }, [option1, value1, option2, value2, onOptionsChange]);

  useEffect(() => {
    if (onFormChange) {
      onFormChange({ name, price, sale_price: salePrice, stock, description });
    }
  }, [name, price, salePrice, stock, description, onFormChange]);

  useEffect(() => {
    if (category !== "") {
      setCategory(category);
    }
  }, [category]);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên sản phẩm <span className="text-[#db4444]">*</span>
              </label>
              <input
                name="name"
                placeholder="Nhập tên sản phẩm"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Danh mục <span className="text-[#db4444]">*</span>
              </label>
              <select
                name="category_id"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              >
                <option value="" disabled>Chọn danh mục</option>
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
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Giá & Kho hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Giá gốc (VND) <span className="text-[#db4444]">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Giá khuyến mãi (VND)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số lượng tồn kho <span className="text-[#db4444]">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Tuỳ chọn sản phẩm
          </h3>
          {[{ label: "Tuỳ chọn 1", option: option1, setOption: setOption1, value: value1, setValue: setValue1 },
            { label: "Tuỳ chọn 2", option: option2, setOption: setOption2, value: value2, setValue: setValue2 }].map((opt, idx) => (
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

        {/* Images */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
            Hình ảnh sản phẩm
          </h3>
          <div className="flex gap-2 flex-wrap">
            {images.map((img) =>
              img.url ? (
                <img key={img.id} src={`${STATIC_BASE_URL}/${img.url}`} alt="product"
                  className="w-20 h-20 object-cover rounded border" />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
