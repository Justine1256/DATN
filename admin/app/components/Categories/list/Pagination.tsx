type PaginationProps = {
    currentPage: number; // Trang hiện tại
    totalPages: number; // Tổng số trang
    // Kiểu đã sửa cho setCurrentPage:
    // Giờ đây nó có thể chấp nhận trực tiếp một số (number),
    // HOẶC một hàm nhận số trang trước đó (prevState) và trả về số trang mới.
    setCurrentPage: (page: number | ((prevState: number) => number)) => void;
  };
  
  const Pagination = ({
    currentPage,
    totalPages,
    setCurrentPage,
  }: PaginationProps) => {
    return (
      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <p>
          Hiển thị <strong>{totalPages}</strong> trên tổng số{" "}
          <strong>{totalPages}</strong> mục
        </p>
        <div className="flex items-center gap-2">
          <button
            // Sử dụng dạng cập nhật hàm (functional update) cho setCurrentPage
            // 'p' ở đây là giá trị 'currentPage' hiện tại
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1} // Vô hiệu hóa nút nếu đang ở trang đầu tiên
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            Trang trước
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i} // Key duy nhất cho mỗi nút trang
              // Thiết lập trực tiếp số trang cho setCurrentPage
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            // Sử dụng dạng cập nhật hàm (functional update) cho setCurrentPage
            // 'p' ở đây là giá trị 'currentPage' hiện tại
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages} // Vô hiệu hóa nút nếu đang ở trang cuối cùng
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
          >
            Trang sau
          </button>
        </div>
      </div>
    );
  };
  
  export default Pagination;