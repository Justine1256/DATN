"use client";
import { useEffect, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaStar } from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  sold: number;
  category: string;
  rating: number;
  reviews: number;
  size: string;
  image: string;
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("https://dummyjson.com/products")
      .then((res) => res.json())
      .then((data) => {
        const formatted: Product[] = data.products.slice(0, 10).map((p: any) => ({
          id: p.id,
          name: p.title,
          price: p.price,
          stock: p.stock,
          sold: Math.floor(Math.random() * 1000),
          category: p.category,
          rating: p.rating,
          reviews: Math.floor(Math.random() * 200),
          size: "S , M , L , XL",
          image: p.thumbnail,
        }));
        setProducts(formatted);
      });
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Product List</h1>
        <div className="flex items-center gap-2">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition">
            Add Product
          </button>
          <select className="border text-sm px-3 py-2 rounded text-gray-600 bg-white">
            <option>This Month</option>
          </select>
        </div>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3">Product Name & Size</th>
            <th className="p-3">Price</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Category</th>
            <th className="p-3">Rating</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
         <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">


              <td className="p-3 flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                <div>
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">Size : {p.size}</p>
                </div>
              </td>
              <td className="p-3 text-gray-700">${p.price.toFixed(2)}</td>
              <td className="p-3">
                <p className="font-medium text-gray-800">{p.stock} Item Left</p>
                <p className="text-xs text-gray-500">{p.sold} Sold</p>
              </td>
              <td className="p-3 text-gray-700">{p.category}</td>
              <td className="p-3">
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">
                  <FaStar className="text-yellow-400" /> {p.rating}
                </span>
                <span className="ml-2 text-gray-500">{p.reviews} Review</span>
              </td>
              <td className="p-3 flex items-center gap-2">
                <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded transition">
                  <FaEye className="text-gray-500" />
                </button>
                <button className="bg-blue-100 hover:bg-blue-200 p-2 rounded transition">
                  <FaEdit className="text-blue-600" />
                </button>
                <button className="bg-orange-100 hover:bg-orange-200 p-2 rounded transition">
                  <FaTrash className="text-orange-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
        <span>
          Showing 1 to {products.length} of {products.length} entries
        </span>
        <div className="space-x-1">
          <button className="border px-3 py-1 rounded hover:bg-gray-100 transition">Prev</button>
          <button className="border px-3 py-1 rounded bg-blue-500 text-white">1</button>
          <button className="border px-3 py-1 rounded hover:bg-gray-100 transition">Next</button>
        </div>
      </div>
    </div>
  );
}
