"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Empty,
  Spin,
  Space,
  Tooltip,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "@/utils/api";
import ImageDrop from "@/app/components/shop-admin/product/edit/ImageDrop";
import Form from "@/app/components/shop-admin/product/edit/Form";
import ActionButtons from "@/app/components/shop-admin/product/edit/ActionButtons";
import { Product } from "@/types/product";
import VariantModal from "@/app/components/shop-admin/product/edit/VariantModal";

interface Variant {
  id?: number;
  value1: string;
  value2: string;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string[];
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string }[]>([]);
  const [category, setCategory] = useState("");
  const [optionValues, setOptionValues] = useState({
    option1: "",
    value1: "",
    option2: "",
    value2: "",
  });
  const [formValues, setFormValues] = useState({
    name: "",
    price: 0,
    sale_price: 0,
    stock: 0,
    description: "",
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [headerOffset, setHeaderOffset] = useState<number>(64);

  useEffect(() => {
    const readHeader = () => {
      const el = document.querySelector<HTMLElement>('header, .ant-layout-header');
      if (el) setHeaderOffset(el.offsetHeight);
    };
    readHeader();
    window.addEventListener('resize', readHeader);
    return () => window.removeEventListener('resize', readHeader);
  }, []);

  const handleShowPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleDeleteVariant = async (variantId?: number) => {
    if (!variantId) return;
    const confirmed = window.confirm("Bạn có chắc muốn xoá biến thể này?");
    if (!confirmed) return;

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(`${API_BASE_URL}/shop/product-variants/${variantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xoá thất bại");
      setVariants((prev) => prev.filter((item) => item.id !== variantId));
      handleShowPopup("Đã xoá biến thể", "success");
    } catch (err) {
      handleShowPopup("Xoá biến thể thất bại", "error");
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = Cookies.get("authToken");
        if (!token) throw new Error("Chưa đăng nhập");

        const res = await fetch(`${API_BASE_URL}/shop/products/${id}/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không tìm thấy sản phẩm hoặc không có quyền");

        const data = await res.json();
        const p = data.product;
        setProduct(p);
        setCategory(p.category_id?.toString() || "");
        setSelectedImages(
          (Array.isArray(p.image) ? p.image : [p.image || ""]).map((url: string, idx: number) => ({
            id: String(idx),
            url,
          }))
        );
        setOptionValues({
          option1: p.option1 || "",
          value1: p.value1 || "",
          option2: p.option2 || "",
          value2: p.value2 || "",
        });
        const loadedVariants: Variant[] = Array.isArray(p.variants)
          ? p.variants.map((v: any) => ({
            id: v.id,
            value1: v.value1,
            value2: v.value2,
            price: parseFloat(v.price),
            sale_price: parseFloat(v.sale_price) || 0,
            stock: (v?.stock ?? p.stock) ?? 0,
            image: Array.isArray(v.image) ? v.image : [],
          }))
          : [];
        setVariants(loadedVariants);
        const v = loadedVariants[0];
        setFormValues({
          name: p.name,
          price: v?.price ?? parseFloat(p.price),
          sale_price: v?.sale_price ?? parseFloat(p.sale_price || 0),
          stock: (v?.stock ?? p.stock) ?? 0,
          description: p.description || "",
        });
      } catch (err) {
        router.push("/shop-admin/product");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Spin />
      </div>
    );
  if (!product) return <div className="p-6 text-red-500">Không tìm thấy sản phẩm.</div>;

  return (
    <form className="relative">
      {popupMessage && (
        <div className="fixed right-6 z-50" style={{ top: `${headerOffset}px` }}>

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
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-in { animation: slideInRight .35s ease-out; }
      `}</style>

      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          <Space direction="vertical" size={16} className="w-full">
            <Typography.Title level={4} className="!mb-0 !text-[#db4444]">
              Chỉnh sửa sản phẩm (ID: {String(id)})
            </Typography.Title>

            <Card title="Hình ảnh">
              <ImageDrop images={selectedImages} setImages={setSelectedImages} />
            </Card>

            <Card title="Thông tin cơ bản">
              <Form
                images={selectedImages}
                defaultValues={product}
                category={category}
                setCategory={setCategory}
                onOptionsChange={setOptionValues}
                onFormChange={setFormValues}
              />
            </Card>

            <Card
              title="Biến thể"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingVariant(null);
                    setShowVariantModal(true);
                  }}
                >
                  Thêm biến thể
                </Button>
              }
            >
              {variants.length === 0 ? (
                <Empty description="Chưa có biến thể nào" />)
                : (
                  <Row gutter={[12, 12]}>
                    {variants.map((v, i) => (
                      <Col xs={24} sm={12} key={v.id ?? i}>
                        <Card size="small" className="relative">
                          <Space direction="vertical" size={2} className="w-full">
                            <Typography.Text className="text-gray-700">
                              <strong>{v.value1}</strong> / {v.value2}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              Giá: {v.price.toLocaleString()} | Tồn: {v.stock}
                            </Typography.Text>
                          </Space>
                          <Space style={{ position: "absolute", top: 8, right: 8 }}>
                            <Tooltip title="Sửa">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingVariant(v);
                                  setShowVariantModal(true);
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Xoá">
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteVariant(v.id)}
                              />
                            </Tooltip>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
            </Card>

            <Card>
              <Row justify="space-between" align="middle">
                <Col>
                  <Button
                    onClick={() => {
                      setEditingVariant(null);
                      setShowVariantModal(true);
                    }}
                    icon={<PlusOutlined />}
                  >
                    Thêm biến thể
                  </Button>
                </Col>
                <Col>
                  <ActionButtons
                    productId={product.id}
                    images={selectedImages}
                    optionValues={optionValues}
                    categoryId={category}
                    formValues={formValues}
                    variants={variants}
                    onPopup={handleShowPopup}
                  />
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>

      {showVariantModal && (
        <VariantModal
          onClose={() => {
            setEditingVariant(null);
            setShowVariantModal(false);
          }}
          onSave={(newVariant) => {
            if (editingVariant?.id) {
              setVariants((prev) =>
                prev.map((v) => (v.id === editingVariant.id ? { ...newVariant, id: v.id } : v))
              );
            } else {
              setVariants((prev) => [...prev, newVariant]);
            }
            setShowVariantModal(false);
          }}
          initialData={editingVariant || undefined}
        />
      )}
    </form>
  );
}
