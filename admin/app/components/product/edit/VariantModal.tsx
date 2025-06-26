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
    if ((!value1 && !disableValue1) || (!value2 && !disableValue2) || price <= 0 || stock <= 0) {
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
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">Thêm biến thể</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Giá trị 1 (VD: 256GB, M, L)
            </label>
            <input
              type="text"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="Nhập giá trị 1"
              className="border rounded w-full px-3 py-2"
              disabled={disableValue1}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Giá trị 2 (VD: Màu đen, Titan xanh)
            </label>
            <input
              type="text"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="Nhập giá trị 2"
              className="border rounded w-full px-3 py-2"
              disabled={disableValue2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Giá gốc
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Nhập giá gốc (VNĐ)"
              className="border rounded w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Giá khuyến mãi
            </label>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              placeholder="Nhập giá khuyến mãi (nếu có)"
              className="border rounded w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Số lượng tồn
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              placeholder="Nhập số lượng tồn"
              className="border rounded w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Hình ảnh biến thể
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`variant-${index}`}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1"
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
