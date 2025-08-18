'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';

import BestSellingSlider from '../home/RelatedProduct';
import ShopInfo from './ShopInfo';
import ProductDescription from '../product/ProductDescription';
import ShopProductSlider from '../home/ShopProduct';
import Breadcrumb from '../cart/CartBreadcrumb';
import ProductGallery from './ProductGallery';
import ProductReviews from './review';
import ProductDetailSkeleton from '../loading/loading';
import { useRef } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from "@/app/context/WishlistContext";

import { Product, ProductDetailProps, Variant } from './hooks/Product';

// Format ảnh sản phẩm từ URL
const formatImageUrl = (img: string | string[]): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== 'string' || !img.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  return img.startsWith('http') ? img : (img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`);
};

export default function ProductDetail({ shopslug, productslug }: ProductDetailProps) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);      // đã có
  const [currentUser, setCurrentUser] = useState<any>(null); // thêm (tuỳ chọn)

  // State sản phẩm
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // State biến thể sản phẩm
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  // thêm sản phẩm 
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  // mua ngay 
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  // tăng giảm số lượng nằm trong số lượng sp kho 
  const [stockWarning, setStockWarning] = useState('');

  // State yêu thích / theo dõi / popup
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  // Context giỏ hàng & yêu thích
  const { reloadCart } = useCart();
  const { reloadWishlist, wishlistItems } = useWishlist();

  // Tách giá trị biến thể từ chuỗi thành mảng
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
    setTimeout(() => setIsQuantityUpdating(false), 100); // delay 200ms
  };

  const handleDecrease = () => {
    if (isQuantityUpdating || quantity <= 1) return;
    setIsQuantityUpdating(true);
    setQuantity(prev => Math.max(1, prev - 1));
    setTimeout(() => setIsQuantityUpdating(false), 100); // delay 200ms
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) return; // ❗ Không đăng nhập -> không làm gì, isOwner vẫn false

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error("USER_API_FAILED");
        const userData = await res.json();
        const userPayload = userData?.data ?? userData; // tuỳ backend
        setCurrentUser(userPayload);

        // Nếu product đã có, so khớp luôn
        if (product?.shop) {
          const owner =
            (userPayload?.shop?.id ?? userPayload?.shop_id ?? userPayload?.shops?.[0]?.id) != null
              ? String(userPayload?.shop?.id ?? userPayload?.shop_id ?? userPayload?.shops?.[0]?.id) === String(product.shop.id)
              : (userPayload?.shop?.slug ?? userPayload?.shop_slug ?? userPayload?.shops?.[0]?.slug)
              && String(userPayload?.shop?.slug ?? userPayload?.shop_slug ?? userPayload?.shops?.[0]?.slug) === String(product.shop.slug);

          setIsOwner(Boolean(owner));
        }
      } catch {
        setCurrentUser(null);
        setIsOwner(false); // lỗi user -> coi như không phải chủ shop
      }
    })();
  }, []); // chỉ chạy 1 lần

  useEffect(() => {
    if (!product?.shop || !currentUser) return;
    const owner =
      (currentUser?.shop?.id ?? currentUser?.shop_id ?? currentUser?.shops?.[0]?.id) != null
        ? String(currentUser?.shop?.id ?? currentUser?.shop_id ?? currentUser?.shops?.[0]?.id) === String(product.shop.id)
        : (currentUser?.shop?.slug ?? currentUser?.shop_slug ?? currentUser?.shops?.[0]?.slug)
        && String(currentUser?.shop?.slug ?? currentUser?.shop_slug ?? currentUser?.shops?.[0]?.slug) === String(product.shop.slug);

    setIsOwner(Boolean(owner));
  }, [product, currentUser]);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!product?.shop?.id || !token) {
      setIsCheckingFollow(false);
      return;
    }

    const checkFollow = async () => {
      try {
        setIsCheckingFollow(true); // bắt đầu check
        const res = await fetch(`${API_BASE_URL}/shops/${product.shop.id}/is-following`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFollowed(data.followed);
      } catch (err) {
        console.error("Lỗi fetch follow status:", err);
      } finally {
        setIsCheckingFollow(false); // xong thì set false
      }
    };

    checkFollow();
  }, [product?.shop?.id]);

  // Fetch chi tiết sản phẩm và ghi nhận lịch sử xem
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort(); // huỷ nếu unmount
    };
  }, [shopslug, productslug]);

  // Tìm biến thể phù hợp khi chọn giá trị A/B
  useEffect(() => {
    if (!product) return;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    const matched = product.variants.find(
      (v) =>
        normalize(v.value1) === normalize(selectedA) &&
        normalize(v.value2) === normalize(selectedB)
    );

    setSelectedVariant(matched || null);
  }, [selectedA, selectedB, product]);

  useEffect(() => {
    // Nếu chưa có product thì thoát sớm để tránh đọc null.stock
    if (!product) return;

    const s = selectedVariant?.stock ?? product.stock ?? 0;

    setQuantity((prev) => {
      if (s <= 0) return 1;
      return prev > s ? s : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant, selectedA, selectedB, product]);

  // Loading khi chưa có dữ liệu
  if (loading || !product) {
    return <ProductDetailSkeleton />;
  }

  // Giá trị đánh giá trung bình
  const ratingValue = typeof product.rating_avg === 'number'
    ? product.rating_avg
    : typeof product.rating === 'number'
      ? product.rating
      : 0;

  // Các option A/B từ product + variants
  const optsA = Array.from(new Set([
    ...product.variants.map(v => v.value1),
    ...parseOptionValues(product.value1)
  ].filter(Boolean)));

  const optsB = Array.from(new Set([
    ...product.variants.map(v => v.value2),
    ...parseOptionValues(product.value2)
  ].filter(Boolean)));

  // Kiểm tra sự kết hợp hợp lệ giữa A và B
  // Thay thế hàm cũ:
  const hasCombination = (a: string, b: string) => {
    const norm = (s?: string) => (s || '').trim().toLowerCase();

    // Không có variants -> dùng stock của product
    if (!product.variants.length) {
      return (product.stock ?? 0) > 0;
    }

    const aN = norm(a);
    const bN = norm(b);

    // Còn hàng ở biến thể (nếu đã chọn A/B thì khớp theo A/B; nếu chưa chọn B thì chỉ cần khớp A)
    const variantInStock = product.variants.some(v =>
      (!a || norm(v.value1) === aN) &&
      (!b || norm(v.value2) === bN) &&
      (v.stock ?? 0) > 0
    );

    // Còn hàng ở "biến thể gốc" (giá trị value1/value2 trực tiếp trên bảng products)
    const baseInStock =
      (!a || norm(product.value1) === aN) &&
      (!b || norm(product.value2) === bN) &&
      (product.stock ?? 0) > 0;

    return variantInStock || baseInStock;
  };

  // Kiểm tra selected có nằm trong product gốc
  const isFromProduct = parseOptionValues(product.value1).includes(selectedA)
    && parseOptionValues(product.value2).includes(selectedB);

  // Lấy giá hiện tại: Ưu tiên variant, sau đó đến product
  const getPrice = () => {
    if (selectedVariant) {
      return Number((selectedVariant.sale_price ?? selectedVariant.price) || 0).toLocaleString('vi-VN');
    }

    if (isFromProduct) {
      return Number((product.sale_price ?? product.price) || 0).toLocaleString('vi-VN');
    }

    return Number((product.sale_price ?? product.price) || 0).toLocaleString('vi-VN');
  };

  // Lấy tồn kho hiện tại
  const getStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    if (isFromProduct) return product.stock;
    return product.stock;
  };
  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;
  // Trạng thái hết hàng cho lựa chọn hiện tại
  const isOutOfStock = () => {
    if (!product.variants.length) return (product.stock ?? 0) <= 0;
    if (selectedVariant) return (selectedVariant.stock ?? 0) <= 0;
    if (isFromProduct) return (product.stock ?? 0) <= 0;
    return false; // chưa chọn đủ hoặc chưa khớp cụ thể -> không coi là hết
  };

  // Chọn biến thể A / B
  const handleSelectA = (a: string) => setSelectedA(a);
  const handleSelectB = (b: string) => setSelectedB(b);

  // Hiện popup nhanh (ẩn bớt tên nếu quá dài)
  const commonPopup = (msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (msg.includes("🛒")) {
      const match = msg.match(/"(.+?)"/);
      if (match && match[1].length > 30) {
        const shortName = match[1].slice(0, 30) + "...";
        msg = msg.replace(match[1], shortName);
      }
    }

    setPopupText(msg);
    setShowPopup(true);
    timeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      timeoutRef.current = null;
    }, 2000);
  };

  // Thêm vào giỏ hàng (token hoặc localStorage)
  const handleAddToCart = async () => {
    if (isOwner) {
      commonPopup('Bạn là chủ shop của sản phẩm này nên không thể đặt hàng.');
      return;
    }
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    const token = Cookies.get('authToken');
    const hasVariants = product.variants?.length > 0;

    const hasOption1 = !!product.option1;
    const hasOption2 = !!product.option2;

    const selectedValuesFilled =
      hasOption1 && hasOption2
        ? (selectedA && selectedB)
        : hasOption1
          ? selectedA
          : hasOption2
            ? selectedB
            : true;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    const matchedVariant = product.variants.find(
      (v) =>
        (!hasOption1 || normalize(v.value1) === normalize(selectedA)) &&
        (!hasOption2 || normalize(v.value2) === normalize(selectedB))
    );

    const isFromProductValues =
      (!hasOption1 || normalize(product.value1) === normalize(selectedA)) &&
      (!hasOption2 || normalize(product.value2) === normalize(selectedB));

    if ((hasVariants || hasOption1 || hasOption2) && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsAddingToCart(false);
      return;
    }

    setShowSelectionWarning(false);

    if ((hasVariants || hasOption1 || hasOption2) && !matchedVariant && !isFromProductValues) {
      commonPopup("❌ Xin lỗi quý khách, hiện tại biến thể này đã hết hàng");
      setIsAddingToCart(false);
      return;
    }
    // Chặn thêm giỏ khi hết hàng theo lựa chọn hiện tại
    {
      const chosenStock = matchedVariant
        ? (matchedVariant.stock ?? 0)
        : (isFromProductValues ? (product.stock ?? 0) : 0);

      if ((hasVariants || hasOption1 || hasOption2) && chosenStock <= 0) {
        commonPopup("❌ Xin quý khách, biến thể này đã hết hàng");
        setIsAddingToCart(false);
        return;
      }

      if (!hasVariants && (product.stock ?? 0) <= 0) {
        commonPopup("❌ Xin quý khách, sản phẩm này đã hết hàng");
        setIsAddingToCart(false);
        return;
      }
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

  // Thêm vào wishlist
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
        // Đã thích, giờ muốn bỏ thích
        const res = await fetch(`${url}/${product.id}`, {
          method: 'DELETE',
          headers,
        });

        if (!res.ok) throw new Error('Không thể hủy yêu thích');
        setLiked(false);
        commonPopup('Đã xóa khỏi mục yêu thích!');
      } else {
        // Chưa thích → thêm mới
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

  // Theo dõi shop
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

  // Mua ngay (thêm vào giỏ và chuyển trang)
  const handleBuyNow = async () => {
    if (isOwner) {
      commonPopup('Bạn là chủ shop của sản phẩm này nên không thể đặt hàng.');
      return;
    }
    if (isBuyingNow) return;
    setIsBuyingNow(true);

    const token = Cookies.get('authToken');
    const hasVariants = product.variants?.length > 0;
    const hasOption1 = !!product.option1;
    const hasOption2 = !!product.option2;

    const selectedValuesFilled =
      hasOption1 && hasOption2
        ? (selectedA && selectedB)
        : hasOption1
          ? selectedA
          : hasOption2
            ? selectedB
            : true;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    const matchedVariant = product.variants.find(
      (v) =>
        (!hasOption1 || normalize(v.value1) === normalize(selectedA)) &&
        (!hasOption2 || normalize(v.value2) === normalize(selectedB))
    );

    const isFromProductValues =
      (!hasOption1 || normalize(product.value1) === normalize(selectedA)) &&
      (!hasOption2 || normalize(product.value2) === normalize(selectedB));

    if ((hasVariants || hasOption1 || hasOption2) && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsBuyingNow(false);
      return;
    }

    setShowSelectionWarning(false);

    if ((hasVariants || hasOption1 || hasOption2) && !matchedVariant && !isFromProductValues) {
      commonPopup("❌ Xin quý khách, hiện tại biến thể này đã hết hàng");
      setIsBuyingNow(false);
      return;
    }
    {
      const chosenStock = matchedVariant
        ? (matchedVariant.stock ?? 0)
        : (isFromProductValues ? (product.stock ?? 0) : 0);

      if ((hasVariants || hasOption1 || hasOption2) && chosenStock <= 0) {
        commonPopup("❌ Xin quý khách, biến thể này đã hết hàng");
        setIsBuyingNow(false);
        return;
      }

      if (!hasVariants && (product.stock ?? 0) <= 0) {
        commonPopup("❌ Xin quý khách, sản phẩm này đã hết hàng");
        setIsBuyingNow(false);
        return;
      }
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

  // ⬇️ Phần hiển thị JSX
  return (
    <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pt-[72px] sm:pt-[80px] pb-8 sm:pb-10 relative">
      <div className="mb-6 sm:mb-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: product.category.parent?.name || 'Danh mục', href: `/category/${product.category.parent?.slug}` },
            { label: product.category.name, href: `/category/${product.category.slug}` },
            { label: product.name }
          ]}
        />
      </div>

      <div className="rounded-xl border shadow-sm bg-white p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
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
                Hàng trong kho: {currentStock} sản phẩm
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
            {!isOwner && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 w-full">
                <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
                  <div className="flex border rounded overflow-hidden h-[44px] w-full sm:w-[165px]">
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

                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const stock = getStock();
                        if (!isNaN(val)) {
                          if (val < 1) setQuantity(1);
                          else if (val > stock) setQuantity(stock);
                          else setQuantity(val);
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (!val || val < 1) setQuantity(1);
                      }}
                      className="w-[55px] text-center font-extrabold text-black focus:outline-none hide-arrows"
                    />

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

                  <style jsx>{`
                    input[type='number']::-webkit-inner-spin-button,
                    input[type='number']::-webkit-outer-spin-button {
                      -webkit-appearance: none;
                      margin: 0;
                    }
                    input[type='number'] {
                      -moz-appearance: textfield;
                    }
                  `}</style>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || isOutOfStock()}
                  className={`w-full sm:w-[165px] h-[44px] bg-brand text-white text-sm md:text-base rounded transition font-medium hover:bg-red-600 ${(isBuyingNow || isOutOfStock()) ? 'pointer-events-none opacity-50' : ''
                    }`}
                >
                  Mua Ngay
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isOutOfStock()}
                  className={`w-full sm:w-[165px] h-[44px] text-sm md:text-base rounded transition font-medium border text-brand border-brand hover:bg-brand hover:text-white ${(isAddingToCart || isOutOfStock()) ? 'pointer-events-none opacity-50' : ''
                    }`}
                >
                  Thêm Vào Giỏ Hàng
                </button>
              </div>
            )}

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
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 mt-10 sm:mt-16 space-y-10 sm:space-y-16">
        <ShopInfo shop={product.shop} followed={followed} onFollowToggle={handleFollow} isCheckingFollow={isCheckingFollow} />
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
