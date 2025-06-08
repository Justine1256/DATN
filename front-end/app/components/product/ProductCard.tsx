'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { AiFillHeart, AiFillStar } from 'react-icons/ai';
import { LoadingSkeleton } from '../loading/loading';

// ✅ Kiểu dữ liệu sản phẩm
export interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: number;
  shop_slug: string;
}

// ✅ Kiểu item đơn giản từ wishlist (nếu vẫn fetch bên trong)
interface WishlistItem {
  product_id: number;
}

// ✅ Component hiển thị sản phẩm
export default function ProductCard({
  product,
  onUnlike,
}: {
  product?: Product;
  onUnlike?: (productId: number) => void;
}) {
  const [liked, setLiked] = useState(false); // ✅ Trạng thái đã yêu thích
  const [showPopup, setShowPopup] = useState(false); // ✅ Trạng thái hiển thị popup
  const [popupMessage, setPopupMessage] = useState(''); // ✅ Nội dung popup
  const router = useRouter();

  // ✅ Kiểm tra nếu sản phẩm nằm trong wishlist của user
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token || !product) return;

    fetch('http://127.0.0.1:8000/api/wishlist', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: WishlistItem[]) => {
        // ❌ Gỡ console.log nếu không debug nữa
        const exists = data.some((item) => item.product_id === product.id);
        setLiked(exists);
      })
      .catch((err) => console.error('Lỗi kiểm tra wishlist:', err));
  }, [product]);

  // ✅ Loading state nếu chưa có sản phẩm
  if (!product) return <LoadingSkeleton />;

  // ✅ Kiểm tra có giảm giá không
  const hasDiscount = !!(product.sale_price && product.sale_price > 0);
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  // ✅ Xử lý nhấn ❤️ (like hoặc unlike)
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);

    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      setPopupMessage('Bạn cần đăng nhập để thêm vào yêu thích');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      if (newLiked) {
        // ✅ Gửi yêu cầu thêm vào wishlist
        const res = await fetch('http://127.0.0.1:8000/api/wishlist', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_id: product.id }),
        });
        if (!res.ok) throw new Error('Không thể thêm vào wishlist!');
        setPopupMessage('Đã thêm vào yêu thích');
      } else {
        // ✅ Gửi yêu cầu xóa khỏi wishlist
        const res = await fetch(`http://127.0.0.1:8000/api/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (!res.ok) throw new Error('Không thể xóa khỏi wishlist!');
        setPopupMessage('Đã xóa khỏi yêu thích');

        // ✅ Xóa khỏi giao diện nếu truyền `onUnlike` từ cha
        onUnlike?.(product.id);
      }
    } catch (err) {
      console.error('Lỗi xử lý wishlist:', err);
      setPopupMessage('Lỗi khi xử lý yêu thích');
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  // ✅ Thêm vào giỏ hàng (hiện popup thông báo)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopupMessage(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  // ✅ Chuyển đến trang chi tiết sản phẩm
  const handleViewDetail = () => {
    router.push(`/shop/${product.shop_slug}/product/${product.slug}`);
  };

  return (
    <div
      onClick={handleViewDetail}
      className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 w-full max-w-[250px] flex flex-col justify-start mx-auto overflow-hidden transition cursor-pointer"
    >
      {/* ✅ Popup thông báo (thêm/xóa giỏ hàng hoặc yêu thích) */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {popupMessage}
        </div>
      )}

      {/* ✅ Label giảm giá nếu có */}
      {hasDiscount && discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-brand text-white text-[10px] px-2 py-0.5 rounded">
          -{discountPercentage}%
        </div>
      )}

      {/* ✅ Icon yêu thích */}
      <button onClick={handleLike} className="absolute top-2 right-2 text-xl z-10">
        {liked ? <AiFillHeart className="text-red-500" /> : <FiHeart className="text-gray-500" />}
      </button>

      {/* ✅ Ảnh sản phẩm */}
      <div className="w-full h-[140px] mt-8 flex items-center justify-center">
        <Image
          src={`http://localhost:8000/storage/${product.image}`}
          alt={product.name}
          width={2220}
          height={120}
          className="object-contain max-h-[2220px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* ✅ Thông tin sản phẩm */}
      <div className="flex flex-col mt-4 w-full px-1 pb-14">
        <h4 className="text-sm font-semibold text-black truncate capitalize">
          {product.name}
        </h4>

        <div className="flex gap-2 mt-1 items-center">
          <span className="text-red-500 font-bold text-base">
            {new Intl.NumberFormat('vi-VN').format(
              hasDiscount ? product.sale_price! : product.price
            )}đ
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-xs">
              {new Intl.NumberFormat('vi-VN').format(product.price)}đ
            </span>
          )}
        </div>

        {/* ✅ Đánh giá sao (giả định cứng) */}
        <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
          {Array(5)
            .fill(0)
            .map((_, i: number) => (
              <AiFillStar key={i} className="w-4 h-4" />
            ))}
          <span className="text-gray-600 text-[10px]">(88)</span>
        </div>
      </div>

      {/* ✅ Nút "Add to cart" hiện khi hover */}
      <button
        onClick={handleAddToCart}
        className="absolute bottom-0 left-0 right-0 bg-brand text-white text-sm py-2.5 rounded-b-lg items-center justify-center gap-2 transition-all duration-300 hidden group-hover:flex"
      >
        <FiShoppingCart className="text-base" />
        Add to cart
      </button>
    </div>
  );
}
