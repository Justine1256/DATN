"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

// import CateImageDrop from "@/app/components/shop-admin/category/edit/ImageDrop";
import CategoryInfoForm from "@/app/components/shop-admin/category/edit/Form";
import ActionButtons from "@/app/components/shop-admin/category/edit/ActionButtons";
import { API_BASE_URL } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";

interface Category {
  id: string;
  shop_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: string;
}

export default function EditCategoryPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Omit<Category, "status">>({
    id: "",
    shop_id: "",
    parent_id: null,
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  // ✅ Lấy token
  useEffect(() => {
    const tk = Cookies.get("authToken");
    setToken(tk || null);
  }, []);

  // ✅ Lấy shop_id
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sid = res.data.shop?.id;
        setShopId(sid);
      })
      .catch((err) => console.error("❌ Lỗi lấy shop_id:", err));
  }, [token]);

  // ✅ Lấy category hiện tại để edit
  useEffect(() => {
    if (!token || !id) return;
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/category/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setFormData({
          id: data.id || "",
          shop_id: data.shop_id || "",
          parent_id: data.parent_id || null,
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          image: data.image || "/placeholder.png",
        });
      } catch (err) {
        console.error("❌ Lỗi khi lấy category:", err);
      }
    };
    fetchCategory();
  }, [token, id]);

  // ✅ Lấy danh mục cha shop + admin
  useEffect(() => {
    if (!token || !shopId) return;
    const fetchAllCategories = async () => {
      try {
        const [shopRes, adminRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/shop/categories/${shopId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/admin/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const shopData = Array.isArray(shopRes.data.categories)
          ? shopRes.data.categories
          : [];
        const adminData = Array.isArray(adminRes.data)
          ? adminRes.data
          : adminRes.data.data || [];

        setParentCategories([...shopData, ...adminData]);
      } catch (err) {
        console.error("❌ Lỗi lấy danh mục:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCategories();
  }, [token, shopId]);

  // ✅ Xử lý thay đổi form
  const handleSetData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !token) return;

    if (!formData.parent_id) {
      await Swal.fire({
        icon: "warning",
        title: "Thiếu danh mục cha",
        text: "Vui lòng chọn danh mục cha.",
        confirmButtonColor: "#db4444",
      });
      return;
    }


    setSubmitting(true);
    try {
      await axios.put(
        `${API_BASE_URL}/shop/categories/${id}`,
        {
          ...formData,
          image: formData.image || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      await Swal.fire({
        icon: "success",
        title: "Cập nhật thành công!",
        text: "Danh mục đã được chỉnh sửa.",
        confirmButtonColor: "#db4444",
      });

      router.push("/shop-admin/category"); // redirect về list
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.error("❌ Axios error:", err.response?.data || err.message);
        await Swal.fire({
          icon: "error",
          title: "Lỗi",
          text:
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Không thể cập nhật danh mục.",
          confirmButtonColor: "#db4444",
        });
      } else {
        console.error("❌ Unknown error:", err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-9 flex justify-center"
    >
      <div className="w-full max-w-4xl">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          Chỉnh sửa danh mục - ID: {formData.id}
        </h1>

        <div className="space-y-6 mt-8">
          {/* <CateImageDrop
            image={formData.image}
            setImage={(url) => handleSetData("image", url)}
          /> */}

          <CategoryInfoForm
            data={formData}
            setData={handleSetData}
            categories={parentCategories}
          />

          <ActionButtons
            loading={submitting}
            success={success}
            submitLabel="Cập nhật"
          />
        </div>
      </div>
    </form>
  );
}
