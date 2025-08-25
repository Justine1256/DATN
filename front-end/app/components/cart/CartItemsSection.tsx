'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface Props {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export default function CartItemsSection({
  cartItems: propsCartItems,
  setCartItems: propsSetCartItems,
}: Props) {
  const router = useRouter();
  const screens = useBreakpoint();

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
    const option1 = (item as any).variant?.option1 ?? 'Phân loại 1';
    const option2 = (item as any).variant?.option2 ?? 'Phân loại 2';
    const value1 = (item as any).variant?.value1;
    const value2 = (item as any).variant?.value2;

    const parts: string[] = [];
    if (option1 && value1) parts.push(`${option1}: ${value1}`);
    if (option2 && value2) parts.push(`${option2}: ${value2}`);

    return parts.length ? (
      <Text type="secondary">{parts.join(', ')}</Text>
    ) : (
      <Text type="secondary" italic>Không có</Text>
    );
  };

  // Dọn state checkbox cũ (nếu từng lưu)
  useEffect(() => {
    try { localStorage.removeItem('selectedCartIds'); } catch { }
  }, []);

  // ===== Fetch & sync cart =====
  const fetchCartItems = async () => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    const guestCart = localStorage.getItem('cart');
    let localCartItems: CartItem[] = [];

    if (guestCart) {
      try {
        const parsed = JSON.parse(guestCart);
        const makeStableId = (row: any, idx: number, v?: any) => {
          const pid = row.product_id ?? row.product?.id ?? 'p';
          const vid = v?.id ?? row.variant_id ?? 'base';
          const v1 = v?.value1 ?? row.value1 ?? '';
          const v2 = v?.value2 ?? row.value2 ?? '';
          return row.id ?? `${pid}-${vid}-${v1}-${v2}-${idx}`;
        };

        localCartItems = parsed.map((row: any, idx: number) => {
          const v = row.variant ?? null;
          const hasVariant = !!v || !!row.variant_id;

          const variantData = hasVariant
            ? {
              id: v?.id ?? row.variant_id ?? null,
              option1: v?.option1 ?? row.option1 ?? 'Phân loại 1',
              option2: v?.option2 ?? row.option2 ?? 'Phân loại 2',
              value1: v?.value1 ?? row.value1 ?? null,
              value2: v?.value2 ?? row.value2 ?? null,
              price: v?.price ?? row.variant_price ?? row.price ?? 0,
              sale_price: v?.sale_price ?? row.variant_sale_price ?? row.sale_price ?? null,
            }
            : {
              id: null,
              option1: row.option1 ?? 'Phân loại 1',
              option2: row.option2 ?? 'Phân loại 2',
              value1: row.value1 ?? null,
              value2: row.value2 ?? null,
              price: row.price ?? 0,
              sale_price: row.sale_price ?? null,
            };

          return {
            id: makeStableId(row, idx, hasVariant ? variantData : undefined),
            quantity: Number(row.quantity) || 1,
            product: {
              id: Number(row.product_id ?? row.product?.id ?? 0),
              name: row.name ?? row.product?.name ?? 'Sản phẩm',
              image: [
                formatImageUrl(
                  row.image ??
                  (Array.isArray(row.product?.image)
                    ? row.product.image[0]
                    : row.product?.image)
                ),
              ],
              price: Number(row.price ?? row.product?.price ?? variantData.price ?? 0),
              sale_price: hasVariant ? undefined : (row.sale_price ?? row.product?.sale_price ?? null),
              shop:
                row.shop ??
                (row.shop_id ? { id: Number(row.shop_id), name: row.shop_name } : undefined),
            },
            variant: hasVariant ? variantData : null,
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
        const localKey = `${(local as any).variant?.option1}-${(local as any).variant?.option2}-${(local as any).variant?.value1}-${(local as any).variant?.value2}`.toLowerCase();
        const serverKey = `${(server as any).variant?.option1}-${(server as any).variant?.option2}-${(server as any).variant?.value1}-${(server as any).variant?.value2}`.toLowerCase();
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
          ...(item.variant && { variant_id: (item as any).variant.id }),
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

      window.dispatchEvent(new Event('cartUpdated'));
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
    const quantity = Math.max(1, Number(val ?? 1));
    const token = localStorage.getItem('token') || Cookies.get('authToken');

    const prev = cartItems;
    const next = cartItems.map((i) => (i.id === id ? { ...i, quantity } : i));
    setCartItems(next);
    propsSetCartItems(next);

    if (!token) {
      localStorage.setItem('cart', JSON.stringify(next));
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }

    try {
      setUpdatingIds((s) => new Set([...s, id]));
      await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      localStorage.setItem('cart', JSON.stringify(next));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('❌ Lỗi cập nhật số lượng:', error);
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

  // ===== Totals (TOÀN BỘ GIỎ HÀNG) =====
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
        .map((i: any) => i.product?.shop?.id)
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
      render: (_: any, item) => {
        const shopSlug = (item as any).product?.shop?.slug || (item as any).product?.shop?.id;
        const productSlug = (item as any).product?.slug || (item as any).product?.id;

        return (
          <Space align="start">
            <Link href={`/shop/${shopSlug}/product/${productSlug}`}>
              <div className="relative w-16 h-16 rounded border overflow-hidden bg-white cursor-pointer">
                <Image
                  src={formatImageUrl(item.product.image)}
                  alt={item.product.name || 'Sản phẩm'}
                  fill
                  className="object-contain"
                />
              </div>
            </Link>

            <div>
              <Link href={`/shop/${shopSlug}/product/${productSlug}`}>
                <div className="font-medium text-black hover:text-red-500 transition-colors cursor-pointer">
                  {item.product.name?.length > 60
                    ? item.product.name.slice(0, 60) + '…'
                    : item.product.name}
                </div>
              </Link>

              {(item as any).product.shop && (
                <Link href={`/shop/${shopSlug}`} className="text-xs">
                  <Tag color="processing" className="mt-1">
                    🏪 {(item as any).product.shop.name}
                  </Tag>
                </Link>
              )}
            </div>
          </Space>
        );
      },
      responsive: ['md'],
    },
    {
      title: 'Biến thể',
      key: 'variant',
      width: 220,
      render: (_: any, item) => renderVariant(item),
      responsive: ['md'],
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
            <Text
              strong
              type={discounted ? 'danger' : undefined}
              style={{ color: discounted ? '#DB4444' : '#111827' }}
            >
              {formatPrice(sale)}
            </Text>

            {discounted && (
              <div>
                <Text delete style={{ color: '#8c8c8c' }}>
                  {formatPrice(original)}
                </Text>
              </div>
            )}
          </div>
        );
      },
      responsive: ['md'],
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
      responsive: ['md'],
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
      responsive: ['md'],
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
      responsive: ['md'],
    },
  ];

  // Đặt hàng: luôn lấy toàn bộ giỏ
  const handleCheckoutAll = () => {
    router.push('/checkout');
  };

  useEffect(() => {
    fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Mobile item renderer (giao diện đã tinh chỉnh nhưng GIỮ logic cũ) =====
  const renderMobileList = () => (
    <div className="space-y-3 p-3">
      {dataSource.map((item) => {
        const shopSlug = (item as any).product?.shop?.slug || (item as any).product?.shop?.id;
        const productSlug = (item as any).product?.slug || (item as any).product?.id;
        const original = getOriginalPrice(item);
        const sale = getPriceToUse(item);
        const discounted = sale < original;

        return (
          <Card key={item.key} size="small" bodyStyle={{ padding: 12 }} bordered className="rounded-lg">
            <div className="flex gap-3">
              <Link href={`/shop/${shopSlug}/product/${productSlug}`}>
                <div className="relative w-20 h-20 shrink-0 rounded border overflow-hidden bg-white">
                  <Image
                    src={formatImageUrl(item.product.image)}
                    alt={item.product.name || 'Sản phẩm'}
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/shop/${shopSlug}/product/${productSlug}`}>
                  <div className="font-medium text-sm text-black hover:text-red-500 transition-colors line-clamp-2">
                    {item.product.name}
                  </div>
                </Link>

                {(item as any).product.shop && (
                  <Link href={`/shop/${shopSlug}`} className="text-xs">
                    <Tag color="processing" className="mt-1">
                      🏪 {(item as any).product.shop.name}
                    </Tag>
                  </Link>
                )}

                <div className="mt-1 text-xs">{renderVariant(item)}</div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold" style={{ color: discounted ? '#DB4444' : '#111827' }}>
                      {formatPrice(sale)}
                    </div>
                    {discounted && (
                      <div className="text-xs text-gray-500 line-through">
                        {formatPrice(original)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <InputNumber
                      min={1}
                      size="small"
                      value={item.quantity}
                      controls
                      className="!w-16"
                      disabled={updatingIds.has(item.id)}
                      onChange={(val) => handleQuantityChange(item.id, val)}
                    />
                    <Popconfirm
                      title="Xoá sản phẩm?"
                      okText="Xoá"
                      cancelText="Huỷ"
                      onConfirm={() => handleRemove(item.id)}
                    >
                      <Button danger type="link" size="small" className="!p-0">
                        Xoá
                      </Button>
                    </Popconfirm>
                  </div>
                </div>

                {/* Giữ phần tổng dòng (line total) như code đầu */}
               
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderMobileSummary = () => (
    <div className="px-3 pb-3">
      <Card size="small" bordered className="shadow rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tạm tính (giá gốc):</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Khuyến mãi (giảm theo SP):</span>
            <span className="text-green-700">-{formatPrice(promotionDiscount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>{formatPrice(shipping)}</span>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-brand">Tổng thanh toán:</span>
            <span className="text-red-600">{formatPrice(total)}</span>
          </div>
        </div>
        <Button
          type="primary"
          block
          size="large"
          className="mt-3"
          disabled={dataSource.length === 0}
          style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
          onClick={handleCheckoutAll}
        >
          Đặt hàng
        </Button>
      </Card>
    </div>
  );

  return (
    <Card
      title={<span className="font-semibold">Giỏ hàng</span>}
      variant="outlined"
      styles={{ body: { padding: 0 } }}
      className="bg-white"
    >
      {/* Mobile: card list; Desktop/Tablet: table */}
      {!screens.md ? (
        <>
          {loading ? (
            <div className="p-4">Đang tải giỏ hàng...</div>
          ) : dataSource.length === 0 ? (
            <div className="p-6 text-center">Giỏ hàng trống</div>
          ) : (
            <>
              {renderMobileList()}
              {renderMobileSummary()}
            </>
          )}
        </>
      ) : (
        <>
          <Table<RowType>
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={false}
            rowKey="key"
            sticky
            size="middle"
            scroll={{ x: 960 }}
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
                  <Table.Summary.Cell index={2} colSpan={4}>
                    <Text>Khuyến mãi (giảm theo SP):</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right" colSpan={2}>
                    <Text type="success">-{formatPrice(promotionDiscount)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>

                <Table.Summary.Row>
                  <Table.Summary.Cell index={4} colSpan={4}>
                    <Text>Phí vận chuyển:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right" colSpan={2}>
                    <Text>{formatPrice(shipping)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>

                <Table.Summary.Row>
                  <Table.Summary.Cell index={6} colSpan={4}>
                    <Text strong className="text-brand">Tổng thanh toán:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right" colSpan={2}>
                    <Text strong type="danger" className="total-danger">
                      {formatPrice(total)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            )}
          />

          <style jsx global>{`
            .ant-table-summary .ant-typography:not(.ant-typography-success):not(.ant-typography-danger) {
              color: #000 !important;
            }
          `}</style>

          {/* Footer hành động (Desktop/Tablet) */}
          <Flex justify="end" align="center" gap={12} style={{ padding: 16 }}>
            <Link href="/">
              <Button>Tiếp tục mua sắm</Button>
            </Link>
            <Button
              type="primary"
              size="large"
              disabled={dataSource.length === 0}
              style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
              onClick={handleCheckoutAll}
            >
              Đặt hàng
            </Button>
          </Flex>
        </>
      )}
    </Card>
  );
}
