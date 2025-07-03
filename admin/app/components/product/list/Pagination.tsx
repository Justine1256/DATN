type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prevState: number) => number)) => void;
};

const Pagination = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
  if (totalPages === 0) return null;

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
          className="px-3 py-1 rounded text-[#db4444] border border-transparent hover:border-[#db4444]/30 disabled:text-gray-400 disabled:border-none"
        >
          Trang trước
        </button>

        {/* Các nút số trang */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${currentPage === page
                ? "bg-[#db4444] text-white"
                : "text-[#db4444] border border-transparent hover:border-[#db4444]/30"
              }`}
          >
            {page}
          </button>
        ))}

        {/* Nút Trang sau */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded text-[#db4444] border border-transparent hover:border-[#db4444]/30 disabled:text-gray-400 disabled:border-none"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default Pagination;
