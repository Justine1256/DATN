type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prevState: number) => number)) => void;
};

const Pagination = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
  if (totalPages === 0) return null; // ✅ Ẩn pagination nếu không có trang nào

  return (
    <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
      <p>
        Hiển thị trang <strong>{currentPage}</strong> trên tổng số{" "}
        <strong>{totalPages}</strong> trang
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
        >
          ← Trước
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-400"
        >
          Sau →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
