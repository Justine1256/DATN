'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { CartItem } from './hooks/CartItem';
import Link from 'next/link';
interface Props {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export default function CartItemsSection({
  cartItems: propsCartItems,
  setCartItems: propsSetCartItems,
}: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Format ảnh hiển thị
  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || typeof img !== 'string') return `${STATIC_BASE_URL}/products/default-product.png`;
    return img.startsWith('http') ? img : `${STATIC_BASE_URL}/${img.replace(/^\//, '')}`;
  };

  // ✅ Tải dữ liệu giỏ hàng (ưu tiên từ localStorage cho khách)
  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const guestCart = localStorage.getItem('cart');
    let localCartItems: CartItem[] = [];

    // ✅ Parse local cart nếu có
    if (guestCart) {
      try {
        const parsed = JSON.parse(guestCart);
        localCartItems = parsed.map((item: any, index: number) => ({
          id: item.id || index + 1,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.name,
            image: [formatImageUrl(item.image)],
            price: item.price,
            sale_price: item.sale_price ?? null,
          },
          variant: item.variant_id
            ? {
              id: item.variant_id,
              option1: 'Phân loại 1',
              option2: 'Phân loại 2',
              value1: item.value1,
              value2: item.value2,
              price: item.price,
              sale_price: item.sale_price ?? null,
            }
            : null,
        }));
      } catch (err) {
        console.error('❌ Lỗi parse local cart:', err);
      }
    }

    // ✅ Nếu chưa login => dùng local cart luôn
    if (!token) {
      setCartItems(localCartItems);
      propsSetCartItems(localCartItems);
      setLoading(false);
      return;
    }

    // ✅ Đã đăng nhập
    try {
      // ⏫ Sync local cart lên API nếu có
      if (localCartItems.length > 0) {
        await syncLocalCartToApi(localCartItems, token);
        localStorage.removeItem('cart');
      }

      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!res.ok) throw new Error('Không thể tải giỏ hàng từ API');

      const apiCartData = await res.json();
      const formatted = apiCartData.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          image: [formatImageUrl(item.product.image || 'default.jpg')],
          shop: item.product.shop ?? {}, // ✅ phòng trường hợp shop bị null
        },
      }));


      setCartItems(formatted);
      propsSetCartItems(formatted);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.warn('❗ API lỗi, dùng local fallback:', error);
      setCartItems(localCartItems);
      propsSetCartItems(localCartItems);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sync local cart lên server sau đăng nhập
  const syncLocalCartToApi = async (localItems: CartItem[], token: string) => {
    try {
      const serverRes = await fetch(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const serverItems: CartItem[] = serverRes.ok ? await serverRes.json() : [];

      const isSameItem = (local: CartItem, server: CartItem) => {
        const localKey = `${local.variant?.option1}-${local.variant?.option2}-${local.variant?.value1}-${local.variant?.value2}`.toLowerCase();
        const serverKey = `${server.variant?.option1}-${server.variant?.option2}-${server.variant?.value1}-${server.variant?.value2}`.toLowerCase();
        return local.product.id === server.product.id && localKey === serverKey;
      };

      const itemsToSync = localItems.filter(
        (localItem) => !serverItems.some((serverItem) => isSameItem(localItem, serverItem))
      );

      for (const item of itemsToSync) {
        const payload = {
          product_id: item.product.id,
          quantity: item.quantity,
          replace_quantity: true,
          ...(item.variant && { variant_id: item.variant.id }),
        };

        const res = await fetch(`${API_BASE_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error(`❌ Sync thất bại (${item.product.name}):`, err);
        }
      }

      localStorage.removeItem('cart');
    } catch (err) {
      console.error('❌ Lỗi sync local cart:', err);
    }
  };

  // ✅ Xoá sản phẩm khỏi giỏ hàng
  const handleRemove = async (id: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    if (!token) {
      const updatedCart = cartItems.filter((item) => item.id !== id);
      setCartItems(updatedCart);
      propsSetCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(await res.text());

      const updated = cartItems.filter((item) => item.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('❌ Lỗi khi xóa sản phẩm:', error);
    }
  };

  // ✅ Cập nhật số lượng sản phẩm
  const handleQuantityChange = async (id: number, value: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const quantity = Math.max(1, value);

    if (!token) {
      const updated = cartItems.map((item) => (item.id === id ? { ...item, quantity } : item));
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) throw new Error('Không thể cập nhật số lượng');

      const updated = cartItems.map((item) => (item.id === id ? { ...item, quantity } : item));
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
    } catch (error) {
      console.error('❌ Lỗi cập nhật số lượng:', error);
    }
  };

  // ✅ Lấy giá sản phẩm ưu tiên sale_price
  const getPriceToUse = (item: CartItem) => {
    if (item.variant) return Number(item.variant.sale_price ?? item.variant.price ?? 0);
    return Number(item.product.sale_price ?? item.product.price ?? 0);
  };


  // ✅ Hiển thị phân loại sản phẩm
  const renderVariant = (item: CartItem) => {
    const variants: string[] = [];

    if (item.variant?.option1 && item.variant?.value1)
      variants.push(`${item.variant.option1}: ${item.variant.value1}`);
    if (item.variant?.option2 && item.variant?.value2)
      variants.push(`${item.variant.option2}: ${item.variant.value2}`);

    return variants.length ? (
      <p className="text-xs text-gray-400">{variants.join(', ')}</p>
    ) : (
      <p className="text-xs text-gray-400 italic">Không có</p>
    );
  };

  // ✅ Format giá tiền VND
  const formatPrice = (value?: number | null) =>
    (value ?? 0).toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // ✅ Gọi API khi component mount
  useEffect(() => {
    fetchCartItems();
  }, []);

  // ⬇️ JSX sẽ được viết phía sau để hiển thị cart



  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] text-black font-semibold text-sm bg-white p-4 shadow">
        <div className="text-left">Sản phẩm</div>
        <div className="text-left">Biến thể</div>
        <div className="text-center">Giá</div>
        <div className="text-center">Số lượng</div>
        <div className="text-right">Tổng cộng</div>
      </div>

      {loading ? (
        <p className="text-center py-10">Đang tải giỏ hàng...</p>
      ) : cartItems.length === 0 ? (
        <div className="p-10 text-center border rounded-md bg-white text-gray-500 text-lg shadow">
          🛒 Giỏ hàng của bạn đang trống
        </div>
      ) : (
        cartItems.map((item) => {
          const isVariant = !!item.variant;
const originalPrice = Number((isVariant ? item.variant?.price : item.product?.price) ?? 0);
const salePrice = Number((isVariant ? item.variant?.sale_price : item.product?.sale_price) ?? originalPrice);
const isDiscounted = salePrice < originalPrice;
          const priceToUse = getPriceToUse(item);

          return (
           <div
  key={item.id}
  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:bg-gray-50 transition"
>
  {/* 🔺 Tên shop */}
  {item.product.shop && (
    <div className="px-4 pt-3 pb-1 text-sm text-gray-500 font-medium border-b">
      <Link
        href={`/shop/${item.product.shop.slug || item.product.shop.id}`}
        className="hover:text-red-500"
      >
        🏪 {item.product.shop.name}
      </Link>
    </div>
  )}

  {/* 🔻 Phần thông tin sản phẩm */}
  <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center px-4 py-3 gap-2 relative">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-16 h-16 relative shrink-0">
                    <Image
                      src={formatImageUrl(item.product.image)}
                      alt={item.product.name}
                      fill
                      className="object-contain rounded border"
                    />
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute -top-2 -left-2 bg-white border border-red-500 text-red-500 rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                      title="Xoá sản phẩm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col text-sm font-medium text-black">
                    <span>{item.product.name}</span>
                  </div>
                </div>


    <div>{renderVariant(item)}</div>

<div className="text-center text-sm text-black">
  <div>
    <span className="text-red-500 font-semibold">
      {formatPrice(priceToUse)} đ
    </span>
    {isDiscounted && (
      <div>
        <span className="line-through text-gray-400 text-xs">
          {formatPrice(originalPrice)} đ
        </span>
      </div>
    )}
  </div>
</div>

    <div className="text-center">
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) =>
          handleQuantityChange(item.id, parseInt(e.target.value || '1'))
        }
        className="w-20 px-3 py-2 border rounded-md text-center text-black"
      />
    </div>

    <div className="text-right text-sm font-semibold text-red-500">
      {formatPrice(priceToUse * item.quantity)} đ
    </div>
  </div>
</div>

          );
        })
      )}
    </div>
  );
}