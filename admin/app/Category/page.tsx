"use client";

import { useEffect, useState } from "react";
import CategoryListHeader from "../components/Categories/list/Header";
import CategoryRow from "../components/Categories/list/Row";
import Pagination from "../components/Categories/list/Pagination";

type Category = {
  id: string;
  name: string;
  image: string;
  priceRange: string;
  createdBy: string;
  stock: number;
};

// export default function CategoryListPage() {
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const categoriesPerPage = 6;

//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.error("Không có token. Hãy đăng nhập.");
//         return;
//       }

//       const res = await fetch("http://127.0.0.1:8000/api/category", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) throw new Error("Lỗi fetch category");

//       const data = await res.json();
//       const rawCategories = Array.isArray(data)
//         ? data
//         : Array.isArray(data.categories)
//         ? data.categories
//         : [];

//       const mapped: Category[] = rawCategories.map((c: any): Category => ({
//         id: c.id,
//         name: c.name,
//         image: c.image,
//         priceRange: c.price_range || "$0 - $0",
//         createdBy: c.created_by || "Admin",
//         stock: c.product_stock || 0,
//       }));

//       setCategories(mapped);
//     } catch (error) {
//       console.error("Lỗi khi load danh mục:", error);
//       setCategories([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm("Bạn có chắc muốn xoá danh mục này?")) return;

//     const token = localStorage.getItem("token");
//     try {
//       const res = await fetch(`http://127.0.0.1:8000/api/category/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (res.ok) {
//         alert("Xoá thành công");
//         fetchCategories(); // Reload lại danh sách
//       } else {
//         alert("Không thể xoá danh mục");
//       }
//     } catch (err) {
//       console.error("Lỗi xoá danh mục:", err);
//     }
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const totalPages = Math.ceil(categories.length / categoriesPerPage);
//   const startIndex = (currentPage - 1) * categoriesPerPage;
//   const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

//   return (
//     <div className="p-6">
//       <CategoryListHeader />
//       <table className="w-full text-sm text-left">
//         <thead>
//           <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
//             <th className="py-2 px-3">
//               <input type="checkbox" disabled />
//             </th>
//             <th className="py-2 px-3">Categories</th>
//             <th className="py-2 px-3">Starting Price</th>
//             <th className="py-2 px-3">Create by</th>
//             <th className="py-2 px-3">ID</th>
//             <th className="py-2 px-3">Product Stock</th>
//             <th className="py-2 px-3 text-center">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {loading ? (
//             <tr>
//               <td colSpan={7} className="text-center py-8 text-gray-500">
//                 Loading...
//               </td>
//             </tr>
//           ) : (
//             paginatedCategories.map((category) => (
//               <CategoryRow key={category.id} category={category} onDelete={handleDelete} />
//             ))
//           )}
//         </tbody>
//       </table>

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         setCurrentPage={setCurrentPage}
//       />
//     </div>
//   );
// }
// ✅ Dữ liệu giả
const mockCategories: Category[] = [
    {
      id: "FS16276",
      name: "Fashion Men , Women & Kid's",
      image: "/images/categories/fashion.png",
      priceRange: "$80 to $400",
      createdBy: "Seller",
      stock: 46233,
    },
    {
      id: "HB73029",
      name: "Women Hand Bag",
      image: "/images/categories/bag.png",
      priceRange: "$120 to $500",
      createdBy: "Admin",
      stock: 2739,
    },
    {
      id: "CH492-9",
      name: "Cap and Hat",
      image: "/images/categories/hat.png",
      priceRange: "$50 to $200",
      createdBy: "Admin",
      stock: 1829,
    },
    {
      id: "EC23818",
      name: "Electronics Headphone",
      image: "/images/categories/headphone.png",
      priceRange: "$100 to $700",
      createdBy: "Seller",
      stock: 1902,
    },
    {
      id: "FW11009",
      name: "Foot Wares",
      image: "/images/categories/shoes.png",
      priceRange: "$70 to $400",
      createdBy: "Seller",
      stock: 2733,
    },
    {
      id: "WL38299",
      name: "Wallet Categories",
      image: "/images/categories/wallet.png",
      priceRange: "$120 to $300",
      createdBy: "Admin",
      stock: 890,
    },
    {
      id: "SM37817",
      name: "Electronics Watch",
      image: "/images/categories/watch.png",
      priceRange: "$60 to $400",
      createdBy: "Seller",
      stock: 250,
    },
  ];
  
  export default function CategoryListPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 6;
  
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // 👉 Dùng dữ liệu mock
        setCategories(mockCategories);
      } catch (err) {
        console.error("Lỗi khi load danh mục:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
  
    const handleDelete = async (id: string) => {
      if (!confirm("Bạn có chắc muốn xoá danh mục này?")) return;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      alert("Xoá thành công (mock)");
    };
  
    useEffect(() => {
      fetchCategories();
    }, []);
  
    const totalPages = Math.ceil(categories.length / categoriesPerPage);
    const startIndex = (currentPage - 1) * categoriesPerPage;
    const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);
  
    return (
      <div className="p-6">
        <CategoryListHeader />
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
              <th className="py-2 px-3"><input type="checkbox" disabled /></th>
              <th className="py-2 px-3">Categories</th>
              <th className="py-2 px-3">Starting Price</th>
              <th className="py-2 px-3">Create by</th>
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Product Stock</th>
              <th className="py-2 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : (
              paginatedCategories.map((category) => (
                <CategoryRow key={category.id} category={category} onDelete={handleDelete} />
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