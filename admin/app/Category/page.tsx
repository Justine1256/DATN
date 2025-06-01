"use client";

import { useEffect, useState, useCallback } from "react";
import CategoryListHeader from "../components/categories/list/Header";
import CategoryRow from "../components/categories/list/Row";
import Pagination from "../components/categories/list/Pagination";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

// ✅ Skeleton hiển thị loading từng dòng danh mục
const CategoryRowSkeleton = () => (
  <tr className="border-b border-gray-100 animate-pulse">
    <td className="py-4 px-3">
      <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
    </td>
    <td className="py-4 px-3">
      <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
    </td>
    <td className="py-4 px-3 text-center">
      <div className="h-4 w-8 bg-gray-300 rounded mx-auto"></div>
    </td>
    <td className="py-4 px-3 text-center">
      <div className="h-4 w-20 bg-gray-300 rounded mx-auto"></div>
    </td>
    <td className="py-4 px-3">
      <div className="h-8 w-20 bg-gray-300 rounded"></div>
    </td>
  </tr>
);

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
  // 🧠 State quản lý dữ liệu
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 5;

  // ✅ Lấy danh sách danh mục từ API
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

  // ✅ Lấy danh sách sản phẩm từ API
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

  // ✅ Tính tổng số sản phẩm thuộc danh mục
  const getProductCountForCategory = (categoryId: number) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => p.category_id === categoryId).length;
  };

  // ✅ Xoá danh mục - hiệu ứng xác nhận trước xoá
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
          const res = await fetch(`http://127.0.0.1:8000/api/product/${id}`, {
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
        text: "Sản phẩm đã được xoá thành công.",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchProducts(); // làm mới danh sách
    }
  };

  // ✅ Phân trang dữ liệu
  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

  // ✅ Gọi API khi component mount
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
