// components/Products/ProductSkeleton.tsx
export default function ProductSkeleton() {
    return (
      <div className="p-4 border rounded-md shadow-sm animate-pulse bg-white">
        <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 w-1/2 bg-gray-300 rounded mb-1"></div>
        <div className="h-3 w-1/3 bg-gray-300 rounded"></div>
      </div>
    );
  }
  