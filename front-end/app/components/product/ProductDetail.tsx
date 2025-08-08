'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';

import BestSellingSlider from '../home/RelatedProduct';
import ShopInfo from './ShopInfo';
import LoadingProductDetail from '../loading/loading';
import ProductDescription from '../product/ProductDescription';
import ShopProductSlider from '../home/ShopProduct';
import Breadcrumb from '../cart/CartBreadcrumb';
import ProductGallery from './ProductGallery';
import ProductReviews from './review';
import { useRef } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from "@/app/context/WishlistContext";

import { Product, ProductDetailProps, Variant } from './hooks/Product';

// ✅ Format ảnh sản phẩm từ URL
const formatImageUrl = (img: string | string[]): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== 'string' || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  return img.startsWith('http') ? img : (img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`);
};

export default function ProductDetail({ shopslug, productslug }: ProductDetailProps) {
  const router = useRouter();

  // ✅ State sản phẩm
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // ✅ State biến thể sản phẩm
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  // thêm sản phẩm 
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  // mua ngay 
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // ✅ State yêu thích / theo dõi / popup
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [isLiking, setIsLiking] = useState(false);

  const [showSelectionWarning, setShowSelectionWarning] = useState(false);

  // ✅ Context giỏ hàng & yêu thích
  const { reloadCart } = useCart();
  const { reloadWishlist, wishlistItems } = useWishlist();

  // ✅ Tách giá trị biến thể từ chuỗi thành mảng
const parseOptionValues = (value?: string | string[]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => v.trim());
  return [value]; // trả nguyên chuỗi
};

  const isVariantRequiredButNotSelected = () => {
    return (
      (product?.variants ?? []).length > 0 &&
      (!selectedA.trim() || !selectedB.trim())
    );
  };
  // tăng giảm số lượng 
  const [isQuantityUpdating, setIsQuantityUpdating] = useState(false);
  const handleIncrease = () => {
    if (isQuantityUpdating) return;
    setIsQuantityUpdating(true);
    setQuantity(prev => prev + 1);
    setTimeout(() => setIsQuantityUpdating(false), 200); // delay 200ms
  };

  const handleDecrease = () => {
    if (isQuantityUpdating || quantity <= 1) return;
    setIsQuantityUpdating(true);
    setQuantity(prev => Math.max(1, prev - 1));
    setTimeout(() => setIsQuantityUpdating(false), 200); // delay 200ms
  };


  // ✅ Fetch chi tiết sản phẩm và ghi nhận lịch sử xem
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        const token = Cookies.get('authToken') || localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/${shopslug}/product/${productslug}`, {
          headers,
          signal,
        });

        if (!res.ok) throw new Error('Lỗi khi fetch sản phẩm');
        const { data } = await res.json();
        setProduct({
          ...data,
          variants: Array.isArray(data.variants) ? data.variants : [],
        });
        setMainImage(formatImageUrl(data.image?.[0] || ''));

        if (data?.id) {
          await fetch(`${API_BASE_URL}/products/history`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ product_id: data.id }),
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ Lỗi khi fetch chi tiết sản phẩm:', error);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort(); // huỷ nếu unmount
    };
  }, [shopslug, productslug]);


  // ✅ Tìm biến thể phù hợp khi chọn giá trị A/B
  useEffect(() => {
    if (!product) return;
    const matched = product.variants.find(
      v =>
        v.value1.trim().toLowerCase() === selectedA.trim().toLowerCase() &&
        v.value2.trim().toLowerCase() === selectedB.trim().toLowerCase()
    );
    setSelectedVariant(matched || null);
  }, [selectedA, selectedB, product]);

  // ✅ Loading khi chưa có dữ liệu
  if (!product) return <LoadingProductDetail />;

  // ✅ Giá trị đánh giá trung bình
  const ratingValue = typeof product.rating_avg === 'number'
    ? product.rating_avg
    : typeof product.rating === 'number'
      ? product.rating
      : 0;

  // ✅ Các option A/B từ product + variants
  const optsA = Array.from(new Set([
    ...product.variants.map(v => v.value1),
    ...parseOptionValues(product.value1)
  ].filter(Boolean)));

  const optsB = Array.from(new Set([
    ...product.variants.map(v => v.value2),
    ...parseOptionValues(product.value2)
  ].filter(Boolean)));

  // ✅ Kiểm tra sự kết hợp hợp lệ giữa A và B
  const hasCombination = (a: string, b: string) => {
    if (!product.variants.length) return true;
    const inVariant = product.variants.some(v => {
      const matchA = !a || v.value1 === a;
      const matchB = !b || v.value2 === b;
      return matchA && matchB;
    });
    const fromProduct =
      parseOptionValues(product.value1).includes(a) &&
      parseOptionValues(product.value2).includes(b);
    return inVariant || fromProduct;
  };

  // ✅ Kiểm tra selected có nằm trong product gốc
  const isFromProduct = parseOptionValues(product.value1).includes(selectedA)
    && parseOptionValues(product.value2).includes(selectedB);

  // ✅ Lấy giá hiện tại: Ưu tiên variant, sau đó đến product
  const getPrice = () => {
    if (selectedVariant) {
      return Number((selectedVariant.sale_price ?? selectedVariant.price) || 0).toLocaleString('vi-VN');
    }

    if (isFromProduct) {
      return Number((product.sale_price ?? product.price) || 0).toLocaleString('vi-VN');
    }

    return Number((product.sale_price ?? product.price) || 0).toLocaleString('vi-VN');
  };





  // ✅ Lấy tồn kho hiện tại
  const getStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    if (isFromProduct) return product.stock;
    return product.stock;
  };

  // ✅ Chọn biến thể A / B
  const handleSelectA = (a: string) => setSelectedA(a);
  const handleSelectB = (b: string) => setSelectedB(b);

  // ✅ Hiện popup nhanh
  const commonPopup = (msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPopupText(msg);
    setShowPopup(true);
    timeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      timeoutRef.current = null;
    }, 2000);
  };

  // ✅ Thêm vào giỏ hàng (token hoặc localStorage)
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    const token = Cookies.get('authToken');
    const hasVariants = product.variants?.length > 0;
    const selectedValuesFilled = selectedA && selectedB;

    const matchedVariant = product.variants.find(
      (v) => v.value1 === selectedA && v.value2 === selectedB
    );

    const isFromProductValues =
      product.value1?.toLowerCase() === selectedA?.toLowerCase() &&
      product.value2?.toLowerCase() === selectedB?.toLowerCase();

    if (hasVariants && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsAddingToCart(false);
      return;
    }

    setShowSelectionWarning(false);

    if (hasVariants && !matchedVariant && !isFromProductValues) {
      commonPopup("❌ Xin quý khách, hiện tại biến thể này đã hết hàng");
      setIsAddingToCart(false);
      return;
    }

    const useVariant = matchedVariant ?? null;
    const price = useVariant?.price ?? product.price;
    const sale_price = useVariant?.sale_price ?? product.sale_price;

    const cartItem = {
      product_id: product.id,
      quantity,
      name: product.name,
      image: Array.isArray(product.image) ? product.image[0] : '',
      price: Number(price || 0),
      sale_price: sale_price ? Number(sale_price) : null,
      value1: selectedA,
      value2: selectedB,
      variant_id: useVariant?.id ?? null,
      option1: product.option1 || 'Phân loại 1',
      option2: product.option2 || 'Phân loại 2',
      variant_price: useVariant?.price ?? null,
      variant_sale_price: useVariant?.sale_price ?? null,
      shop: {
        id: product.shop?.id,
        name: product.shop?.name,
        slug: product.shop?.slug,
      }

    };

    try {
      if (!token) {
        const local = localStorage.getItem("cart");
        const cart = local ? JSON.parse(local) : [];
        const index = cart.findIndex(
          (i: any) =>
            i.product_id === cartItem.product_id &&
            i.variant_id === cartItem.variant_id
        );

        if (index !== -1) {
          cart[index].quantity += quantity;
        } else {
          cart.push(cartItem);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        reloadCart();
        commonPopup(`🛒 Đã thêm "${cartItem.name}" vào giỏ hàng`);
      } else {
        const res = await fetch(`${API_BASE_URL}/cart`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartItem),
        });

        if (res.ok) {
          await reloadCart();
          commonPopup(`🛒 Đã thêm "${product.name}" vào giỏ hàng`);
        } else {
          const err = await res.json();
          console.error("❌ Cart API error:", err);
          commonPopup("❌ Thêm vào giỏ hàng thất bại");
        }
      }
    } catch (error) {
      console.error("❌ Cart request failed:", error);
      commonPopup("❌ Lỗi khi gửi yêu cầu giỏ hàng");
    } finally {
      setIsAddingToCart(false);
    }
  };



  // ✅ Thêm vào wishlist
  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) {
      commonPopup('Vui lòng đăng nhập để yêu thích sản phẩm');
      setIsLiking(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/wishlist`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (liked) {
        // ❌ Đã thích, giờ muốn bỏ thích
        const res = await fetch(`${url}/${product.id}`, {
          method: 'DELETE',
          headers,
        });

        if (!res.ok) throw new Error('Không thể hủy yêu thích');
        setLiked(false);
        commonPopup('Đã xóa khỏi mục yêu thích!');
      } else {
        // ❤️ Chưa thích → thêm mới
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ product_id: product.id }),
        });

        if (!res.ok && res.status !== 409) throw new Error('Không thể thêm vào yêu thích');
        setLiked(true);
        commonPopup('Đã thêm vào mục yêu thích!');
      }

      reloadWishlist();
    } catch (err) {
      console.error('❌ Lỗi xử lý yêu thích:', err);
      commonPopup('Có lỗi xảy ra!');
    } finally {
      setIsLiking(false);
    }
  };



  // ✅ Theo dõi shop
  const handleFollow = async () => {
    const token = Cookies.get('authToken') || localStorage.getItem('token');
    if (!token) return commonPopup('Vui lòng đăng nhập để theo dõi cửa hàng');

    const url = `${API_BASE_URL}/shops/${product.shop.id}/${followed ? 'unfollow' : 'follow'}`;
    await fetch(url, {
      method: followed ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    setFollowed(!followed);
  };

  // ✅ Mua ngay (thêm vào giỏ và chuyển trang)
  const handleBuyNow = async () => {
    if (isBuyingNow) return;
    setIsBuyingNow(true);

    const token = Cookies.get('authToken');
    const hasVariants = product.variants?.length > 0;
    const selectedValuesFilled = selectedA && selectedB;

    const matchedVariant = product.variants.find(
      (v) => v.value1 === selectedA && v.value2 === selectedB
    );

    const isFromProductValues =
      product.value1?.toLowerCase() === selectedA?.toLowerCase() &&
      product.value2?.toLowerCase() === selectedB?.toLowerCase();

    if (hasVariants && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsBuyingNow(false); // reset
      return;
    }

    setShowSelectionWarning(false);

    if (hasVariants && !matchedVariant && !isFromProductValues) {
      commonPopup("❌ Xin quý khách, hiện tại biến thể này đã hết hàng");
      setIsBuyingNow(false);
      return;
    }

    const useVariant = matchedVariant ?? null;
    const price = useVariant?.price ?? product.price;
    const sale_price = useVariant?.sale_price ?? product.sale_price;

    const cartItem = {
      product_id: product.id,
      quantity,
      name: product.name,
      image: Array.isArray(product.image) ? product.image[0] : '',
      price: Number(price || 0),
      sale_price: sale_price ? Number(sale_price) : null,
      value1: selectedA,
      value2: selectedB,
      variant_id: useVariant?.id ?? null,
      option1: product.option1 || 'Phân loại 1',
      option2: product.option2 || 'Phân loại 2',
      variant_price: useVariant?.price ?? null,
      variant_sale_price: useVariant?.sale_price ?? null,
      shop: {
        id: product.shop?.id,
        name: product.shop?.name,
        slug: product.shop?.slug,
      }

    };

    try {
      if (!token) {
        const local = localStorage.getItem("cart");
        const cart = local ? JSON.parse(local) : [];
        const index = cart.findIndex(
          (i: any) =>
            i.product_id === cartItem.product_id &&
            i.variant_id === cartItem.variant_id
        );

        if (index !== -1) {
          cart[index].quantity += quantity;
        } else {
          cart.push(cartItem);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        await reloadCart();
        router.push('/cart');
      } else {
        const res = await fetch(`${API_BASE_URL}/cart`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartItem),
        });

        if (res.ok) {
          await reloadCart();
          router.push('/cart');
        } else {
          const err = await res.json();
          console.error("❌ Cart API error:", err);
          commonPopup("❌ Thêm vào giỏ hàng thất bại");
        }
      }
    } catch (error) {
      console.error("❌ Cart request failed:", error);
      commonPopup("❌ Lỗi khi gửi yêu cầu giỏ hàng");
    } finally {
      setIsBuyingNow(false);
    }
  };



  // ⬇️ Phần hiển thị JSX sẽ viết bên dưới


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
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className="absolute top-2 left-2 p-2 text-[22px] z-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {liked ? (
                <AiFillHeart className="text-red-500" />
              ) : (
                <AiOutlineHeart className="text-red-500" />
              )}
            </button>

            <ProductGallery
              images={
                Array.isArray(product.image) && product.image.length > 0
                  ? product.image
                  : [`${STATIC_BASE_URL}/products/default-product.png`]
              }

              mainImage={mainImage}
              setMainImage={setMainImage}
            />

          </div>

          {/* Info */}
          <div className="md:col-span-6 space-y-4">
            <h1 className="text-[1.5rem] md:text-[1.7rem] font-bold text-gray-900">{product.name}</h1>
            {/* Rating, stock */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-base">
                {ratingValue > 0 && (
                  <>
                    <span className="text-gray-800 flex items-center">
                      {ratingValue.toFixed(1)}
                    </span>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) =>
                        i < Math.round(ratingValue) ? (
                          <FaStar key={i} className="text-yellow-400" />
                        ) : (
                          <FaRegStar key={i} className="text-gray-300" />
                        )
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Luôn hiển thị lượt đánh giá */}
              <span className="text-gray-500">
                {product.review_count && product.review_count > 0
                  ? `Lượt đánh giá: ${product.review_count}`
                  : 'Chưa có đánh giá'}
              </span>

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
            {showSelectionWarning && (
              <p className="text-red-500 text-sm mt-1">
                Vui lòng chọn đầy đủ phân loại hàng
              </p>
            )}

            {/* Quantity & actions */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex border rounded overflow-hidden h-[44px] w-[165px]">
                <button
                  onClick={handleDecrease}
                  disabled={isQuantityUpdating || quantity <= 1}
                  className={`w-[55px] text-2xl font-extrabold transition ${quantity <= 1 || isQuantityUpdating
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-black hover:bg-brand hover:text-white'
                    }`}
                >
                  −
                </button>

                <span className="w-[55px] flex items-center justify-center text-base font-extrabold text-black">
                  {quantity}
                </span>

                <button
                  onClick={handleIncrease}
                  disabled={isQuantityUpdating || quantity >= getStock()}
                  className={`w-[55px] text-2xl font-extrabold transition ${quantity >= getStock() || isQuantityUpdating
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-black hover:bg-brand hover:text-white'
                    }`}
                >
                  +
                </button>
              </div>


              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow}
                className={`w-[165px] h-[44px] bg-brand text-white text-sm md:text-base rounded transition font-medium hover:bg-red-600 ${isBuyingNow ? 'pointer-events-none opacity-50' : ''
                  }`}
              >
                Mua Ngay
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`w-[165px] h-[44px] text-sm md:text-base rounded transition font-medium border text-brand border-brand hover:bg-brand hover:text-white ${isAddingToCart ? 'pointer-events-none opacity-50' : ''
                  }`}
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
      <div className="max-w-screen-xl mx-auto px-4 mt-16 space-y-16">
        <ShopInfo shop={product.shop} followed={followed} onFollowToggle={handleFollow} />
        <ProductDescription html={product.description} />
        <ProductReviews productId={product.id} />
        <ShopProductSlider shopSlug={product.shop.slug} />
        <BestSellingSlider />
      </div>


      {/* Popup */}
      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
          {popupText ||
            (liked ? 'Đã thêm vào mục yêu thích!' : 'Đã xóa khỏi mục yêu thích!')}
        </div>
      )}


    </div>
  );
}