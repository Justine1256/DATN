'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import ProductGallery from './ProductGallery';
import { Product, ProductDetailProps, Variant } from './hooks/Product';

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
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');

  const parseOptionValues = (value?: string | string[]): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => v.trim());
    return value.split(',').map(v => v.trim());
  };

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`${API_BASE_URL}/${shopslug}/product/${productslug}`);
      if (!res.ok) return router.push('/not-found');
      const { data } = await res.json();
      setProduct(data);
      setMainImage(formatImageUrl(data.image[0] || ''));
      if (data.variants.length) {
        setSelectedA(data.variants[0].value1);
        setSelectedB(data.variants[0].value2);
        setSelectedVariant(data.variants[0]);
      } else {
        setSelectedA(parseOptionValues(data.value1)[0] || '');
        setSelectedB(parseOptionValues(data.value2)[0] || '');
      }
    }
    fetchData();
  }, [shopslug, productslug, router]);

  if (!product) return <LoadingProductDetail />;

  // gom mọi option từ product + variants
  const optsA = Array.from(new Set([
    ...parseOptionValues(product.value1),
    ...product.variants.map(v => v.value1)
  ].filter(v => v)));
  const optsB = Array.from(new Set([
    ...parseOptionValues(product.value2),
    ...product.variants.map(v => v.value2)
  ].filter(v => v)));

const hasCombination = (a: string, b: string) => {
  // Nếu sản phẩm không có variant thì enable hết
  if (!product.variants.length) return true;

  // Nếu (a,b) đúng cặp value1/value2 trong bảng product → enable
  if (
    (!a || parseOptionValues(product.value1).includes(a)) &&
    (!b || parseOptionValues(product.value2).includes(b))
  ) {
    return true;
  }

  // Nếu (a,b) đúng cặp trong variants → enable
  if (a && b) {
    return product.variants.some(v => v.value1 === a && v.value2 === b);
  }

  if (a && !b) {
    return product.variants.some(v => v.value1 === a);
  }

  if (!a && b) {
    return product.variants.some(v => v.value2 === b);
  }

  // Nếu chưa chọn gì thì enable hết
  return true;
};





const isFromProduct = 
  parseOptionValues(product.value1).includes(selectedA) &&
  parseOptionValues(product.value2).includes(selectedB);

const getPrice = () => {
  if (selectedVariant) {
    return Number(selectedVariant.sale_price || selectedVariant.price).toLocaleString('vi-VN');
  }
  if (isFromProduct) {
    return Number(product.sale_price || product.price).toLocaleString('vi-VN');
  }
  return Number(product.sale_price || product.price).toLocaleString('vi-VN');
};

const getStock = () => {
  if (selectedVariant) {
    return selectedVariant.stock;
  }
  if (isFromProduct) {
    return product.stock;
  }
  return product.stock;
};

  // lấy variant / giá / stock dựa vào selectedA/B
const matched = selectedVariant || product.variants.find(v =>
  v.value1 === selectedA && v.value2 === selectedB
);


  // handlers chung
const handleSelectA = (a: string) => {
  setSelectedA(a);

  const v = product.variants.find(v =>
    v.value1 === a && (selectedB ? v.value2 === selectedB : true)
  );

  if (v) {
    setSelectedVariant(v);
    if (!selectedB) setSelectedB(v.value2);
  } else {
    setSelectedVariant(null);
  }
};

const handleSelectB = (b: string) => {
  setSelectedB(b);

  const v = product.variants.find(v =>
    v.value2 === b && (selectedA ? v.value1 === selectedA : true)
  );

  if (v) {
    setSelectedVariant(v);
    if (!selectedA) setSelectedA(v.value1);
  } else {
    setSelectedVariant(null);
  }
};


  const commonPopup = (msg: string) => {
    setPopupText(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

const handleAddToCart = async () => {
  const token = Cookies.get('authToken') || localStorage.getItem('token');
  if (!token) return commonPopup('Vui lòng đăng nhập để thêm vào giỏ hàng');

  // Nếu sản phẩm có biến thể nhưng người dùng chưa chọn => chặn
  if (product.variants?.length > 0 && !selectedVariant?.id) {
    return commonPopup('Vui lòng chọn biến thể phù hợp');
  }

  const body = {
    product_id: product.id,
    quantity,
  };

  // Chỉ thêm variant_id nếu có biến thể
  if (selectedVariant?.id) {
    body.variant_id = selectedVariant.id;
  }

  const res = await fetch(`${API_BASE_URL}/cart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    commonPopup(`Đã thêm "${product.name}" vào giỏ hàng!`);
  } else {
    commonPopup('Thêm vào giỏ hàng thất bại');
  }
};


  const toggleLike = async () => {
    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) return commonPopup('Vui lòng đăng nhập để yêu thích sản phẩm');
    if (!liked) {
      await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id })
      });
      setLiked(true);
      commonPopup('Đã thêm vào mục yêu thích!');
    } else {
      await fetch(`${API_BASE_URL}/wishlist/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setLiked(false);
      commonPopup('Đã xóa khỏi mục yêu thích!');
    }
  };

  const handleFollow = async () => {
    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) return commonPopup('Vui lòng đăng nhập để theo dõi cửa hàng');
    const url = `${API_BASE_URL}/shops/${product.shop.id}/${followed ? 'unfollow' : 'follow'}`;
    await fetch(url, { method: followed ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
    setFollowed(!followed);

  };
  const handleBuyNow = () => {
    // Add item to cart logic
    // Then redirect to the cart page
    router.push('/cart');  // For Next.js, use `useRouter` for routing
  }
  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[80px] pb-10 relative">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: product.category.parent?.name || 'Danh mục', href: `/category/${product.category.parent?.slug}` },
            { label: product.category.name, href: `/category/${product.category.slug}` },
            { label: product.name }
          ]}
        />
      </div>

      <div className="rounded-xl border shadow-sm bg-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Gallery & like */}
          <div className="md:col-span-6 flex flex-col gap-4 relative">
            <button onClick={toggleLike} className="absolute top-2 left-2 p-2 text-[22px] z-20">
              {liked ? <AiFillHeart className="text-red-500" /> : <AiOutlineHeart className="text-red-500" />}
            </button>
            <ProductGallery images={product.image} mainImage={mainImage} setMainImage={setMainImage} />
          </div>

          {/* Info */}
          <div className="md:col-span-6 space-y-4">
            <h1 className="text-[1.5rem] md:text-[1.7rem] font-bold text-gray-900">{product.name}</h1>
            {/* Rating, stock */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-base">
                  {parseFloat(product.rating) > 0 ? (
                    <>
                      <span className="text-gray-800 flex items-center">
                        {(parseFloat(product.rating) / 2).toFixed(1)}
                      </span>
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

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-[1.5rem] font-bold text-brand">{getPrice()}₫</span>

              {selectedVariant ? (
                selectedVariant.sale_price && (
                  <span className="line-through text-gray-400">
                    {Number(selectedVariant.price).toLocaleString('vi-VN')}₫
                  </span>
                )
              ) : isFromProduct && product.sale_price ? (
                <span className="line-through text-gray-400">
                  {Number(product.price).toLocaleString('vi-VN')}₫
                </span>
              ) : null}
            </div>


            {/* Option A */}
            <div className="flex flex-col gap-2 mb-4 mt-4">
              <p className="font-medium text-gray-700 text-lg">{product.option1 || ''}</p>
              <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                {optsA.map(a => (
                  <button
                    key={a}
                    onClick={() => handleSelectA(a)}
                    disabled={!hasCombination(a, selectedB)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold border transition-all min-w-[80px] ${selectedA === a
                      ? 'border-red-600 text-black bg-white'
                      : 'border-gray-300 text-black bg-white hover:border-red-500'
                      } ${!hasCombination(a, selectedB) ? 'opacity-50' : ''}`}
                  >
                    {selectedA === a && (
                      <div className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                        style={{
                          borderBottomLeftRadius: '7px',
                          borderTopRightRadius: '7px'
                        }}>
                        <span className="text-white text-[9px] font-bold leading-none">✓</span>
                      </div>
                    )}
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Option B */}
            <div className="flex flex-col gap-2 mb-4 mt-4">
              <p className="font-medium text-gray-700 text-lg">{product.option2 || ''}</p>
              <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                {optsB.map(b => (
                  <button
                    key={b}
                    onClick={() => handleSelectB(b)}
                    disabled={!hasCombination(selectedA, b)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold border transition-all min-w-[80px] ${selectedB === b
                      ? 'border-red-600 text-black bg-white'
                      : 'border-gray-300 text-black bg-white hover:border-red-500'
                      } ${!hasCombination(selectedA, b) ? 'opacity-50' : ''}`}
                  >
                    {selectedB === b && (
                      <div className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                        style={{
                          borderBottomLeftRadius: '7px',
                          borderTopRightRadius: '7px'
                        }}>
                        <span className="text-white text-[9px] font-bold leading-none">✓</span>
                      </div>
                    )}
                    {b}
                  </button>
                ))}
              </div>
            </div>


            {/* Quantity & actions */}
            <div className="flex items-center gap-3 mt-4">
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
                onClick={() => {
                  handleAddToCart();
                  handleBuyNow(); // Trigger buying and redirecting to cart
                }}
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
            {/* Chính sách vận chuyển */}
            <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6">
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

      {/* Shop Info & Description */}
      <ShopInfo shop={product.shop} followed={followed} onFollowToggle={handleFollow} />
      <ProductDescription html={product.description} />

      {/* Related */}
      <div className="mt-16">
        <ShopProductSlider shopSlug={product.shop.slug} />
      </div>
      <div className="mt-6">
        <BestSellingSlider />
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-brand animate-slideInFade">
          {popupText ||
            (liked ? 'Đã thêm vào mục yêu thích!' : 'Đã xóa khỏi mục yêu thích!')}
        </div>
      )}

    </div>
  );
}