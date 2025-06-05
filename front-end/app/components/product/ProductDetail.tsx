'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// ✅ Interface định nghĩa dữ liệu sản phẩm
interface Product {
  name: string;
  price: number;
  sale_price?: number;
  description: string;
  image: string;
  images?: string[];
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  stock?: number;
}

export default function ProductDetail() {
  // ✅ Lấy slug cửa hàng và slug sản phẩm từ URL
  const { shopslug, productslug } = useParams() as {
    shopslug: string;
    productslug: string;
  };

  // ✅ Khởi tạo state cho dữ liệu sản phẩm và các tương tác người dùng
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [liked, setLiked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // ✅ Gọi API để lấy thông tin sản phẩm
  useEffect(() => {
    const url = `http://localhost:8000/api/${shopslug}/product/${productslug}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.images) {
          data.images = ['/1.webp', '/2.webp', '/3.webp', '/4.webp'];
        }
        setProduct(data);
        setMainImage(data.image.startsWith('/') ? data.image : `/${data.image}`);
        setSelectedColor(data.value1?.split(',')[0] || '');
        setSelectedSize(data.value2?.split(',')[0] || '');
      })
      .catch((err) => setError(err.message));
  }, [shopslug, productslug]);

  // ✅ Toggle yêu thích
  const toggleLike = () => {
    setLiked((prev) => {
      const newLiked = !prev;
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return newLiked;
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!product) return <div className="p-6">Loading product...</div>;

  const thumbnails = product.images?.map((img) => (img.startsWith('/') ? img : `/${img}`)) || [`/${product.image}`];
  const colorOptions = product.value1?.split(',') || [];
  const sizeOptions = product.value2?.split(',') || [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[120px] pb-10 relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* ✅ Hình ảnh sản phẩm */}
        <div className="md:col-span-7 flex flex-col md:flex-row gap-6">
          <div className="flex md:flex-col gap-3">
            {thumbnails.map((thumb, idx) => (
              <Image
                key={idx}
                src={thumb}
                alt={`Thumb ${idx}`}
                width={80}
                height={80}
                className={`cursor-pointer border rounded ${mainImage === thumb ? 'border-[#DC4B47]' : 'border-gray-300'}`}
                onClick={() => setMainImage(thumb)}
              />
            ))}
          </div>
          <div className="flex justify-center items-center w-full">
            <Image
              src={mainImage}
              alt={product.name}
              width={500}
              height={500}
              className="object-contain rounded-lg"
            />
          </div>
        </div>

        {/* ✅ Chi tiết sản phẩm */}
        <div className="md:col-span-5 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center text-yellow-400">{'★'.repeat(4)}<span className="text-gray-300 ml-0.5">★</span></div>
            <span className="text-gray-500">(150 Reviews)</span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-400 font-medium">In Stock: {product.stock || 0} items available</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#DC4B47]">
              {product.sale_price?.toLocaleString() || product.price.toLocaleString()}₫
            </span>
            {product.sale_price && (
              <span className="line-through text-gray-400 text-sm">
                {product.price.toLocaleString()}₫
              </span>
            )}
          </div>

          <p className="text-gray-600">{product.description}</p>
          <hr className="my-2 w-16 border-t-2 border-gray-200" />

          {/* ✅ Màu và Size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <p className="font-medium text-gray-700 text-sm">Colors:</p>
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-4 h-4 rounded-full border transition ${selectedColor === color ? 'border-black scale-105' : 'border-gray-300 hover:border-black'}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="font-medium text-gray-700 text-sm">Size:</p>
              <div className="flex gap-1">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`text-xs min-w-[28px] px-2 py-0.5 rounded border text-center font-medium transition ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-black hover:text-white'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ Số lượng + Hành động */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex border rounded overflow-hidden h-[44px] w-[165px]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-[55px] text-2xl font-extrabold text-black hover:bg-[#DC4B47] hover:text-white transition"
              >−</button>
              <span className="w-[55px] flex items-center justify-center text-base font-extrabold text-black">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-[55px] text-2xl font-extrabold text-black hover:bg-[#DC4B47] hover:text-white transition"
              >+</button>
            </div>

            <button className="w-[165px] h-[44px] bg-[#DC4B47] text-white text-sm rounded hover:bg-red-600 transition font-medium">Buy Now</button>
            <button className="w-[165px] h-[44px] text-[#DC4B47] border border-[#DC4B47] text-sm rounded hover:bg-[#DC4B47] hover:text-white transition font-medium">Add to Cart</button>

            <button
              onClick={toggleLike}
              className={`p-2 border rounded text-lg transition ${liked ? 'text-[#DC4B47]' : 'text-gray-400'}`}
            >{liked ? '❤️' : '🤍'}</button>
          </div>

          {/* ✅ Thông tin giao hàng */}
          <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6">
            <div className="flex items-start gap-3 p-4">
              <span className="text-xl">🚚</span>
              <div>
                <p className="font-semibold">Free Delivery</p>
                <p><a className="underline" href="#">Enter your postal code for Delivery Availability</a></p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <span className="text-xl">🔁</span>
              <div>
                <p className="font-semibold">Return Delivery</p>
                <p>Free 30 Days Delivery Returns. <a className="underline" href="#">Details</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Popup yêu thích */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#DC4B47] animate-slideInFade">
          {liked ? 'Added to favorites' : 'Removed from favorites'}
        </div>
      )}
    </div>
  );
}
