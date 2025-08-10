"use client";

// ✅ Loading khung sản phẩm trong danh sách
export const LoadingSkeleton = () => {
  return (
    <div className="w-full max-w-[250px] h-[280px] bg-white rounded-lg border border-gray-200 shadow p-10 animate-pulse flex flex-col">
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

// ✅ Loading khi lấy thông tin shop
export const LoadingShopInfo = () => {
  return (
    <div className="mt-12 border rounded-lg bg-white p-6 animate-pulse">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        {/* ✅ Trái: logo + tên shop */}
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-full bg-gray-300" />

          <div className="flex flex-col gap-2 mt-1">
            <div className="h-5 w-40 bg-gray-300 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="flex gap-2 mt-2">
              <div className="h-8 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* ✅ Phải: đánh giá + sản phẩm + phản hồi + tham gia */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 mt-6 md:mt-0">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className="h-4 w-20 bg-gray-300 rounded" />
              <div className="w-px h-5 bg-gray-200 mx-3 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ Loading chi tiết sản phẩm
// components/loading/ProductDetailSkeleton.tsx

export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[80px] pb-10">
      <div className="mb-8">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 rounded-md w-1/4 animate-pulse"></div>
      </div>

      <div className="rounded-xl border shadow-sm bg-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Gallery & Like Button Skeleton */}
          <div className="md:col-span-6 flex flex-col gap-4 relative">
            <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-2 mt-2">
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="md:col-span-6 space-y-6">
            <div className="h-8 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-4 bg-gray-200 rounded-md w-1/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/4 animate-pulse"></div>
            </div>

            <div className="h-10 bg-gray-200 rounded-md w-1/3 animate-pulse"></div>

            {/* Options Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded-md w-1/5 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded-md w-1/5 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-4 mt-6">
              <div className="h-11 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-11 w-40 bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            {/* Policy Skeleton */}
            <div className="border rounded-lg divide-y text-sm mt-6">
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections skeletons */}
      <div className="max-w-screen-xl mx-auto px-4 mt-16 space-y-16">
        {/* Shop Info Skeleton */}
        <div className="border shadow-sm p-6 rounded-xl space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Product Description Skeleton */}
        <div className="border rounded-xl shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
        </div>

        {/* Reviews Skeleton */}
        <div className="border rounded-xl shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded-md w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


