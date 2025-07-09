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

  // price & salePrice chuyển thành string để format
  const [price, setPrice] = useState<string>(
    initialData?.price ? initialData.price.toString() : ""
  );
  const [salePrice, setSalePrice] = useState<string>(
    initialData?.sale_price ? initialData.sale_price.toString() : ""
  );
  const [stock, setStock] = useState<number>(initialData?.stock || 1);
  const [images, setImages] = useState<string[]>(initialData?.image || []);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // format 12.345.678
  const formatCurrency = (value: string) => {
    const num = parseInt(value.replace(/[^\d]/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("vi-VN") + " đ";
  };
  

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
    const parsedPrice = parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
    const parsedSalePrice = parseInt(salePrice.replace(/[^\d]/g, ""), 10) || 0;

    if ((!value1 && !disableValue1) || (!value2 && !disableValue2) || parsedPrice <= 0 || stock <= 0) {
      setPopupMessage("Vui lòng nhập đầy đủ và hợp lệ.");
      setShowPopup(true);
      return;
    }

    onSave({
      value1,
      value2,
      price: parsedPrice,
      sale_price: parsedSalePrice,
      stock,
      image: images,
    });

    setPopupMessage("Biến thể đã được lưu thành công!");
    setShowPopup(true);
    onClose();
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Number(e.target.value));
    setStock(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Thêm biến thể</h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Giá trị 1 (VD: 256GB, M, L)
            </label>
            <input
              type="text"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="Nhập giá trị 1"
              className="border border-gray-300 focus:border-[#db4444] focus:ring-1 focus:ring-[#db4444] rounded-lg w-full px-4 py-3 transition-all"
              disabled={disableValue1}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Giá trị 2 (VD: Màu đen, Titan xanh)
            </label>
            <input
              type="text"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="Nhập giá trị 2"
              className="border border-gray-300 focus:border-[#db4444] focus:ring-1 focus:ring-[#db4444] rounded-lg w-full px-4 py-3 transition-all"
              disabled={disableValue2}
            />
          </div>

          {/* Giá gốc */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Giá gốc
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                setPrice(raw);
              }}
              onBlur={() => setPrice((prev) => formatCurrency(prev))}
              onFocus={() => setPrice(price.replace(/[^\d]/g, ""))}
              placeholder="Nhập giá gốc (VNĐ)"
              className="border border-gray-300 focus:border-[#db4444] focus:ring-1 focus:ring-[#db4444] rounded-lg w-full px-4 py-3 transition-all"
            />

          </div>

          {/* Giá khuyến mãi */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Giá khuyến mãi
            </label>
            <input
              type="text"
              value={salePrice}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                setSalePrice(raw);
              }}
              onBlur={() => setSalePrice((prev) => formatCurrency(prev))}
              onFocus={() => setSalePrice(salePrice.replace(/[^\d]/g, ""))}
              placeholder="Nhập giá khuyến mãi (VNĐ)"
              className="border border-gray-300 focus:border-[#db4444] focus:ring-1 focus:ring-[#db4444] rounded-lg w-full px-4 py-3 transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Số lượng tồn
            </label>
            <input
              type="number"
              value={stock}
              onChange={handleStockChange}
              placeholder="Nhập số lượng tồn"
              className="border border-gray-300 focus:border-[#db4444] focus:ring-1 focus:ring-[#db4444] rounded-lg w-full px-4 py-3 transition-all"
            />
          </div>

          {/* Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Hình ảnh biến thể
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mb-4"
            />
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`variant-${index}`}
                    className="w-10 h-20 object-cover rounded-lg border"
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

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 px-4 py-2 hover:text-[#db4444] transition-all"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#db4444] text-white px-4 py-3 rounded-lg hover:bg-[#c23333] transition-all"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
