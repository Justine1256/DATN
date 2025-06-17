// components/product/list/SkeletonRow.tsx
const ProductRowSkeleton = () => (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-4 px-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full" />
        <div className="flex flex-col gap-1">
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="py-4 px-3"><div className="h-4 w-16 bg-gray-300 rounded"></div></td>
      <td className="py-4 px-3"><div className="h-4 w-10 bg-gray-300 rounded"></div></td>
      <td className="py-4 px-3"><div className="h-4 w-24 bg-gray-300 rounded"></div></td>
      <td className="py-4 px-3"><div className="h-4 w-24 bg-gray-300 rounded"></div></td>
      <td className="py-4 px-3"><div className="h-4 w-12 bg-gray-300 rounded"></div></td>
      <td className="py-4 px-3 text-center">
        <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
      </td>
    </tr>
  );
  
  export default ProductRowSkeleton;
  // cate
  export const CategoryRowSkeleton = () => (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-4 px-3">
        <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
      </td>
      <td className="py-4 px-3">
        <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
      </td>
      <td className="py-4 px-3 text-center">
        <div className="h-4 w-8 bg-gray-300 rounded mx-auto"></div>
      </td>
      <td className="py-4 px-3 text-center">
        <div className="h-4 w-20 bg-gray-300 rounded mx-auto"></div>
      </td>
      <td className="py-4 px-3">
        <div className="h-8 w-20 bg-gray-300 rounded"></div>
      </td>
    </tr>
  );