'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import { CartItem } from './hooks/CartItem';

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

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const guestCart = localStorage.getItem('cart');
    let localCartItems: CartItem[] = [];

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
          sale_price: null,
        },
        variant: item.variant_id
          ? {
              id: item.variant_id,
              option1: 'Phân loại 1',
              option2: 'Phân loại 2',
              value1: item.value1,
              value2: item.value2,
              price: item.price,
              sale_price: null,
            }
          : null,
      }));
    } catch (err) {
      console.error('Lỗi parse local cart:', err);
    }
  }

  // 👉 Nếu chưa login → dùng local
  if (!token) {
    setCartItems(localCartItems);
    propsSetCartItems(localCartItems);
    setLoading(false);
    return;
  }

  try {
    // 👉 Nếu có local cart, sync lên API
    if (localCartItems.length > 0) {
      await syncLocalCartToApi(localCartItems, token);
      localStorage.removeItem('cart');
    }

    // 👉 Fetch giỏ hàng từ server sau khi sync
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error('Không thể tải giỏ hàng từ API');

    const apiCartData = await res.json();
    const formatted = apiCartData.map((item: any) => {
      // Tự tìm variant.id dựa trên localStorage product
      const savedProduct = JSON.parse(localStorage.getItem(`product_${item.product.id}`) || 'null');

      let variantId = null;
      if (savedProduct?.variants) {
        const matched = savedProduct?.variants?.find((v: any) =>
          v.value1 === item.variant?.value1 && v.value2 === item.variant?.value2
        );

        variantId = matched?.id ?? null;
      }

      return {
        ...item,
        variant: {
          ...item.variant,
          id: variantId
        },
        product: {
          ...item.product,
          image: [formatImageUrl(item.product.image || 'default.jpg')]
        },
      };
    });


    setCartItems(formatted);
    propsSetCartItems(formatted);
    localStorage.removeItem('cart'); // 🔥 đảm bảo xoá sau sync
  } catch (error) {
    console.warn('Lỗi API, fallback local:', error);
    setCartItems(localCartItems);
    propsSetCartItems(localCartItems);
  } finally {
    setLoading(false);
  }
};

const syncLocalCartToApi = async (localItems: CartItem[], token: string) => {
  try {
    // 1. Lấy giỏ hàng từ server
    const serverRes = await fetch(`${API_BASE_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const serverItems: CartItem[] = serverRes.ok ? await serverRes.json() : [];

    const isSameItem = (local: CartItem, server: CartItem) => {
      const localOption = `${local.variant?.option1 ?? ''}-${local.variant?.option2 ?? ''}`.toLowerCase().trim();
      const localValue = `${local.variant?.value1 ?? ''}-${local.variant?.value2 ?? ''}`.toLowerCase().trim();

      const serverOption = `${server.variant?.option1 ?? ''}-${server.variant?.option2 ?? ''}`.toLowerCase().trim();
      const serverValue = `${server.variant?.value1 ?? ''}-${server.variant?.value2 ?? ''}`.toLowerCase().trim();

      return (
        local.product.id === server.product.id &&
        localOption === serverOption &&
        localValue === serverValue
      );
    };

    // 2. Lọc ra các item chưa tồn tại trên server
    const itemsToSync = localItems.filter((localItem) => {
      return !serverItems.some((serverItem) => isSameItem(localItem, serverItem));
    });

    // 3. Gửi từng item cần sync
    for (const item of itemsToSync) {
      let variantId = item.variant?.id ?? null;

      // 🚀 fallback tự tìm variant.id theo value1, value2
      if (!variantId) {
        const savedProduct = JSON.parse(localStorage.getItem(`product_${item.product.id}`) || 'null');
        if (savedProduct?.variants) {
          const matched = savedProduct.variants.find((v: any) =>
            v.value1 === item.variant?.value1 && v.value2 === item.variant?.value2
          );
          variantId = matched?.id ?? null;
        }
      }

      const payload = {
        product_id: item.product.id,
        quantity: item.quantity,
        replace_quantity: true,
        ...(variantId && { variant_id: variantId })
      };

      console.log("SYNC PAYLOAD:", payload);

      const res = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }


    localStorage.removeItem('cart');
  } catch (err) {
    console.error('Lỗi khi đồng bộ giỏ hàng:', err);
  }
};


  

  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (typeof img !== 'string' || !img.trim()) {
      return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith('http')) return img;
    return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

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
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Lỗi phản hồi API khi xóa sản phẩm:', errorText);
        throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng.');
      }

      const updated = cartItems.filter((item) => item.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    }
  };

  const handleQuantityChange = async (id: number, value: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const quantity = Math.max(1, value);

    if (!token) {
      const updatedCart = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      setCartItems(updatedCart);
      propsSetCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
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

      if (!res.ok) throw new Error('Không thể cập nhật số lượng sản phẩm.');

      const updated = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
    }
  };

const getPriceToUse = (item: CartItem) => {
  if (item.variant) {
    return item.variant.sale_price ?? item.variant.price ?? 0;
  }
  return item.product.sale_price ?? item.product.price ?? 0;
};


  const renderVariant = (item: CartItem) => {
    const variants: string[] = [];

    if (item.variant?.option1 && item.variant?.value1)
      variants.push(`${item.variant.option1}: ${item.variant.value1}`);
    if (item.variant?.option2 && item.variant?.value2)
      variants.push(`${item.variant.option2}: ${item.variant.value2}`);

    return variants.length > 0 ? (
      <p className="text-xs text-gray-400">{variants.join(', ')}</p>
    ) : (
      <p className="text-xs text-gray-400 italic">Không có</p>
    );
  };

  const formatPrice = (value?: number | null) =>
    (value ?? 0).toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

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
          const priceToUse = getPriceToUse(item);

          return (
            <div
              key={item.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center bg-white p-4 shadow relative"
            >
              <div className="flex items-center gap-4 relative text-left">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute -top-2 -left-2 bg-white border border-brand text-brand rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                  title="Xoá sản phẩm"
                >
                  ✕
                </button>

                <div className="w-16 h-16 relative shrink-0 ml-3">
                  <Image
                    src={formatImageUrl(item.product.image)}
                    alt={item.product.name}
                    fill
                    className="object-contain"
                  />
                </div>

                <span className="text-sm font-medium text-black">
                  {item.product.name}
                </span>
              </div>

              <div>{renderVariant(item)}</div>

              <div className="text-center text-sm text-black">
                {item.variant?.sale_price || item.product?.sale_price ? (
                  <div>
                    <span className="text-red-500 font-semibold">
                      {formatPrice(priceToUse)} đ
                    </span>
                    <br />
                    <span className="line-through text-gray-400 text-xs">
                      {formatPrice(
                        item.variant?.price ?? item.product?.price
                      )}{' '}
                      đ
                    </span>
                  </div>
                ) : (
                  <span className="font-semibold">
                    {formatPrice(priceToUse)} đ
                  </span>
                )}
              </div>

              <div className="text-center">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(
                      item.id,
                      parseInt(e.target.value || '1')
                    )
                  }
                  className="w-20 px-3 py-2 border rounded-md text-center text-black"
                />
              </div>

              <div className="text-right text-sm font-semibold text-red-500">
                {formatPrice(priceToUse * item.quantity)} đ
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}