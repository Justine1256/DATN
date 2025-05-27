import Layout from '../../../components/admin/Layout';
import { products } from '../../../types/product';
import { Product } from '../../../types/product';
import { useState } from 'react';
import { Eye, Pencil, Trash2, Star } from 'lucide-react';

export default function ProductList() {
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const paginated = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-6">Product List</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th></th>
                <th>Product Name & Size</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product: Product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="flex items-center gap-4 py-3">
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-contain" />
                    <div>
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">Size: {product.size}</div>
                    </div>
                  </td>
                  <td>{product.price}</td>
                  <td>
                    <div className="font-medium text-gray-800">{product.stock} Item Left</div>
                    <div className="text-xs text-gray-500">{product.sold} Sold</div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                      <span>{product.rating}</span>
                    </div>
                    <div className="text-xs text-gray-500">{product.reviews} Review</div>
                  </td>
                  <td className="space-x-2">
                    <button className="p-2 rounded bg-gray-100 hover:bg-gray-200">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 rounded bg-blue-100 hover:bg-blue-200">
                      <Pencil size={16} />
                    </button>
                    <button className="p-2 rounded bg-red-100 hover:bg-red-200">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-6 gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`px-4 py-1 rounded border text-sm ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
