import Link from "next/link";


const ProductListHeader = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      {/* Tiêu đề có điểm nhấn */}
      <h1 className="text-2xl font-bold text-[#DC4B47] flex items-center gap-2">
        
        Danh sách sản phẩm
      </h1>

      {/* Nút & Filter */}
      <div className="flex gap-2">
        <Link
          href="/shop-admin/product/create"
          className="bg-[#DC4B47] hover:bg-[#e35e59] text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
        >
          Thêm sản phẩm 
        </Link>

        {/* <select className="border rounded px-2 py-1 text-sm text-gray-700">
          <option>This Month</option>
          <option>Last Month</option>
        </select> */}
      </div>
    </div>
  );
};

export default ProductListHeader;
