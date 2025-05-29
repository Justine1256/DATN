"use client"; 

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { Product } from "../../types/product"; 

export default function ProductListPage() {
  // ✅ Khởi tạo các state để lưu dữ liệu và phân trang
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // ✅ Fetch danh sách sản phẩm từ API khi component được mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/api/product");
        const data = await res.json();

        // ✅ Chuẩn hóa định dạng dữ liệu trả về từ API (mảng hoặc object có products)
        const rawProducts = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : [];

        console.log("Fetched products:", rawProducts);

        // ✅ Map dữ liệu từ API sang định dạng Product
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
          // ✅ Nếu size là chuỗi, tách thành mảng; nếu đã là mảng thì giữ nguyên
          size:
            typeof p.size === "string"
              ? p.size.split(",").map((s: string) => s.trim())
              : Array.isArray(p.size)
              ? p.size
              : [],
          category: p.category || "Unknown",
          rating: p.rating || 0,
        }));

        setProducts(mapped);
      } catch (error) {
        console.error("Lỗi kết nối server:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts(); // Gọi hàm fetch ngay khi component mount
  }, []);

  // ✅ Tính toán phân trang
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  return (
    <div className="p-6">
      {/* ✅ Header: tiêu đề + nút thêm sản phẩm */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Product List</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/product/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Add Product
          </Link>
          <select className="border rounded px-2 py-1 text-sm text-gray-700">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        </div>
      </div>

      {/* ✅ Bảng danh sách sản phẩm */}
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
              <td colSpan={6} className="text-center py-8 text-gray-500">
                Loading...
              </td>
            </tr>
          ) : (
            paginatedProducts.map((product) => (
              <tr
                key={product.id}
                className="border-b border-gray-100 hover:bg-gray-50 text-gray-700"
              >
                <td className="py-2 px-3 flex items-center gap-3">
                  <Image
                    src={product.image?.[0] || "/default-image.jpg"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>

                    {/* ✅ Hiển thị option1/2 nếu có (ví dụ: Màu sắc, Dung lượng...) */}
                    {(product.option1 || product.option2) ? (
                      <>
                        {product.option1 && product.value1 && (
                          <p className="text-xs text-gray-500">
                            {product.option1}: {product.value1}
                          </p>
                        )}
                        {product.option2 && product.value2 && (
                          <p className="text-xs text-gray-500">
                            {product.option2}: {product.value2}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Thuộc tính: Không có
                      </p>
                    )}
                  </div>
                </td>

                {/* ✅ Cột giá */}
                <td className="py-2 px-3 font-medium text-gray-800">${product.price}</td>

                {/* ✅ Cột tồn kho */}
                <td className="py-2 px-3">
                  <span className="font-semibold text-gray-800">{product.stock} Item</span>
                  <br />
                  <span className="text-gray-500">{product.sold} Sold</span>
                </td>

                {/* ✅ Cột danh mục */}
                <td className="py-2 px-3 text-gray-700">{product.category}</td>

                {/* ✅ Cột đánh giá */}
                <td className="py-2 px-3 text-gray-700">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    <span>{product.rating} Review</span>
                  </div>
                </td>

                {/* ✅ Các nút thao tác: xem, sửa, xoá */}
                <td className="py-2 px-3">
                  <div className="flex justify-center gap-2">
                    <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
                      <FiEye />
                    </button>
                    <button className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200">
                      <FiEdit />
                    </button>
                    <button className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ✅ Phân trang */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <p>
          Showing <strong>{paginatedProducts.length}</strong> of{" "}
          <strong>{products.length}</strong> items
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
