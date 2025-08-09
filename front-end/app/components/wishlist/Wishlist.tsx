'use client';
import { useWishlist } from '@/app/context/WishlistContext';
import ProductCard from "../product/ProductCard";

const Wishlist = () => {
  const { wishlistItems, addItem, removeItem } = useWishlist();

  const wishlistProductIds = wishlistItems.map((item) => item.product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-black">
          Danh sách yêu thích ({wishlistItems.length})
        </h2>
   
      </div>

      {wishlistItems.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          Hiện tại bạn chưa có sản phẩm yêu thích nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.product.id}
              product={item.product}
              onUnlike={() => removeItem(item.product.id)}
              onLiked={addItem}
              wishlistProductIds={wishlistProductIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
