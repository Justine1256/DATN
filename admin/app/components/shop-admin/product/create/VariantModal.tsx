"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Form as AntForm, Input, InputNumber, Upload, Button, Space, Image } from "antd";
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

  // popup trượt ngang góc phải (như trang khác)
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");

  useEffect(() => {
    form.setFieldsValue({
      value1: initialData?.value1 || "",
      value2: initialData?.value2 || "",
      price: initialData?.price || 0,
      sale_price: initialData?.sale_price || 0,
      stock: initialData?.stock ?? 1,
      image: images,
    } as any);
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

      // validate theo props disable
      if ((!values.value1 && !disableValue1) || (!values.value2 && !disableValue2)) {
        showSlidePopup("Vui lòng nhập Option 1 và Value 1", "error");
        return;
      }
      if ((values.price ?? 0) <= 0 || (values.stock ?? 0) <= 0) {
        showSlidePopup("Giá và tồn kho phải > 0", "error");
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
    } catch (e) {
      // validateFields sẽ highlight lỗi, chỉ hiển thị popup phụ
      showSlidePopup("Vui lòng nhập đầy đủ và hợp lệ.", "error");
    }
  };

  const beforeUpload = () => false; // ngăn antd upload tự động
  const onUploadChange: any = async (info: any) => {
    const file = info.file as File;
    if (!file) return;
    const f = file as any;
    const raw = f.originFileObj || f;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImages([reader.result]);
    };
    reader.readAsDataURL(raw);
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  return (
    <>
      {/* Popup trượt ngang từ góc phải, nằm dưới header 64px */}
      {showPopup && (
        <div className="fixed right-6 z-[10000]" style={{ top: "64px" }}>
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
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in { animation: slideInRight .35s ease-out; }
      `}</style>

      <Modal
        open
        title="Thêm biến thể"
        onCancel={onClose}
        onOk={handleOk}
        okText="Xác nhận"
        cancelText="Huỷ"
        maskClosable={false}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" initialValues={{ stock: 1, price: 0, sale_price: 0 }}>
          <AntForm.Item label="Giá trị 1 (VD: 256GB, M, L)" name="value1" rules={[{ required: !disableValue1, message: "Nhập giá trị 1" }]}>
            <Input placeholder="Nhập giá trị 1" disabled={disableValue1} />
          </AntForm.Item>

          <AntForm.Item label="Giá trị 2 (VD: Màu đen, Titan xanh)" name="value2" rules={[{ required: !disableValue2, message: "Nhập giá trị 2" }]}>
            <Input placeholder="Nhập giá trị 2" disabled={disableValue2} />
          </AntForm.Item>

          <AntForm.Item label="Giá gốc" name="price" rules={[{ required: true, message: "Nhập giá gốc" }]}>
            <InputNumber className="w-full" min={0} placeholder="Nhập giá gốc (VNĐ)" />
          </AntForm.Item>

          <AntForm.Item label="Giá khuyến mãi" name="sale_price">
            <InputNumber className="w-full" min={0} placeholder="Nhập giá khuyến mãi (nếu có)" />
          </AntForm.Item>

          <AntForm.Item label="Số lượng tồn" name="stock" rules={[{ required: true, message: "Nhập số lượng tồn" }]}>
            <InputNumber className="w-full" min={0} placeholder="Nhập số lượng tồn" />
          </AntForm.Item>

          <AntForm.Item label="Hình ảnh biến thể">
            <Space direction="vertical" className="w-full">
              <Upload beforeUpload={beforeUpload as any} onChange={onUploadChange} maxCount={1} accept="image/*" showUploadList={false}>
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
              {images.length > 0 && (
                <Space wrap>
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <Image src={img} width={64} height={64} alt={`variant-${idx}`} className="rounded-md border" />
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
