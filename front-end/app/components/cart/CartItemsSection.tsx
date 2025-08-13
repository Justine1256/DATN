'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';
import type { CartItem } from './hooks/CartItem';

import {
  Table,
  Card,
  Typography,
  Tag,
  InputNumber,
  Popconfirm,
  message,
  Space,
  Divider,
  Button,
  Flex,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

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
  const [updatingIds, setUpdatingIds] = useState<Set<number | string>>(new Set());

  // ===== Helpers =====
  const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (!img || typeof img !== 'string') return `${STATIC_BASE_URL}/products/default-product.png`;
    return img.startsWith('http') ? img : `${STATIC_BASE_URL}/${img.replace(/^\//, '')}`;
  };

  const formatPrice = (value?: number | null) =>
    (value ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

  const getPriceToUse = (item: CartItem) =>
    item.variant ? Number(item.variant.sale_price ?? item.variant.price ?? 0)
      : Number(item.product.sale_price ?? item.product.price ?? 0);

  const getOriginalPrice = (item: CartItem) =>
    item.variant ? Number(item.variant.price ?? 0) : Number(item.product.price ?? 0);

  const renderVariant = (item: CartItem) => {
    const option1 = item.variant?.option1 ?? 'Phân loại 1';
    const option2 = item.variant?.option2 ?? 'Phân loại 2';
    const value1 = item.variant?.value1;
    const value2 = item.variant?.value2;

    const parts: string[] = [];
    if (option1 && value1) parts.push(`${option1}: ${value1}`);
    if (option2 && value2) parts.push(`${option2}: ${value2}`);

    return parts.length ? (
      <Text type="secondary">{parts.join(', ')}</Text>
    ) : (
      <Text type="secondary" italic>
        Không có
      </Text>
    );
  };

  // ===== Fetch & sync cart =====
  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const guestCart = localStorage.getItem('cart');
    let localCartItems: CartItem[] = [];

    if (guestCart) {
      try {
        const parsed = JSON.parse(guestCart);
        localCartItems = parsed.map((item: any, index: number) => {
          const isVariant = !!item.variant_id;
          const variantData = isVariant
            ? {
              id: item.variant_id,
              option1: item.option1 || 'Phân loại 1',
              option2: item.option2 || 'Phân loại 2',
              value1: item.value1 ?? null,
              value2: item.value2 ?? null,
              price: item.variant_price,
              sale_price: item.variant_sale_price ?? null,
            }
            : {
              id: null,
              option1: item.option1 || 'Phân loại 1',
              option2: item.option2 || 'Phân loại 2',
              value1: item.value1 ?? null,
              value2: item.value2 ?? null,
              price: item.price,
              sale_price: item.sale_price ?? null,
            };

          return {
            id: item.id || index + 1,
            quantity: Number(item.quantity) || 1,
            product: {
              id: item.product_id,
              name: item.name,
              image: [formatImageUrl(item.image)],
              price: item.price,
              sale_price: isVariant ? undefined : item.sale_price ?? null,
              shop: item.shop ?? undefined,
            },
            variant: variantData,
          } as CartItem;
        });
      } catch (err) {
        console.error('❌ Lỗi parse local cart:', err);
      }
    }

    if (!token) {
      setCartItems(localCartItems);
      propsSetCartItems(localCartItems);
      setLoading(false);
      return;
    }

    try {
      if (localCartItems.length > 0) {
        await syncLocalCartToApi(localCartItems, token);
        localStorage.removeItem('cart');
      }

      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Không thể tải giỏ hàng từ API');

      const apiCartData = await res.json();
      const formatted: CartItem[] = apiCartData.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        product: {
          ...item.product,
          image: [formatImageUrl(item.product.image || 'default.jpg')],
          shop: item.product.shop ?? undefined,
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

  // ===== Row actions =====
  const handleRemove = async (id: number | string) => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    if (!token) {
      const updated = cartItems.filter((i) => i.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      message.success('Đã xoá sản phẩm khỏi giỏ');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());

      const updated = cartItems.filter((i) => i.id !== id);
      setCartItems(updated);
      propsSetCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('cartUpdated'));
      message.success('Đã xoá sản phẩm khỏi giỏ');
    } catch (error) {
      console.error('❌ Lỗi khi xoá:', error);
      message.error('Xoá sản phẩm thất bại');
    }
  };

  const handleQuantityChange = async (id: number | string, val: number | null) => {
    // Tránh null/NaN từ InputNumber
    const quantity = Math.max(1, Number(val ?? 1));

    const token = localStorage.getItem('token') || Cookies.get('authToken');

    // Optimistic update
    const prev = cartItems;
    const next = cartItems.map((i) => (i.id === id ? { ...i, quantity } : i));
    setCartItems(next);
    propsSetCartItems(next);

    if (!token) {
      localStorage.setItem('cart', JSON.stringify(next));
      return;
    }

    try {
      setUpdatingIds((s) => new Set([...s, id]));
      const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      // if (!res.ok) throw new Error('Không thể cập nhật số lượng');
      localStorage.setItem('cart', JSON.stringify(next));
    } catch (error) {
      console.error('❌ Lỗi cập nhật số lượng:', error);
      // rollback
      setCartItems(prev);
      propsSetCartItems(prev);
      message.error('Cập nhật số lượng thất bại');
    } finally {
      setUpdatingIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  };

  // ===== Totals =====
  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + getOriginalPrice(item) * item.quantity, 0),
    [cartItems]
  );

  const discountedSubtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + getPriceToUse(item) * item.quantity, 0),
    [cartItems]
  );

  const promotionDiscount = Math.max(0, subtotal - discountedSubtotal);

  const shipping = useMemo(() => {
    const uniqueShopIds = new Set(
      cartItems
        .map((i) => i.product?.shop?.id)
        .filter((id): id is number => typeof id === 'number')
    );
    return uniqueShopIds.size > 0 ? uniqueShopIds.size * 20000 : 0;
  }, [cartItems]);

  const total = Math.max(0, discountedSubtotal + shipping);

  // ===== Table =====
  type RowType = CartItem & { key: string | number };
  const dataSource: RowType[] = cartItems.map((item) => ({ ...item, key: item.id }));

  const columns: ColumnsType<RowType> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (_: any, item) => (
        <Space align="start">
          <div className="relative w-16 h-16 rounded border overflow-hidden bg-white">
            <Image
              src={formatImageUrl(item.product.image)}
              alt={item.product.name || 'Sản phẩm'}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-medium text-black">
              {item.product.name?.length > 60
                ? item.product.name.slice(0, 60) + '…'
                : item.product.name}
            </div>
            {item.product.shop && (
              <Link
                href={`/shop/${item.product.shop.slug || item.product.shop.id}`}
                className="text-xs"
              >
                <Tag color="processing" className="mt-1">
                  🏪 {item.product.shop.name}
                </Tag>
              </Link>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Biến thể',
      key: 'variant',
      width: 220,
      render: (_: any, item) => renderVariant(item),
    },
    {
      title: 'Giá',
      key: 'price',
      width: 160,
      align: 'center',
      render: (_: any, item) => {
        const original = getOriginalPrice(item);
        const sale = getPriceToUse(item);
        const discounted = sale < original;
        return (
          <div>
            <Text strong type={discounted ? 'danger' : undefined}>
              {formatPrice(sale)}
            </Text>
            {discounted && (
              <div>
                <Text delete type="secondary">
                  {formatPrice(original)}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 140,
      align: 'center',
      render: (value: number, item) => (
        <InputNumber
          min={1}
          value={value}
          controls
          disabled={updatingIds.has(item.id)}
          onChange={(val) => handleQuantityChange(item.id, val)}
        />
      ),
    },
    {
      title: 'Tổng cộng',
      key: 'lineTotal',
      width: 160,
      align: 'right',
      render: (_: any, item) => (
        <Text strong type="danger">
          {formatPrice(getPriceToUse(item) * item.quantity)}
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_: any, item) => (
        <Popconfirm
          title="Xoá sản phẩm?"
          okText="Xoá"
          cancelText="Huỷ"
          onConfirm={() => handleRemove(item.id)}
        >
          <a className="text-red-500">Xoá</a>
        </Popconfirm>
      ),
    },
  ];

  useEffect(() => {
    fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      title={<span className="font-semibold">Giỏ hàng</span>}
      variant="outlined"                       // ✅ thay bordered
      styles={{ body: { padding: 0 } }}        // ✅ thay bodyStyle
      className="bg-white"
    >
      <Table<RowType>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        rowKey="key"
        sticky
        summary={() => (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text>Tạm tính (giá gốc):</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right" colSpan={2}>
                <Text>{formatPrice(subtotal)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text>Khuyến mãi (giảm theo SP):</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right" colSpan={2}>
                <Text type="success">-{formatPrice(promotionDiscount)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text>Phí vận chuyển:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right" colSpan={2}>
                <Text>{formatPrice(shipping)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <Divider style={{ margin: '10px 0' }} />
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text strong className="text-brand">Tổng thanh toán:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right" colSpan={2}>
                <Text strong type="danger">{formatPrice(total)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        )}
      />

      {/* Footer hành động */}
      <Flex justify="end" align="center" gap={12} style={{ padding: 16 }}>
        <Link href="/products">
          <Button>Tiếp tục mua sắm</Button>
        </Link>
        <Link href="/checkout">
          <Button
            type="primary"
            size="large"
            disabled={cartItems.length === 0}
            style={{
              backgroundColor: '#DB4444',
              borderColor: '#DB4444'
            }}
          >
            Đặt hàng
          </Button>

        </Link>
      </Flex>
    </Card>
  );
}
