"use client";

import { useState } from "react";

interface Variant {
  value1: string;
  value2: string;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string[];
}

interface VariantModalProps {
  onClose: () => void;
  onSave: (variant: Variant) => void;
  initialData?: Variant;
  disableValue1?: boolean;
  disableValue2?: boolean;
}

export default function VariantModal({
  onClose,
  onSave,
  initialData,
  disableValue1,
  disableValue2,
}: VariantModalProps) {
  const [value1, setValue1] = useState(initialData?.value1 || "");
  const [value2, setValue2] = useState(initialData?.value2 || "");
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [salePrice, setSalePrice] = useState<number>(initialData?.sale_price || 0);
  const [stock, setStock] = useState<number>(initialData?.stock || 1);
  const [images, setImages] = useState<string[]>(initialData?.image || []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImages([reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!value1 && !disableValue1) || (!value2 && !disableValue2) || price < 0 || stock < 0) {
      alert("Vui lòng nhập đầy đủ và hợp lệ.");
      return;
    }

    onSave({
      value1,
      value2,
      price,
      sale_price: salePrice,
      stock,
      image: images,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Thêm biến thể</h2>

        <div className="space-y-4">
          {/* Value 1 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giá trị 1 <span className="text-[#db4444]">*</span>
            </label>
            <input
              type="text"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="VD: 256GB, Size M"
              disabled={disableValue1}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
            />
          </div>

          {/* Value 2 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giá trị 2 <span className="text-[#db4444]">*</span>
            </label>
            <input
              type="text"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="VD: Màu đen, Chất liệu vải"
              disabled={disableValue2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
            />
          </div>

          {/* Giá gốc */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giá gốc (VNĐ) <span className="text-[#db4444]">*</span>
            </label>
            <input
              type="number"
              value={price === 0 ? "" : price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
              placeholder="Nhập giá gốc"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
            />
          </div>

          {/* Giá khuyến mãi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giá khuyến mãi
            </label>
            <input
              type="number"
              value={salePrice === 0 ? "" : salePrice}
              onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value)))}
              placeholder="Nhập giá khuyến mãi"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
            />
          </div>

          {/* Tồn kho */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Số lượng tồn kho <span className="text-[#db4444]">*</span>
            </label>
            <input
              type="number"
              value={stock === 0 ? "" : stock}
              onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
              placeholder="Số lượng tồn"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#db4444]/20 focus:border-[#db4444]"
            />
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hình ảnh biến thể
            </label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    className="w-20 h-20 object-cover rounded border"
                    alt={`variant-${index}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-[#db4444] text-white text-xs rounded-full px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 px-4 py-2 hover:underline"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#db4444] text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
