import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    pageSize?: number;
}

export default function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize = 20,
}: PaginationProps) {
    const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(
            (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
        )
        .reduce<number[]>((acc, page, i, arr) => {
            if (i > 0 && page - arr[i - 1] > 1) acc.push(-1);
            acc.push(page);
            return acc;
        }, []);

    return (
        <div className="flex items-center justify-between p-4 text-sm text-gray-500">
            {typeof totalItems === "number" && (
                <div>Tổng: {totalItems} đơn</div>
            )}
            <div className="flex gap-1 items-center">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
                >
                    «
                </button>
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
                >
                    ‹
                </button>
                {visiblePages.map((page, i) =>
                    page === -1 ? (
                        <span key={`dots-${i}`} className="px-2">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 rounded border transition ${page === currentPage
                                    ? "border-[#db4444] bg-[#db4444] text-white"
                                    : "border-gray-200 hover:border-[#db4444] hover:text-[#db4444]"
                                }`}
                            title={`Trang ${page}`}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
                >
                    ›
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-200 hover:border-[#db4444] hover:text-[#db4444] disabled:opacity-50"
                >
                    »
                </button>
            </div>
        </div>
    );
}