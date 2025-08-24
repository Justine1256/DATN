'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
import { FaStar, FaRegStar } from 'react-icons/fa';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from "@/app/context/WishlistContext";

import { Product, ProductDetailProps, Variant } from './hooks/Product';

// Format ảnh sản phẩm từ URL
const formatImageUrl = (img: string | string[] | null): string => {
  if (Array.isArray(img)) img = img[0];
  if (typeof img !== 'string' || !img?.trim()) {
    return `${STATIC_BASE_URL}/products/default-product.png`;
  }
  return img.startsWith('http')
    ? img
    : (img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`);
};

export default function ProductDetail({ shopslug, productslug }: ProductDetailProps) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State sản phẩm
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State biến thể sản phẩm
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Thêm/mua
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // State khác
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);

  // Context
  const { reloadCart } = useCart();
  const { reloadWishlist } = useWishlist();

  // Tách giá trị biến thể từ chuỗi thành mảng
  const parseOptionValues = (value?: string | string[]): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => v.trim());
    return [value]; // trả nguyên chuỗi
  };

  const [isQuantityUpdating, setIsQuantityUpdating] = useState(false);
  const handleIncrease = () => {
    if (isQuantityUpdating) return;
    setIsQuantityUpdating(true);
    setQuantity(prev => prev + 1);
    setTimeout(() => setIsQuantityUpdating(false), 100);
  };

  const handleDecrease = () => {
    if (isQuantityUpdating || quantity <= 1) return;
    setIsQuantityUpdating(true);
    setQuantity(prev => Math.max(1, prev - 1));
    setTimeout(() => setIsQuantityUpdating(false), 100);
  };

  // Lấy user để xác định owner
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('USER_API_FAILED');
        const userData = await res.json();
        const userPayload = userData?.data ?? userData;
        setCurrentUser(userPayload);

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
        setIsOwner(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!product?.shop || !currentUser) return;
    const owner =
      (currentUser?.shop?.id ?? currentUser?.shop_id ?? currentUser?.shops?.[0]?.id) != null
        ? String(currentUser?.shop?.id ?? currentUser?.shop_id ?? currentUser?.shops?.[0]?.id) === String(product.shop.id)
        : (currentUser?.shop?.slug ?? currentUser?.shop_slug ?? currentUser?.shops?.[0]?.slug)
        && String(currentUser?.shop?.slug ?? currentUser?.shop_slug ?? currentUser?.shops?.[0]?.slug) === String(product.shop.slug);
    setIsOwner(Boolean(owner));
  }, [product, currentUser]);

  // Kiểm tra theo dõi shop
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!product?.shop?.id || !token) {
      setIsCheckingFollow(false);
      return;
    }
    const checkFollow = async () => {
      try {
        setIsCheckingFollow(true);
        const res = await fetch(`${API_BASE_URL}/shops/${product.shop.id}/is-following`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFollowed(Boolean(data.followed));
      } catch {
        // ignore
      } finally {
        setIsCheckingFollow(false);
      }
    };
    checkFollow();
  }, [product?.shop?.id]);

  // Fetch chi tiết sản phẩm + ghi nhận lịch sử
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = Cookies.get('authToken') || localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/${shopslug}/product/${productslug}`, { headers, signal });
        if (!res.ok) throw new Error('FETCH_PRODUCT_FAILED');
        const { data } = await res.json();

        setProduct({
          ...data,
          variants: Array.isArray(data.variants) ? data.variants : [],
        });

        const firstImg = Array.isArray(data.image)
          ? data.image[0]
          : (typeof data.image === 'string' ? data.image : '');
        setMainImage(formatImageUrl(firstImg || ''));

        if (data?.id) {
          await fetch(`${API_BASE_URL}/products/history`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ product_id: data.id }),
          });
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          console.error('❌ Lỗi khi fetch chi tiết sản phẩm:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [shopslug, productslug]);

  // Tìm biến thể khi chọn A/B
  useEffect(() => {
    if (!product) return;
    const normalize = (val?: string) => (val || '').trim().toLowerCase();
    const matched = product.variants.find(
      (v) => normalize(v.value1) === normalize(selectedA) && normalize(v.value2) === normalize(selectedB)
    );
    setSelectedVariant(matched || null);
  }, [selectedA, selectedB, product]);

  // Cập nhật quantity theo stock hiện tại
  useEffect(() => {
    if (!product) return;
    const s = selectedVariant?.stock ?? product.stock ?? 0;
    setQuantity((prev) => (s <= 0 ? 1 : (prev > s ? s : prev)));
  }, [selectedVariant, selectedA, selectedB, product]);

  // === SALE COUNTDOWN ===
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    if (!product?.sale_ends_at && !product?.sale_starts_at) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [product?.sale_ends_at, product?.sale_starts_at]);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const formatCountdown = (target: Date) => {
    const diff = target.getTime() - nowMs;
    if (diff <= 0) return '00:00:00';
    const d = Math.floor(diff / (24 * 3600 * 1000));
    const h = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const s = Math.floor((diff % (60 * 1000)) / 1000);
    return d > 0 ? `${d}d ${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  };

  // Loading skeleton
  if (loading || !product) {
    return <ProductDetailSkeleton />;
  }

  // ⬇️ Từ đây trở đi, product chắc chắn KHÔNG null
  const safeProduct = product as Product;

  const saleEndsAt = safeProduct.sale_ends_at ? new Date(safeProduct.sale_ends_at) : null;
  const saleStartsAt = safeProduct.sale_starts_at ? new Date(safeProduct.sale_starts_at) : null;

  const inUpcoming = Boolean(saleStartsAt && nowMs < saleStartsAt.getTime());
  const inActive = Boolean(saleEndsAt && nowMs < saleEndsAt.getTime() && (!saleStartsAt || nowMs >= saleStartsAt.getTime()));
  const salePhase: 'none' | 'upcoming' | 'active' = inActive ? 'active' : (inUpcoming ? 'upcoming' : 'none');

  const hasSalePriceNow = Number(selectedVariant?.sale_price ?? safeProduct.sale_price ?? 0) > 0;
  const showCountdown = salePhase === 'active' ? hasSalePriceNow : salePhase === 'upcoming';

  // Rating
  const ratingValue =
    typeof safeProduct.rating_avg === 'number'
      ? safeProduct.rating_avg
      : Number(safeProduct.rating ?? 0);

  // Options A/B
  const optsA = Array.from(new Set([
    ...safeProduct.variants.map(v => v.value1),
    ...parseOptionValues(safeProduct.value1)
  ].filter(Boolean)));

  const optsB = Array.from(new Set([
    ...safeProduct.variants.map(v => v.value2),
    ...parseOptionValues(safeProduct.value2)
  ].filter(Boolean)));

  const hasCombination = (a: string, b: string) => {
    const norm = (s?: string) => (s || '').trim().toLowerCase();

    if (!safeProduct.variants.length) {
      return (safeProduct.stock ?? 0) > 0;
    }

    const aN = norm(a);
    const bN = norm(b);

    const variantInStock = safeProduct.variants.some(v =>
      (!a || norm(v.value1) === aN) &&
      (!b || norm(v.value2) === bN) &&
      (v.stock ?? 0) > 0
    );

    const baseInStock =
      (!a || norm(safeProduct.value1) === aN) &&
      (!b || norm(safeProduct.value2) === bN) &&
      (safeProduct.stock ?? 0) > 0;

    return variantInStock || baseInStock;
  };

  const isFromProduct =
    parseOptionValues(safeProduct.value1).includes(selectedA) &&
    parseOptionValues(safeProduct.value2).includes(selectedB);

  const getPrice = () => {
    if (selectedVariant) {
      return Number((selectedVariant.sale_price ?? selectedVariant.price) || 0).toLocaleString('vi-VN');
    }
    const base = safeProduct.sale_price ?? safeProduct.price;
    return Number(base || 0).toLocaleString('vi-VN');
  };

  const getStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    return safeProduct.stock;
  };

  const currentStock = selectedVariant?.stock ?? safeProduct.stock ?? 0;

  const isOutOfStock = () => {
    if (!safeProduct.variants.length) return (safeProduct.stock ?? 0) <= 0;
    if (selectedVariant) return (selectedVariant.stock ?? 0) <= 0;
    if (isFromProduct) return (safeProduct.stock ?? 0) <= 0;
    return false;
  };

  // UI helpers
  const handleSelectA = (a: string) => setSelectedA(a);
  const handleSelectB = (b: string) => setSelectedB(b);

  const commonPopup = (msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (msg.includes('🛒')) {
      const match = msg.match(/"(.+?)"/);
      if (match && match[1].length > 30) {
        const shortName = match[1].slice(0, 30) + '...';
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

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (isOwner) {
      commonPopup('Bạn là chủ shop của sản phẩm này nên không thể đặt hàng.');
      return;
    }
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    const hasVariants = safeProduct.variants?.length > 0;
    const hasOption1 = !!safeProduct.option1;
    const hasOption2 = !!safeProduct.option2;

    const selectedValuesFilled =
      hasOption1 && hasOption2
        ? (selectedA && selectedB)
        : hasOption1
          ? !!selectedA
          : hasOption2
            ? !!selectedB
            : true;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    const matchedVariant = safeProduct.variants.find(
      (v) =>
        (!hasOption1 || normalize(v.value1) === normalize(selectedA)) &&
        (!hasOption2 || normalize(v.value2) === normalize(selectedB))
    );

    const isFromProductValues =
      (!hasOption1 || normalize(safeProduct.value1) === normalize(selectedA)) &&
      (!hasOption2 || normalize(safeProduct.value2) === normalize(selectedB));

    if ((hasVariants || hasOption1 || hasOption2) && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsAddingToCart(false);
      return;
    }

    setShowSelectionWarning(false);

    if ((hasVariants || hasOption1 || hasOption2) && !matchedVariant && !isFromProductValues) {
      commonPopup('❌ Xin lỗi quý khách, hiện tại biến thể này đã hết hàng');
      setIsAddingToCart(false);
      return;
    }

    {
      const chosenStock = matchedVariant
        ? (matchedVariant.stock ?? 0)
        : (isFromProductValues ? (safeProduct.stock ?? 0) : 0);

      if ((hasVariants || hasOption1 || hasOption2) && chosenStock <= 0) {
        commonPopup('❌ Xin quý khách, biến thể này đã hết hàng');
        setIsAddingToCart(false);
        return;
      }

      if (!hasVariants && (safeProduct.stock ?? 0) <= 0) {
        commonPopup('❌ Xin quý khách, sản phẩm này đã hết hàng');
        setIsAddingToCart(false);
        return;
      }
    }

    const useVariant = matchedVariant ?? null;
    const price = useVariant?.price ?? safeProduct.price;
    const sale_price = useVariant?.sale_price ?? safeProduct.sale_price;

    const cartItem = {
      product_id: safeProduct.id,
      quantity,
      name: safeProduct.name,
      image: Array.isArray(safeProduct.image) ? safeProduct.image[0] : (typeof safeProduct.image === 'string' ? safeProduct.image : ''),
      price: Number(price || 0),
      sale_price: sale_price ? Number(sale_price) : null,
      value1: selectedA,
      value2: selectedB,
      variant_id: useVariant?.id ?? null,
      option1: safeProduct.option1 || 'Phân loại 1',
      option2: safeProduct.option2 || 'Phân loại 2',
      variant_price: useVariant?.price ?? null,
      variant_sale_price: useVariant?.sale_price ?? null,
      shop: {
        id: safeProduct.shop?.id,
        name: safeProduct.shop?.name,
        slug: safeProduct.shop?.slug,
      }
    };

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        const local = localStorage.getItem('cart');
        const cart = local ? JSON.parse(local) : [];
        const index = cart.findIndex(
          (i: any) => i.product_id === cartItem.product_id && i.variant_id === cartItem.variant_id
        );

        if (index !== -1) {
          cart[index].quantity += quantity;
        } else {
          cart.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        reloadCart();
        commonPopup(`🛒 Đã thêm "${cartItem.name}" vào giỏ hàng`);
      } else {
        const res = await fetch(`${API_BASE_URL}/cart`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartItem),
        });

        if (res.ok) {
          await reloadCart();
          commonPopup(`🛒 Đã thêm "${safeProduct.name}" vào giỏ hàng`);
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('❌ Cart API error:', err);
          commonPopup('❌ Thêm vào giỏ hàng thất bại');
        }
      }
    } catch (error) {
      console.error('❌ Cart request failed:', error);
      commonPopup('❌ Lỗi khi gửi yêu cầu giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Wishlist
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
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      if (liked) {
        const res = await fetch(`${url}/${safeProduct.id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Không thể hủy yêu thích');
        setLiked(false);
        commonPopup('Đã xóa khỏi mục yêu thích!');
      } else {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ product_id: safeProduct.id }),
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

    const url = `${API_BASE_URL}/shops/${safeProduct.shop.id}/${followed ? 'unfollow' : 'follow'}`;
    await fetch(url, {
      method: followed ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    setFollowed(!followed);
  };

  // Lưu draft id cho "mua ngay"
  const pushDraftIds = (ids: string[]) => {
    try {
      const cur = JSON.parse(localStorage.getItem('buyNowDraftCartIds') || '[]');
      const set = new Set([...(Array.isArray(cur) ? cur.map(String) : []), ...ids.map(String)]);
      localStorage.setItem('buyNowDraftCartIds', JSON.stringify(Array.from(set)));
    } catch {
      localStorage.setItem('buyNowDraftCartIds', JSON.stringify(ids.map(String)));
    }
  };

  // Mua ngay
  const handleBuyNow = async () => {
    if (isOwner) {
      commonPopup('Bạn là chủ shop của sản phẩm này nên không thể đặt hàng.');
      return;
    }
    if (isBuyingNow) return;
    setIsBuyingNow(true);

    const token = Cookies.get('authToken');
    const hasVariants = safeProduct.variants?.length > 0;
    const hasOption1 = !!safeProduct.option1;
    const hasOption2 = !!safeProduct.option2;

    const selectedValuesFilled =
      hasOption1 && hasOption2
        ? (selectedA && selectedB)
        : hasOption1
          ? !!selectedA
          : hasOption2
            ? !!selectedB
            : true;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    const matchedVariant = safeProduct.variants.find(
      (v) =>
        (!hasOption1 || normalize(v.value1) === normalize(selectedA)) &&
        (!hasOption2 || normalize(v.value2) === normalize(selectedB))
    );

    const isFromProductValues =
      (!hasOption1 || normalize(safeProduct.value1) === normalize(selectedA)) &&
      (!hasOption2 || normalize(safeProduct.value2) === normalize(selectedB));

    if ((hasVariants || hasOption1 || hasOption2) && !selectedValuesFilled) {
      setShowSelectionWarning(true);
      setIsBuyingNow(false);
      return;
    }

    setShowSelectionWarning(false);

    if ((hasVariants || hasOption1 || hasOption2) && !matchedVariant && !isFromProductValues) {
      commonPopup('❌ Xin quý khách, hiện tại biến thể này đã hết hàng');
      setIsBuyingNow(false);
      return;
    }

    {
      const chosenStock = matchedVariant
        ? (matchedVariant.stock ?? 0)
        : (isFromProductValues ? (safeProduct.stock ?? 0) : 0);

      if ((hasVariants || hasOption1 || hasOption2) && chosenStock <= 0) {
        commonPopup('❌ Xin quý khách, biến thể này đã hết hàng');
        setIsBuyingNow(false);
        return;
      }

      if (!hasVariants && (safeProduct.stock ?? 0) <= 0) {
        commonPopup('❌ Xin quý khách, sản phẩm này đã hết hàng');
        setIsBuyingNow(false);
        return;
      }
    }

    const useVariant = matchedVariant ?? null;
    const price = useVariant?.price ?? safeProduct.price;
    const sale_price = useVariant?.sale_price ?? safeProduct.sale_price;

    const guestTempId = `guest-${safeProduct.id}-${useVariant?.id ?? 'no-variant'}-${Date.now()}`;

    const cartItem = {
      id: guestTempId, // chỉ dùng cho guest
      product_id: safeProduct.id,
      quantity,
      name: safeProduct.name,
      image: Array.isArray(safeProduct.image) ? safeProduct.image[0] : (typeof safeProduct.image === 'string' ? safeProduct.image : ''),
      price: Number(price || 0),
      sale_price: sale_price ? Number(sale_price) : null,
      value1: selectedA,
      value2: selectedB,
      variant_id: useVariant?.id ?? null,
      option1: safeProduct.option1 || 'Phân loại 1',
      option2: safeProduct.option2 || 'Phân loại 2',
      variant_price: useVariant?.price ?? null,
      variant_sale_price: useVariant?.sale_price ?? null,
      shop: {
        id: safeProduct.shop?.id,
        name: safeProduct.shop?.name,
        slug: safeProduct.shop?.slug,
      }
    };

    try {
      if (!token) {
        // Guest
        const raw = localStorage.getItem('cart');
        const cart = raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];

        const idx = cart.findIndex((i: any) =>
          i.product_id === cartItem.product_id && i.variant_id === cartItem.variant_id
        );

        let selectedIdForCheckout = guestTempId;

        if (idx !== -1) {
          const existingId = String(cart[idx].id ?? guestTempId);
          cart[idx].id = existingId;
          cart[idx].quantity += quantity;
          selectedIdForCheckout = existingId;
        } else {
          cart.push(cartItem);
          selectedIdForCheckout = String(cartItem.id);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('selectedCartIds', JSON.stringify([selectedIdForCheckout]));
        pushDraftIds([selectedIdForCheckout]);

        await reloadCart();
        router.push('/checkout');
      } else {
        // Logged-in
        const res = await fetch(`${API_BASE_URL}/cart`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(cartItem),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('❌ Cart API error:', err);
          commonPopup('❌ Thêm vào giỏ hàng thất bại');
          setIsBuyingNow(false);
          return;
        }

        let payload: any = await res.json().catch(() => ({}));
        const createdId = payload?.data?.id ?? payload?.id ?? payload?.cart_item?.id ?? null;
        let finalId = createdId;

        if (!finalId) {
          try {
            const check = await fetch(`${API_BASE_URL}/cart`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const listJson: any = await check.json().catch(() => ({}));
            const rows: any[] = Array.isArray(listJson?.data) ? listJson.data : (Array.isArray(listJson) ? listJson : []);
            const found = rows.find((it: any) =>
              Number(it?.product_id ?? it?.product?.id) === Number(safeProduct.id) &&
              String(it?.variant_id ?? it?.variant?.id ?? '') === String(useVariant?.id ?? '')
            );
            finalId = found?.id ?? null;
          } catch { /* ignore */ }
        }

        await reloadCart();

        if (finalId) {
          localStorage.setItem('selectedCartIds', JSON.stringify([String(finalId)]));
          pushDraftIds([String(finalId)]);
        } else {
          localStorage.setItem('selectedCartIds', JSON.stringify([]));
        }

        router.push('/checkout');
      }
    } catch (error) {
      console.error('❌ Cart request failed:', error);
      commonPopup('❌ Lỗi khi gửi yêu cầu giỏ hàng');
    } finally {
      setIsBuyingNow(false);
    }
  };

  // JSX
  const galleryImages =
    Array.isArray(safeProduct.image) && safeProduct.image.length > 0
      ? safeProduct.image
      : (typeof safeProduct.image === 'string' && safeProduct.image
        ? [safeProduct.image]
        : [`${STATIC_BASE_URL}/products/default-product.png`]);

  return (
    <div className="max-w-screen-xl mx-auto md:px-3 sm:px-4 sm:pt-[80px] pb-8 sm:pb-10 relative">
      <div className="mb-6 sm:mb-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: safeProduct.category.parent?.name || 'Danh mục', href: `/category/${safeProduct.category.parent?.slug}` },
            { label: safeProduct.category.name, href: `/category/${safeProduct.category.slug}` },
            { label: safeProduct.name }
          ]}
        />
      </div>

      <div className="rounded-xl md:border shadow-sm bg-white sm:p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
          {/* Gallery & like */}
          <div className="md:col-span-6 flex flex-col gap-4 relative">
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className="absolute top-2 left-2 p-2 text-[22px] z-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {liked ? <AiFillHeart className="text-red-500" /> : <AiOutlineHeart className="text-red-500" />}
            </button>

            <ProductGallery
              images={galleryImages}
              mainImage={mainImage}
              setMainImage={setMainImage}
            />
          </div>

          {/* Info */}
          <div className="md:col-span-6 space-y-4">
            <h1 className="text-[1.5rem] md:text-[1.7rem] font-bold text-gray-900">{safeProduct.name}</h1>

            {/* Rating, stock */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-base">
                {ratingValue > 0 && (
                  <>
                    <span className="text-gray-800 flex items-center">{ratingValue.toFixed(1)}</span>
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

              <span className="text-gray-500">
                {safeProduct.review_count && safeProduct.review_count > 0
                  ? `Lượt đánh giá: ${safeProduct.review_count}`
                  : 'Chưa có đánh giá'}
              </span>

              <span className="text-gray-300">|</span>
              <span className="text-emerald-400 font-medium">
                Hàng trong kho: {currentStock} sản phẩm
              </span>
            </div>

            {/* Price */}
            {/* Price + Countdown đặt cùng một hàng */}
            <div className="flex items-center flex-wrap gap-3">
              {/* Giá hiện tại */}
              <span className="text-[24px] font-bold text-brand">{getPrice()}₫</span>

              {/* Giá gạch nếu có */}
              {selectedVariant?.sale_price ? (
                <span className="line-through text-gray-400 text-[16px]">
                  {Number(selectedVariant.price).toLocaleString('vi-VN')}₫
                </span>
              ) : product.sale_price ? (
                <span className="line-through text-gray-400 text-[16px]">
                  {Number((product as any).price).toLocaleString('vi-VN')}₫
                </span>
              ) : null}

              {/* Countdown sát bên giá */}
              {showCountdown && (
                <div className="flex items-center gap-2 pl-3 ml-1 border-l border-red-200 text-[#DB4444] leading-none">
                  <span className="text-[20px] fire-icon">🔥</span>

                  {salePhase === 'active' ? (
                    <>
                      <span className="text-[14px]">Kết thúc sau</span>
                      <span className="font-mono font-extrabold text-[18px] tracking-[0.08em] px-2 py-[2px] rounded bg-red-50 border border-red-200">
                        {formatCountdown(saleEndsAt as Date)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[14px]">Bắt đầu sau</span>
                      <span className="font-mono font-extrabold text-[18px] tracking-[0.08em] px-2 py-[2px] rounded bg-red-50 border border-red-200">
                        {formatCountdown(saleStartsAt as Date)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>


            {/* Option A */}
            <div className="flex md:flex-col gap-2 mb-4 mt-4">
              <p className="w-1/5 md:w-full md:font-medium text-gray-700 md:text-lg">{safeProduct.option1 || ''}</p>
              <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                {optsA.map(a => (
                  <button
                    key={a}
                    onClick={() => handleSelectA(a)}
                    className={`relative px-2 md:px-4 py-1 md:py-2 rounded-lg text-sm font-semibold border transition-all md:min-w-[80px] ${selectedA === a
                      ? 'border-red-600 text-black bg-white'
                      : 'border-gray-300 text-black bg-white hover:border-red-500'
                      } ${!hasCombination(a, selectedB) ? 'opacity-50' : ''}`}
                  >
                    {selectedA === a && (
                      <div
                        className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                        style={{ borderBottomLeftRadius: '7px', borderTopRightRadius: '7px' }}
                      >
                        <span className="text-white text-[9px] font-bold leading-none">✓</span>
                      </div>
                    )}
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Option B */}
            <div className="flex md:flex-col gap-2 mb-4 mt-4">
              <p className="w-1/5 md:w-full md:font-medium text-gray-700 md:text-lg">{safeProduct.option2 || ''}</p>
              <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[500px]">
                {optsB.map(b => (
                  <button
                    key={b}
                    onClick={() => handleSelectB(b)}
                    className={`relative px-2 md:px-4 py-1 md:py-2 rounded-lg text-sm font-semibold border transition-all md:min-w-[80px] ${selectedB === b
                      ? 'border-red-600 text-black bg-white'
                      : 'border-gray-300 text-black bg-white hover:border-red-500'
                      } ${!hasCombination(selectedA, b) ? 'opacity-50' : ''}`}
                  >
                    {selectedB === b && (
                      <div
                        className="absolute -top-[0px] -right-[0px] w-4 h-4 bg-red-600 flex items-center justify-center overflow-hidden"
                        style={{ borderBottomLeftRadius: '7px', borderTopRightRadius: '7px' }}
                      >
                        <span className="text-white text-[9px] font-bold leading-none">✓</span>
                      </div>
                    )}
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {showSelectionWarning && (
              <p className="text-red-500 text-sm mt-1">Vui lòng chọn đầy đủ phân loại hàng</p>
            )}

            {/* Quantity & actions */}
            {!isOwner && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 w-full">

                {/* quantity and "buy now" */}
                <div className="flex md:block gap-4">
                  <div className="flex flex-col items-start gap-1 w-1/3 sm:w-auto">
                    <div className="flex border rounded overflow-hidden h-[44px] w-fit md:w-full sm:w-[165px]">
                      <button
                        onClick={handleDecrease}
                        disabled={isQuantityUpdating || quantity <= 1}
                        className={`w-1/3 md:w-[55px] md:text-2xl font-extrabold transition ${quantity <= 1 || isQuantityUpdating
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
                        className="w-1/3 md:w-[55px] text-center font-extrabold text-black focus:outline-none hide-arrows"
                      />

                      <button
                        onClick={handleIncrease}
                        disabled={isQuantityUpdating || quantity >= getStock()}
                        className={`w-1/3 md:w-[55px] md:text-2xl font-extrabold transition ${quantity >= getStock() || isQuantityUpdating
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
                    input[type='number'] { -moz-appearance: textfield; }
                  `}</style>
                  </div>

                  <button
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || isOutOfStock()}
                    className={`w-full sm:w-[165px] h-[44px] bg-brand text-white text-sm md:text-base rounded transition font-medium hover:bg-red-600 ${(isBuyingNow || isOutOfStock()) ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Mua Ngay
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isOutOfStock()}
                  className={`w-full sm:w-[165px] h-[44px] text-sm md:text-base rounded transition font-medium border text-brand border-brand hover:bg-brand hover:text-white ${(isAddingToCart || isOutOfStock()) ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Thêm Vào Giỏ Hàng
                </button>
              </div>
            )}

            {/* Chính sách */}
            <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6">
              <div className="flex items-center gap-3 p-4">
                <div className="flex justify-center items-center h-[40px]">
                  <Image src="/ship.png" alt="Logo" width={30} height={40} />
                </div>
                <div>
                  <p className="font-semibold">Giao hàng miễn phí</p>
                  <p><a className="no-underline" href="#">Giao hàng miễn phí tại nội thành & một số khu vực ngoại thành</a></p>
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
        <ShopInfo
          shop={safeProduct.shop}
          followed={followed}
          onFollowToggle={handleFollow}
          isCheckingFollow={isCheckingFollow}
        />
        <ProductDescription html={safeProduct.description} />
        <ProductReviews productId={safeProduct.id} />
        <ShopProductSlider shopSlug={safeProduct.shop.slug} />
        <BestSellingSlider />
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed top-[140px] right-5 z-[9999] bg-green-100 text-green-800 text-sm px-4 py-2 rounded shadow-lg border-b-4 border-green-500 animate-slideInFade">
          {popupText || (liked ? 'Đã thêm vào mục yêu thích!' : 'Đã xóa khỏi mục yêu thích!')}
        </div>
      )}
    </div>
  );
}
