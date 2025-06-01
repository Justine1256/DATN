type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prevState: number) => number)) => void;
};

const Pagination = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
  if (totalPages === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t z-50 shadow-md py-3 px-4">
      <div className="flex justify-between items-center text-sm text-gray-600 max-w-6xl mx-auto">
        <p>
          Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded border text-sm transition hover:bg-gray-100 disabled:text-gray-400"
          >
            ← Trước
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded text-sm font-medium border ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
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
            className="px-3 py-1.5 rounded border text-sm transition hover:bg-gray-100 disabled:text-gray-400"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
