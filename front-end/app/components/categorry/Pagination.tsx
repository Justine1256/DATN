// components/common/Pagination.tsx
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-center mt-6 gap-2 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-[#DB4444] hover:text-white transition"
        disabled={currentPage === 1}
      >
        Trước
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 border rounded ${
            currentPage === page
              ? "bg-[#DB4444] text-white"
              : "hover:bg-[#DB4444] hover:text-white"
          } transition`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-[#DB4444] hover:text-white transition"
        disabled={currentPage === totalPages}
      >
        Sau
      </button>
    </div>
  );
}
