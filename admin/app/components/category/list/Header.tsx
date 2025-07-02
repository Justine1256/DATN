import Link from "next/link";

const CategoryListHeader = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-[#DC4B47]">Danh sách tất cả danh mục</h1>

      <div className="flex gap-2">
        <Link
          href="/category/create"
          className="bg-[#DC4B47] hover:bg-[#e35e59] text-white px-5 py-2 rounded-md text-sm font-medium transition duration-200"
        >
          Thêm danh mục
        </Link>

        {/* <select className="border rounded px-2 py-1 text-sm text-gray-700">
          <option>Tháng này</option>
          <option>Tháng trước</option>
        </select> */}
      </div>
    </div>
  );
};

export default CategoryListHeader;
