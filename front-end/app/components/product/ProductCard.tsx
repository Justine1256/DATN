'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { AiFillHeart, AiFillStar } from 'react-icons/ai';

export interface Product {
  id: number;
  name: string;
  image: string;
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  discount: number; // Assuming this is the percentage discount
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
}

// Hàm chuyển tên màu tiếng Việt sang mã HEX tương ứng
const convertColorNameToHex = (color: string): string => {
  const map: Record<string, string> = {
    'đen': '#000000',
    'trắng': '#ffffff',
    'xanh': '#00bcd4',
    'xanh lá': '#00ff00',
    'vàng': '#ffff00',
    'đỏ': '#ff0000',
    'xám': '#cccccc',
  };
  return map[color.toLowerCase()] || '#999999';
};

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedOption1, setSelectedOption1] = useState(product.value1 || '');
  const [selectedOption2, setSelectedOption2] = useState(product.value2 || '');

  const option1List = product.value1?.split(',').map((v) => v.trim()) || [];
  const option2List = product.value2?.split(',').map((v) => v.trim()) || [];

  const handleLike = () => {
    setLiked(!liked);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleAddToCart = () => {
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleSalePriceClick = () => {
    alert(`Bạn đã nhấp vào "sale_price" cho sản phẩm ${product.name}!`);
    // Add more functionality here, e.g., show a modal with price history
  };

  const safeImageSrc = product.image.startsWith('http')
    ? product.image
    : product.image.startsWith('/')
    ? product.image
    : `/${product.image}`;

  // Determine if there's any active discount
  const hasDiscount = (product.discount && product.discount > 0) || (product.oldPrice && product.oldPrice > 0);

  return (
    <div className="group relative bg-white rounded-lg border shadow-sm p-3 w-full max-w-[250px] flex flex-col justify-start mx-auto overflow-hidden">
      {/* Popup Thêm vào yêu thích */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-neutral-900 text-white text-xs px-4 py-2 rounded shadow-xl border border-red-500 animate-fadeIn">
          {liked ? 'Đã thêm vào yêu thích' : 'Đã hủy yêu thích'}
        </div>
      )}

      {/* Phần trăm giảm giá - Chỉ hiển thị nếu có discount > 0 */}
      {product.discount > 0 && (
        <div className="absolute top-2 left-2 bg-[#DC4B47] text-white text-xs px-2 py-0.5 rounded">
          -{product.discount}%
        </div>
      )}

      {/* Nút trái tim */}
      <button onClick={handleLike} className="absolute top-2 right-2 text-xl z-10">
        {liked ? <AiFillHeart className="text-red-500" /> : <FiHeart className="text-gray-500" />}
      </button>

      {/* Ảnh sản phẩm có thể click */}
      <Link href={`/product/${product.slug}`} className="w-full flex justify-center items-center h-[140px] mt-2">
        <Image
          src={`http://localhost:8000/api/image/${product.image}`}
          alt={product.name}
          width={120}
          height={120}
          className="object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer"
        />
      </Link>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-col mt-4 w-full px-1 pb-14">
        <h4 className="!text-[16px] font-semibold text-black truncate capitalize">{product.name}</h4>

        {/* Giá và nút "sale_price" */}
        <div className="flex gap-2 text-sm mt-1 items-center">
          <span className="text-red-500 font-semibold">
            {new Intl.NumberFormat('vi-VN').format(product.price)}đ
          </span>
          {/* Giá cũ - Chỉ hiển thị nếu có oldPrice */}
          {product.oldPrice && product.oldPrice > 0 && ( // Added product.oldPrice > 0 for explicit check
            <span className="text-gray-400 line-through text-[13px]">
              {new Intl.NumberFormat('vi-VN').format(product.oldPrice)}đ
            </span>
          )}
          {/* Nút "sale_price" - Chỉ hiển thị nếu có bất kỳ loại giảm giá nào */}
          {hasDiscount && (
            <button
              onClick={handleSalePriceClick}
              className="ml-auto px-2 py-1 bg-gray-100 text-blue-600 text-xs font-semibold rounded-sm border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-200 whitespace-nowrap"
              style={{ textDecoration: 'underline dotted' }}
            >
              sale_price
            </button>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
          {Array(5).fill(0).map((_, i) => <AiFillStar key={i} className="w-4 h-4" />)}
          <span className="text-gray-600 text-xs">(88)</span>
        </div>

        {/* Tùy chọn màu sắc và dung lượng */}
        {(option1List.length > 0 || option2List.length > 0) && (
          <div className="mt-3 flex items-center gap-3 text-sm text-gray-800 flex-wrap">

            {/* Màu sắc */}
            {option1List.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-gray-600">Màu sắc:</span>
                <div className="flex gap-1">
                  {option1List.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedOption1(color)}
                      className={`w-5 h-5 !rounded-full ${
                        selectedOption1 === color ? 'ring-2 ring-black' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: convertColorNameToHex(color) }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bộ nhớ */}
            {option2List.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-gray-600">{product.option2}:</span>
                <div className="flex gap-1">
                  {option2List.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption2(opt)}
                      className={`text-[12px] px-2 py-[1px] !rounded-md transition duration-200 ${
                        selectedOption2 === opt ? 'bg-black text-white' : 'bg-gray-200 text-black'
                      }`}
                      title={opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nút Add to cart hiển thị khi hover */}
      <button
        onClick={handleAddToCart}
        className="absolute bottom-0 left-0 right-0 bg-black text-white text-xs py-2 rounded-b-lg items-center justify-center gap-2 transition-all duration-300 hidden group-hover:flex cursor-pointer"
      >
        <FiShoppingCart className="text-sm" />
        Add to cart
      </button>
    </div>
  );
}