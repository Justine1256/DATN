type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
};

const Pagination = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
  // Hiển thị tối đa 5 trang xung quanh trang hiện tại (currentPage)
  const maxVisiblePages = 5;

  // Tính toán trang đầu và trang cuối để hiển thị
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Điều chỉnh khi số trang không đủ để hiển thị maxVisiblePages
  const pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
      <p>
        Hiển thị <strong>{currentPage}</strong> trên tổng số{" "}
        <strong>{totalPages}</strong> trang
      </p>

      <div className="flex items-center gap-2">
        {/* Nút Trang trước */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
        >
          Trang trước
        </button>

        {/* Các nút số trang */}
        {pagesToShow.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Nút Trang sau */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default Pagination;
