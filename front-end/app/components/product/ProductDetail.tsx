// components/ProductDetail.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import BestSellingSlider from '../home/RelatedProduct';
import Cookies from 'js-cookie';
import ShopInfo from './ShopInfo';
import LoadingProductDetail from '../loading/loading';
import ProductDescription from '../product/ProductDescription';
import ShopProductSlider from '../home/ShopProduct';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import Breadcrumb from '../cart/CartBreadcrumb';
import { AiFillHeart } from 'react-icons/ai';
import { FiHeart } from 'react-icons/fi';
import ProductGallery from './ProductGallery'; 
import { Product,ProductDetailProps } from './hooks/Product'

// Hàm formatImageUrl có thể để ở đây hoặc chuyển sang file tiện ích chung
// (Nếu ProductGallery cũng dùng, nên cân nhắc tạo một file util chung)
const formatImageUrl = (img: string | string[]): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== 'string' || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  if (img.startsWith('http')) return img;
  return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
};



export default function ProductDetail({ shopslug, productslug }: ProductDetailProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');



  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || Cookies.get('authToken');
        const productRes = await fetch(`${API_BASE_URL}/${shopslug}/product/${productslug}`);

        if (!productRes.ok) {
          router.push('/not-found');
          return;
        }

        const productData: Product = await productRes.json();
        console.log('📦 Product Data từ API:', productData);

        setProduct(productData);

        // Đảm bảo mainImage được thiết lập từ ảnh đầu tiên trong mảng
        const firstImage = Array.isArray(productData.image) && productData.image.length > 0 ? productData.image[0] : '';
        setMainImage(formatImageUrl(firstImage));

        // Thiết lập màu/kích thước đã chọn ban đầu nếu có và chưa được thiết lập
        if (!selectedColor && productData.value1) {
          const colors = productData.value1.split(',').map(c => c.trim());
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
        if (!selectedSize && productData.value2) {
          const sizes = productData.value2.split(',').map(s => s.trim());
          if (sizes.length > 0) setSelectedSize(sizes[0]);
        }

        if (token) {
          // Lấy trạng thái yêu thích
          const wishlistRes = await fetch(`${API_BASE_URL}/wishlist/check/${productData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            setLiked(wishlistData.is_liked);
          } else {
            console.warn('Không thể lấy trạng thái yêu thích:', wishlistRes.statusText);
          }

          // Lấy trạng thái theo dõi cửa hàng
          if (productData.shop?.id) {
            const followRes = await fetch(`${API_BASE_URL}/shops/${productData.shop.id}/is-following`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (followRes.ok) {
              const followData = await followRes.json();
              setFollowed(followData.followed);
            } else {
              console.warn('Không thể lấy trạng thái theo dõi:', followRes.statusText);
            }
          }
        }
      } catch (err) {
        console.error('❌ Lỗi khi tải sản phẩm & trạng thái theo dõi:', err);
      }
    };

    fetchData();
  }, [shopslug, productslug, router, selectedColor, selectedSize]);

  if (!product) return <LoadingProductDetail />;

  let colorOptions: string[] = [];
  try {
    const parsed = JSON.parse(product.value1 || '[]');
    if (Array.isArray(parsed)) {
      colorOptions = parsed.map((c) => c.trim());
    }
  } catch (e) {
    colorOptions = (product.value1 || '').split(',').map((c) => c.trim());
  }

  let sizeOptions: string[] = [];
  try {
    const parsed = JSON.parse(product.value2 || '[]');
    if (Array.isArray(parsed)) {
      sizeOptions = parsed.map((s) => s.trim());
    }
  } catch (e) {
    sizeOptions = (product.value2 || '').split(',').map((s) => s.trim());
  }

  const handleAddToCart = async () => {
    const token = Cookies.get("authToken") || localStorage.getItem("token");
    if (!token) {
      setPopupText("Vui lòng đăng nhập để mua hàng");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          option1: selectedColor,
          option2: selectedSize,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Thêm sản phẩm thất bại');
      }

      window.dispatchEvent(new Event("cartUpdated"));

      setPopupText("Đã thêm vào giỏ hàng!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (error: any) {
      console.error("Lỗi thêm vào giỏ hàng:", error);
      setPopupText(`Lỗi khi thêm vào giỏ hàng: ${error.message}`);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  const toggleLike = async () => {
    if (!product) return;
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      setShowPopup(true);
      setPopupText('Vui lòng đăng nhập để yêu thích sản phẩm');
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked);

    try {
      if (newLiked) {
        await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_id: product.id }),
        });
      } else {
        await fetch(`${API_BASE_URL}/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('❌ Lỗi xử lý yêu thích:', err);
      setLiked(!newLiked);
      setPopupText('Có lỗi xảy ra khi cập nhật yêu thích.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } finally {
      setShowPopup(true);
      setPopupText(newLiked ? 'Đã thêm vào mục yêu thích!' : 'Đã xóa khỏi mục yêu thích!');
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token || !product?.shop?.id) {
      setPopupText('Vui lòng đăng nhập để theo dõi cửa hàng');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const url = `${API_BASE_URL}/shops/${product.shop.id}/${followed ? 'unfollow' : 'follow'}`;
      const method = followed ? 'DELETE' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFollowed(!followed);
        setPopupText(followed ? 'Đã bỏ theo dõi cửa hàng' : 'Đã theo dõi cửa hàng');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      } else {
        const errorData = await res.json();
        setPopupText(errorData.message || 'Lỗi khi theo dõi/bỏ theo dõi cửa hàng');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (err) {
      console.error('❌ Lỗi theo dõi/bỏ theo dõi:', err);
      setPopupText('Có lỗi xảy ra khi xử lý theo dõi.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) {
      setPopupText('Vui lòng đăng nhập để mua sản phẩm');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product?.id,
          quantity: quantity,
          option1: selectedColor,
          option2: selectedSize,
        }),
      });

      if (res.ok) {
        router.push('/cart');
      } else {
        const data = await res.json();
        setPopupText(data.message || 'Thêm vào giỏ hàng thất bại');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (err) {
      console.error('❌ Lỗi khi mua ngay:', err);
      setPopupText('Có lỗi xảy ra');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[80px] pb-10 relative">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: product.category?.parent?.name || 'Danh mục', href: `/category/${product.category?.parent?.slug}` },
            { label: product.category?.name || 'Danh mục', href: `/category/${product.category?.slug}` },
            { label: product.name },
          ]}
        />
      </div>
      <div className="rounded-xl border shadow-sm bg-white p-10 borde">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Thay thế phần hiển thị ảnh bằng ProductGallery component */}
          <div className="md:col-span-6 flex flex-col gap-4 relative">
            {/* Nút yêu thích vẫn ở đây nếu bạn muốn nó nằm trên cùng của ProductDetail */}
            <button
              onClick={toggleLike}
              className="absolute top-2 left-2 p-2 text-[22px] z-20 transition-colors duration-200 select-none"
            >
              {liked ? (
                <AiFillHeart className="text-brand transition-colors duration-200" />
              ) : (
                <FiHeart className="text-gray-400 transition-colors duration-200" />
              )}
            </button>
            <ProductGallery
              images={product.image}
              mainImage={mainImage}
              setMainImage={setMainImage}
            />
          </div>

          {/* ✅ Thông tin sản phẩm bên phải (giữ nguyên) */}
          <div className="md:col-span-6 space-y-6 ">
            <h1 className="text-[1.5rem] md:text-[1.7rem] font-bold text-gray-900">{product.name}</h1>
            {/* ✅ rating */}
            <div className="flex items-center gap-3 text-sm -translate-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-base">
                  {/* Rating or "Chưa đánh giá" */}
                  {parseFloat(product.rating) > 0 ? (
                    <>
                      <span className="text-gray-800 flex items-center">
                        {(parseFloat(product.rating) / 2).toFixed(1)}
                      </span>
                      {/* ⭐ Icon sao (5 ngôi sao, tính theo rating / 2) */}
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) =>
                          i < Math.round(parseFloat(product.rating) / 2) ? (
                            <FaStar key={i} className="text-yellow-400" />
                          ) : (
                            <FaRegStar key={i} className="text-gray-300" />
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-red-500 font-semibold">Chưa đánh giá</span>
                  )}
                </div>
              </div>

              <span className="text-gray-500">(150 Lượt Xem)</span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-400 font-medium">
                Hàng trong kho: {product.stock || 0} sản phẩm
              </span>
            </div>

            {/* ✅ giá */}
            <div className="flex items-center gap-3 -translate-y-6">
              <span className="text-[1.25rem] md:text-[1.5rem] font-bold text-brand">
                {Number(product.sale_price || product.price).toLocaleString('vi-VN')}₫
              </span>
              {product.sale_price && (
                <span className="line-through text-gray-400 text-sm ">
                  {Number(product.price).toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>

            {/* ✅ Options màu và size */}
            <div className="flex flex-col gap-4 -translate-y-10">
              {/* Màu sắc */}
              <div className="flex flex-col gap-2">
                <p className="font-medium text-gray-700 text-lg">Màu Sắc:</p>
                <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                  {colorOptions.map((color) => {
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative px-4 py-2 rounded-lg text-sm font-semibold border transition-all min-w-[80px]
                                ${selectedColor === color
                            ? 'border-red-600 text-black bg-white'
                            : 'border-gray-300 text-black bg-white hover:border-red-500'}`}
                      >
                        {selectedColor === color && (
                          <div
                            className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                            style={{
                              borderBottomLeftRadius: '7px',
                              borderTopRightRadius: '7px',
                            }}
                          >
                            <span className="text-white text-[9px] font-bold leading-none">✓</span>
                          </div>
                        )}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kích cỡ */}
              <div className="flex flex-col gap-2">
                <p className="font-medium text-gray-700 text-lg">Kích cỡ:</p>
                <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`relative px-4 py-2 rounded-lg text-sm font-semibold border transition-all min-w-[80px]
                              ${selectedSize === size
                          ? 'border-red-600 text-black bg-white'
                          : 'border-gray-300 text-black bg-white hover:border-red-500'}`}
                    >
                      {selectedSize === size && (
                        <div
                          className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                          style={{
                            borderBottomLeftRadius: '7px',
                            borderTopRightRadius: '7px',
                          }}
                        >
                          <span className="text-white text-[9px] font-bold leading-none">✓</span>
                        </div>
                      )}
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ✅ Số lượng và hành động */}
            <div className="flex items-center gap-3 mt-4 -translate-y-10">
              <div className="flex border rounded overflow-hidden h-[44px] w-[165px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-[55px] text-2xl font-extrabold text-black hover:bg-brand hover:text-white transition"
                >
                  −
                </button>
                <span className="w-[55px] flex items-center justify-center text-base font-extrabold text-black">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-[55px] text-2xl font-extrabold text-black hover:bg-brand hover:text-white transition"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-[165px] h-[44px] bg-brand text-white text-sm md:text-base rounded hover:bg-red-600 transition font-medium"
              >
                Mua Ngay
              </button>
              <button
                onClick={handleAddToCart}
                className="w-[165px] h-[44px] text-brand border border-brand text-sm md:text-base rounded hover:bg-brand hover:text-white transition font-medium"
              >
                Thêm Vào Giỏ Hàng
              </button>
            </div>

            {/* ✅ Chính sách vận chuyển */}
            <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6 -translate-y-11">
              <div className="flex items-center gap-3 p-4">
                <div className="flex justify-center items-center h-[40px]">
                  <Image src="/ship.png" alt="Logo" width={30} height={40} />
                </div>
                <div>
                  <p className="font-semibold">Giao hàng miễn phí</p>
                  <p>
                    <a className="no-underline" href="#">
                      Giao hàng miễn phí tại nội thành & một số khu vực ngoại thành
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4">
                <div className="flex justify-center items-center h-[40px]">
                  <Image src="/trahang.png" alt="Logo" width={30} height={40} />
                </div>
                <div>
                  <p className="font-semibold">Trả hàng</p>
                  <p>Giao hàng miễn phí trong vòng 30 ngày.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Thông tin cửa hàng */}
      <ShopInfo
        shop={product.shop || undefined}
        followed={followed}
        onFollowToggle={handleFollow}
      />

      <ProductDescription
        html={product.description}
      />

      {/* Gợi ý sản phẩm shop */}
      <div className="w-full max-w-screen-xl mx-auto mt-16">
        <ShopProductSlider />
      </div>

      ---

      {/* Gợi ý sản phẩm khác */}
      <div className="w-full max-w-screen-xl mx-auto mt-6">
        <BestSellingSlider />
      </div>
      {/* Thông báo thêm/xoá yêu thích */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {popupText ||
            (liked ? 'Đã thêm vào mục yêu thích!' : 'Đã xóa khỏi mục yêu thích!')}
        </div>
      )}
    </div>
  );
}