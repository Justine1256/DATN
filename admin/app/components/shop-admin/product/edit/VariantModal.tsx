"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form as AntForm,
  Input,
  InputNumber,
  Upload,
  Button,
  Space,
  Image,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

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
  const [form] = AntForm.useForm<Variant>();
  const [images, setImages] = useState<string[]>(initialData?.image || []);

  // Popup trượt ngang + tự căn dưới header
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [headerOffset, setHeaderOffset] = useState<number>(64);
  useEffect(() => {
    const readHeader = () => {
      const el = document.querySelector<HTMLElement>("header, .ant-layout-header");
      if (el) setHeaderOffset(el.offsetHeight);
    };
    readHeader();
    window.addEventListener("resize", readHeader);
    return () => window.removeEventListener("resize", readHeader);
  }, []);

  // nạp dữ liệu mặc định khi edit
  useEffect(() => {
    form.setFieldsValue({
      value1: initialData?.value1 || "",
      value2: initialData?.value2 || "",
      price: initialData?.price ?? 0,
      sale_price: initialData?.sale_price ?? 0,
      stock: initialData?.stock ?? 1,
    } as any);
    setImages(initialData?.image || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const showSlidePopup = (msg: string, type: "success" | "error") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // thêm lớp validate theo disableValue1/2 để khớp logic cũ
      if ((!values.value1 && !disableValue1) || (!values.value2 && !disableValue2)) {
        showSlidePopup("Vui lòng nhập đầy đủ và hợp lệ.", "error");
        return;
      }
      if ((values.price ?? 0) < 0 || (values.stock ?? 0) < 0) {
        showSlidePopup("Giá/Tồn kho không được âm.", "error");
        return;
      }

      const variant: Variant = {
        value1: values.value1 || "",
        value2: values.value2 || "",
        price: Number(values.price) || 0,
        sale_price: Number(values.sale_price) || 0,
        stock: Number(values.stock) || 0,
        image: images,
      };

      onSave(variant);
      showSlidePopup("Biến thể đã được lưu thành công!", "success");
      onClose();
    } catch {
      // Form của Antd sẽ highlight lỗi; popup chỉ mang tính thông báo nhanh
      showSlidePopup("Vui lòng nhập đầy đủ và hợp lệ.", "error");
    }
  };

  // chặn upload tự động để giữ logic base64 như cũ
  const beforeUpload = () => false;
  const onUploadChange: any = (info: any) => {
    const raw: File = (info.file.originFileObj || info.file) as File;
    if (!raw) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImages([reader.result]);
    };
    reader.readAsDataURL(raw);
  };
  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const isEditing = Boolean(initialData);

  return (
    <>
      {/* Popup trượt ngang từ góc phải, nằm ngay dưới header */}
      {showPopup && (
        <div className="fixed right-6 z-[10000]" style={{ top: `${headerOffset}px` }}>
          <div
            className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 slide-in ${popupType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
          >
            {popupType === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{popupMessage}</span>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .slide-in {
          animation: slideInRight 0.35s ease-out;
        }
      `}</style>

      <Modal
        open
        title={isEditing ? "Chỉnh sửa biến thể" : "Thêm biến thể"}
        onCancel={onClose}
        onOk={handleOk}
        okText={isEditing ? "Lưu thay đổi" : "Xác nhận"}
        cancelText="Huỷ"
        maskClosable={false}
        destroyOnClose
      >
        <AntForm
          form={form}
          layout="vertical"
          initialValues={{ stock: 1, price: 0, sale_price: 0 }}
        >
          <AntForm.Item
            label={
              <>
                Giá trị 1 <span className="text-[#db4444]">*</span>
              </>
            }
            name="value1"
            rules={[{ required: !disableValue1, message: "Nhập giá trị 1" }]}
          >
            <Input placeholder="VD: 256GB, Size M" disabled={disableValue1} />
          </AntForm.Item>

          <AntForm.Item
            label={
              <>
                Giá trị 2 <span className="text-[#db4444]">*</span>
              </>
            }
            name="value2"
            rules={[{ required: !disableValue2, message: "Nhập giá trị 2" }]}
          >
            <Input placeholder="VD: Màu đen, Titan xanh" disabled={disableValue2} />
          </AntForm.Item>

          <AntForm.Item
            label={
              <>
                Giá gốc (VNĐ) <span className="text-[#db4444]">*</span>
              </>
            }
            name="price"
            rules={[{ required: true, message: "Nhập giá gốc" }]}
          >
            <InputNumber className="w-full" min={0} placeholder="Nhập giá gốc" />
          </AntForm.Item>

          <AntForm.Item label="Giá khuyến mãi" name="sale_price">
            <InputNumber className="w-full" min={0} placeholder="Nhập giá khuyến mãi" />
          </AntForm.Item>

          <AntForm.Item
            label={
              <>
                Số lượng tồn kho <span className="text-[#db4444]">*</span>
              </>
            }
            name="stock"
            rules={[{ required: true, message: "Nhập số lượng tồn" }]}
          >
            <InputNumber className="w-full" min={0} placeholder="Số lượng tồn" />
          </AntForm.Item>

          <AntForm.Item label="Hình ảnh biến thể">
            <Space direction="vertical" className="w-full">
              <Upload
                beforeUpload={beforeUpload as any}
                onChange={onUploadChange}
                maxCount={1}
                accept="image/*"
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>

              {images.length > 0 && (
                <Space wrap>
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <Image
                        src={img}
                        width={72}
                        height={72}
                        alt={`variant-${idx}`}
                        className="rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </Space>
              )}
            </Space>
          </AntForm.Item>
        </AntForm>
      </Modal>
    </>
  );
}
