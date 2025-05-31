import Link from "next/link";

const ProductListHeader = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">All Product List</h1>
      <div className="flex gap-2">
        <Link
          href="product/create"
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
  );
};

export default ProductListHeader;
