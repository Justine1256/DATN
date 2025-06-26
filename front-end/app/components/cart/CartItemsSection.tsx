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

    // Nếu chưa đăng nhập => load từ localStorage
    if (!token) {
      const guestCart = localStorage.getItem('cart'); // Giỏ hàng khách vãng lai

      if (guestCart) {
        try {
          const parsed = JSON.parse(guestCart);

          // Biến đổi mỗi item về dạng CartItem chuẩn và xử lý ảnh
          const formatted = parsed.map((item: any, index: number) => ({
            id: index + 1, // tạo id tạm
            quantity: item.quantity,
            product: {
              id: item.product_id,
              name: item.name,
              image: [formatImageUrl(item.image)], // Xử lý ảnh từ giỏ hàng khách
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

          console.log('🛒 Đã load giỏ hàng từ localStorage:', formatted);

          setCartItems(formatted);
          propsSetCartItems(formatted);
        } catch (err) {
          console.error('❌ Lỗi đọc giỏ hàng khách:', err);
        }
      } else {
        console.log('ℹ️ Không có giỏ hàng local');
      }

      setLoading(false);
      return;
    }

    // Nếu đã đăng nhập => gọi API
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Không thể tải giỏ hàng');

      const data = await res.json();
      console.log('✅ Đã load giỏ hàng từ API:', data);

      // Cập nhật giỏ hàng với ảnh đã xử lý
      const updatedData = data.map((item: any) => ({
        ...item,
        image: [formatImageUrl(item.product.image || 'default.jpg')], // Xử lý ảnh cho từng sản phẩm
      }));

      setCartItems(updatedData);
      propsSetCartItems(updatedData);
      localStorage.setItem('cartItems', JSON.stringify(updatedData));
    } catch (error) {
      console.warn('⚠️ API thất bại, fallback localStorage');

      const stored = localStorage.getItem('cartItems');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCartItems(data);
          propsSetCartItems(data);
        } catch (err) {
          console.error('❌ Lỗi đọc localStorage:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  const formatImageUrl = (img: string | string[]): string => {
    console.log('Đường dẫn ảnh:', img);  // In ra giá trị của img
    if (Array.isArray(img)) img = img[0]; // Nếu là mảng, lấy ảnh đầu tiên
    if (typeof img !== 'string' || !img.trim()) {
      return `${STATIC_BASE_URL}/products/default-product.png`; // Sử dụng ảnh mặc định nếu không có ảnh
    }
    // Kiểm tra xem ảnh đã có URL hợp lệ chưa
    if (img.startsWith('http')) return img; // Nếu đã có URL bắt đầu bằng 'http', giữ nguyên
    // Đảm bảo rằng ảnh luôn có đường dẫn hợp lệ
    return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
  };

  
  
  

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemove = async (id: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    if (!token) {
      // Nếu không đăng nhập, xóa giỏ hàng từ localStorage
      const updatedCart = cartItems.filter((item) => item.id !== id);

      setCartItems(updatedCart); // Cập nhật giỏ hàng trong state
      propsSetCartItems(updatedCart); // Cập nhật giỏ hàng ở component cha
      localStorage.setItem('cart', JSON.stringify(updatedCart)); // Cập nhật giỏ hàng trong localStorage
      return;
    }

    try {
      // Nếu đã đăng nhập, gọi API để xóa sản phẩm
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API response error:', errorText);
        throw new Error('Không thể xóa sản phẩm');
      }

      // Cập nhật giỏ hàng trong state và localStorage sau khi xóa thành công từ API
      const updated = cartItems.filter((item) => item.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated)); // Cập nhật lại localStorage

      window.dispatchEvent(new Event('cartUpdated')); // Thông báo giỏ hàng đã thay đổi
    } catch (error) {
      console.error('Lỗi xoá sản phẩm khỏi giỏ:', error);
    }
  };
  
  
  

  

  const handleQuantityChange = async (id: number, value: number) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    const quantity = Math.max(1, value); // Đảm bảo số lượng không nhỏ hơn 1

    if (!token) {
      // Nếu chưa đăng nhập, cập nhật giỏ hàng trong localStorage
      const updatedCart = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );

      setCartItems(updatedCart); // Cập nhật giỏ hàng trong state
      propsSetCartItems(updatedCart); // Cập nhật giỏ hàng trong component cha
      localStorage.setItem('cart', JSON.stringify(updatedCart)); // Cập nhật giỏ hàng trong localStorage
      return;
    }

    try {
      // Nếu đã đăng nhập, gọi API để cập nhật giỏ hàng
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

      // Cập nhật giỏ hàng trong state và localStorage sau khi gọi API thành công
      const updated = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated)); // Cập nhật lại localStorage

    } catch (error) {
      console.error('Lỗi cập nhật số lượng:', error);
    }
  };
  
  
  

  const getPriceToUse = (item: CartItem) => {
    return (
      item.variant?.sale_price ??
      item.variant?.price ??
      item.product.sale_price ??
      item.product.price ??
      0
    );
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
          const firstImage = item.product.image?.[0] || 'placeholder.jpg';

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
                    src={formatImageUrl(item.product.image)} // Đảm bảo gọi hàm formatImageUrl để xử lý ảnh
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
