"use client";

import { useEffect, useState, useCallback } from "react";
import CategoryListHeader from "../components/Categories/list/Header";
import CategoryRow from "../components/Categories/list/Row";
import Pagination from "../components/Categories/list/Pagination";
import Cookies from "js-cookie";
import { CategoryRowSkeleton } from "../components/loading/loading";
import Swal from "sweetalert2";

// ✅ Kiểu dữ liệu danh mục (tạm dùng Local để tránh đụng global)
type LocalCategory = {
  id: number;
  name: string;
  image: string[] | null;
  priceRange?: string;
  slug?: string;
  description?: string;
  status?: string;
  parent_id?: number | null;
  parent?: { name: string } | null;
};

// ✅ Kiểu dữ liệu sản phẩm cơ bản
type Product = {
  id: number;
  name: string;
  category_id: number;
};

export default function CategoryListPage() {
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 4;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8000/api/shop/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi khi lấy danh mục");

      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8000/api/shop/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi khi lấy sản phẩm");

      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    }
  }, []);

  const getProductCountForCategory = (categoryId: number) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => p.category_id === categoryId).length;
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Bạn chắc chắn muốn xoá?",
      text: "Thao tác này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e53e3e",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Vâng, xoá đi",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const token = Cookies.get("authToken");
          const res = await fetch(`http://127.0.0.1:8000/api/categories/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error("Xoá thất bại");
          return true;
        } catch {
          Swal.showValidationMessage("Không thể xoá sản phẩm");
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      await Swal.fire({
        icon: "success",
        title: "Đã xoá!",
        text: "Danh mục đã được xoá thành công.",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchCategories(); // ✅ làm mới danh sách danh mục
      fetchProducts();    // ✅ cập nhật lại số lượng sản phẩm
    }
  };

  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  return (
    <div className="p-6">
      <CategoryListHeader />

      <table className="w-full text-sm text-left table-fixed">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
            <th className="py-2 px-3 w-1/5">Categories</th>
            <th className="py-2 px-3 w-1/5">Description</th>
            <th className="py-2 px-3 w-1/5 text-center">Product Count</th>
            <th className="py-2 px-3 w-1/5 text-center">Status</th>
            <th className="py-2 px-3 w-1/5">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: categoriesPerPage }).map((_, i) => (
                <CategoryRowSkeleton key={i} />
              ))
            : paginatedCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onDelete={handleDelete}
                  productCount={getProductCountForCategory(category.id)}
                />
              ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
