"use client";

import { useEffect, useState } from "react";
import ProductListHeader from "../components/product/list/ListHeader";
import ProductRow from "../components/product/list/Row";
import Pagination from "../components/product/list/Pagination";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import Cookies from "js-cookie";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // ⚙️ Map category id => category object
  const categoriesMap = new Map<number, Category>();
  categories.forEach((c) => {
    categoriesMap.set(c.id, c);
    if (c.parent && c.parent.id) {
      categoriesMap.set(c.parent.id, c.parent);
    }
  });

  // 🛒 Fetch sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("authToken");
      if (!token) {
        console.error("Không có token. Hãy đăng nhập.");
        setProducts([]);
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/shop/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi fetch sản phẩm");

      const data = await res.json();
      const rawProducts = Array.isArray(data.products?.data) ? data.products.data : [];

      const mapped: Product[] = rawProducts.map((p: any): Product => ({
        id: p.id,
        category_id: p.category_id,
        shop_id: p.shop_id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: parseFloat(p.price),
        sale_price:
          p.sale_price !== null && p.sale_price !== undefined
            ? parseFloat(p.sale_price)
            : null,
        stock: p.stock,
        sold: p.sold,
        image:
          typeof p.image === "string"
            ? [p.image]
            : Array.isArray(p.image)
            ? p.image
            : [],
        option1: p.option1 ?? null,
        value1: p.value1 ?? null,
        option2: p.option2 ?? null,
        value2: p.value2 ?? null,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        deleted_at: p.deleted_at,
        size:
          typeof p.size === "string"
            ? p.size.split(",").map((s: string) => s.trim())
            : Array.isArray(p.size)
            ? p.size
            : [],
        category: p.category ?? null,
        rating: p.rating ? parseFloat(p.rating) : 0,
      }));

      setProducts(mapped);
      setCurrentPage(1);
    } catch (error) {
      console.error("Lỗi khi load sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 📦 Fetch danh mục
  const fetchCategories = async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8000/api/shop/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi fetch categories");

      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Lỗi khi load categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;

    const token = Cookies.get("authToken");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/product/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Xoá thành công");
        fetchProducts();
      } else {
        alert("Không thể xoá sản phẩm");
      }
    } catch (err) {
      console.error("Lỗi xoá sản phẩm:", err);
    }
  };

  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  return (
    <div className="p-6">
      <ProductListHeader />
      <div className="min-h-[600px] flex flex-col justify-between">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
              <th className="py-2 px-3">Product Name & Size</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Stock</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Subcategory</th>
              <th className="py-2 px-3">Rating</th>
              <th className="py-2 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody key={currentPage}>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  categoriesMap={categoriesMap}
                />
              ))
            )}
          </tbody>
        </table>

        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
