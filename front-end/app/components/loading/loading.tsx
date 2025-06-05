'use client';

export const LoadingSkeleton = () => {
  return (
    <div className="w-full max-w-[250px] h-[280px] bg-white rounded-lg border border-gray-200 shadow p-3 animate-pulse flex flex-col">
      <div className="w-full h-[140px] bg-gray-200 rounded" />
      <div className="mt-4 h-4 bg-gray-300 rounded w-3/4" />
      <div className="mt-2 h-4 bg-gray-300 rounded w-1/2" />
      <div className="mt-4 flex gap-2">
        <div className="w-12 h-4 bg-gray-200 rounded" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
};
