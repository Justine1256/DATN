"use client";

// ✅ Loading khung sản phẩm trong danh sách
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
export const LoadingProductDetail = () => {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[80px] pb-10 animate-pulse">
      <div className="rounded-xl border shadow-sm bg-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* ✅ Hình ảnh bên trái */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-gray-200 rounded-lg w-full h-[320px]" />
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-[80px] h-[80px] bg-gray-300 rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* ✅ Thông tin bên phải */}
          <div className="md:col-span-6 space-y-4">
            <div className="h-6 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-400 rounded w-1/4" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
            <div className="h-10 bg-gray-300 rounded w-3/4" />
            <div className="flex gap-4 mt-4">
              <div className="w-[165px] h-[44px] bg-gray-300 rounded" />
              <div className="w-[165px] h-[44px] bg-gray-300 rounded" />
              <div className="w-11 h-[44px] bg-gray-200 rounded" />
            </div>
            <div className="h-[100px] bg-gray-100 rounded-lg mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Loading đơn giản khi chờ API
export default function FollowedShopLoading() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
export function AddressCardLoading() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
