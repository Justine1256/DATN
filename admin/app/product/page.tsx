"use client";

import { useEffect, useState } from "react";
import ProductListHeader from "../components/product/list/ListHeader";
import ProductRow from "../components/product/list/Row";
import Pagination from "../components/product/list/Pagination";
import { Product } from "../../types/product";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Không có token. Hãy đăng nhập.");
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/product", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi fetch sản phẩm");

      const data = await res.json();
      const rawProducts = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      const mapped: Product[] = rawProducts.map((p: any): Product => ({
        id: p.id,
        category_id: p.category_id,
        shop_id: p.shop_id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        sale_price: p.sale_price,
        stock: p.stock,
        sold: p.sold,
        image: typeof p.image === "string" ? [p.image] : p.image || [],
        option1: p.option1,
        value1: p.value1,
        option2: p.option2,
        value2: p.value2,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        deleted_at: p.deleted_at,
        size: typeof p.size === "string" ? p.size.split(",").map((s: string) => s.trim()) : Array.isArray(p.size) ? p.size : [],
        category: p.category || "Unknown",
        rating: p.rating || 0,
      }));

      setProducts(mapped);
    } catch (error) {
      console.error("Lỗi khi load sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/product/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Xoá thành công");
        fetchProducts(); // reload lại danh sách
      } else {
        alert("Không thể xoá sản phẩm");
      }
    } catch (err) {
      console.error("Lỗi xoá sản phẩm:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  return (
    <div className="p-6">
      <ProductListHeader />
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
            <th className="py-2 px-3">Product Name & Size</th>
            <th className="py-2 px-3">Price</th>
            <th className="py-2 px-3">Stock</th>
            <th className="py-2 px-3">Category</th>
            <th className="py-2 px-3">Rating</th>
            <th className="py-2 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td>
            </tr>
          ) : (
            paginatedProducts.map((product) => (
              <ProductRow key={product.id} product={product} onDelete={handleDelete} />
            ))
          )}
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
