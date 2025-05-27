// app/product/page.tsx
"use client";
import { useState } from "react";
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

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Black T-shirt",
    price: 80,
    stock: 486,
    sold: 155,
    category: "Fashion",
    rating: 4.5,
    reviews: 55,
    size: "S , M , L , XL",
    image: "/img/tshirt.png",
  },
  {
    id: 2,
    name: "Olive Green Leather Bag",
    price: 136,
    stock: 784,
    sold: 674,
    category: "Hand Bag",
    rating: 4.1,
    reviews: 143,
    size: "S , M",
    image: "/img/bag.png",
  },
  {
    id: 3,
    name: "Women Golden Dress",
    price: 219,
    stock: 769,
    sold: 180,
    category: "Fashion",
    rating: 4.4,
    reviews: 174,
    size: "S , M",
    image: "/img/dress.png",
  },
  {
    id: 4,
    name: "Gray Cap For Men",
    price: 76,
    stock: 571,
    sold: 87,
    category: "Cap",
    rating: 4.2,
    reviews: 23,
    size: "S , M , L",
    image: "/img/cap.png",
  },
];

export default function ProductPage() {
  const [products] = useState<Product[]>(initialProducts);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Product List</h1>
        <div className="flex items-center gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium">
            Add Product
          </button>
          <select className="border text-sm px-2 py-1 rounded">
            <option>This Month</option>
          </select>
        </div>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3">
              <input type="checkbox" />
            </th>
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
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <input type="checkbox" />
              </td>
              <td className="p-3 flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded" />
                <div>
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">Size : {p.size}</p>
                </div>
              </td>
              <td className="p-3">${p.price.toFixed(2)}</td>
              <td className="p-3">
                <p className="font-semibold text-gray-800">{p.stock} Item Left</p>
                <p className="text-xs text-gray-500">{p.sold} Sold</p>
              </td>
              <td className="p-3">{p.category}</td>
              <td className="p-3">
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                  <FaStar className="text-yellow-500" /> {p.rating}
                </span>
                <span className="ml-1 text-gray-500">{p.reviews} Review</span>
              </td>
              <td className="p-3 flex items-center gap-2">
                <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded">
                  <FaEye className="text-gray-600" />
                </button>
                <button className="bg-blue-100 hover:bg-blue-200 p-2 rounded">
                  <FaEdit className="text-blue-600" />
                </button>
                <button className="bg-orange-100 hover:bg-orange-200 p-2 rounded">
                  <FaTrash className="text-orange-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
        <span>Showing 1 to {products.length} of {products.length} entries</span>
        <div className="space-x-1">
          <button className="border px-3 py-1 rounded hover:bg-gray-100">Prev</button>
          <button className="border px-3 py-1 rounded bg-blue-500 text-white">1</button>
          <button className="border px-3 py-1 rounded hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>
  );
}
