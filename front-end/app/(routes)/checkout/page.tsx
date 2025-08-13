'use client';

import { useCallback, useState } from 'react';
import Breadcrumb from '@/app/components/cart/CartBreadcrumb';
import CartAndPayment, { Voucher } from '@/app/components/checkout/CartAndPayment';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';
import OrderSummary from '@/app/components/checkout/OrderSummary';

export interface CartItem {
  id: number | string;
  quantity: number;
  product: {
    id: number;
    name: string;
    image: string | string[];
    price: number;
    sale_price?: number | null;
    original_price?: number;
  };
  variant?: {
    id: number;
    price?: number;
    sale_price?: number | null;
  };
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [totalPrice, setTotalPrice] = useState(0);
  const [manualAddressData, setManualAddressData] = useState<any>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Voucher state dùng chung
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number | null>(null);
  const [serverFreeShipping, setServerFreeShipping] = useState<boolean>(false);

  // ===== Handlers được memo hóa để tránh re-render / infinite updates =====
  const handleAddressSelect = useCallback((selectedId: number | null) => {
    setAddressId(selectedId);
  }, []);

  const handleAddressChange = useCallback((manualData: any | null) => {
    setManualAddressData(manualData);
  }, []);

  const handlePaymentInfoChange = useCallback(
    ({ paymentMethod, total }: { paymentMethod: string; total: number }) => {
      setPaymentMethod(paymentMethod);
      setTotalPrice(total);
    },
    []
  );

  // ✅ Quan trọng: chuẩn hoá dữ liệu từ CartAndPayment về đúng shape CartItem ở file này
  const handleCartChange = useCallback((items: any[]) => {
    const normalized: CartItem[] = (items || []).map((it, idx) => {
      // luôn đảm bảo có product object
      const p = it.product ?? {};

      // ép image về string[]
      const images: string[] = Array.isArray(p.image)
        ? p.image
        : [p.image].filter(Boolean);

      return {
        id: it.id ?? `guest-${idx}`,
        quantity: Number(it.quantity ?? 1),
        product: {
          id: Number(p.id ?? it.product_id ?? it.id ?? 0), // ✅ đảm bảo có id
          name: String(p.name ?? it.name ?? 'Sản phẩm'),
          image: images,
          price: Number(p.price ?? it.price ?? 0),
          sale_price: p.sale_price ?? it.sale_price ?? null,
          // original_price: p.original_price ?? undefined, // nếu cần
        },
        variant: it.variant
          ? {
            id: Number(it.variant.id ?? 0),
            price: typeof it.variant.price === 'number' ? it.variant.price : undefined,
            sale_price:
              typeof it.variant.sale_price === 'number'
                ? it.variant.sale_price
                : it.variant.sale_price ?? null,
          }
          : undefined,
      };
    });

    setCartItems(normalized);
  }, []);

  const handleVoucherApplied = useCallback(
    (res: {
      voucher: Voucher | null;
      serverDiscount: number | null;
      serverFreeShipping: boolean;
      // code?: string; // nếu con trả về code thì mở
    }) => {
      setAppliedVoucher(res.voucher);
      setServerDiscount(res.serverDiscount ?? 0);
      setServerFreeShipping(!!res.serverFreeShipping);
      // if (res.code) setVoucherCode(res.code);
      setVoucherCode(res.voucher?.code ?? null);
    },
    []
  );

  return (
    <div className="container my-10 px-4">
      <Breadcrumb
        items={[
          { label: 'Tài khoản', href: '/account' },
          { label: 'Tài khoản của tôi', href: '/account/profile' },
          { label: 'Sản Phẩm', href: '/products' },
          { label: 'Giỏ hàng', href: '/cart' },
          { label: 'Thanh toán' },
        ]}
      />

      <div className="text-black mx-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="pr-6">
          <CheckoutForm
            onAddressSelect={handleAddressSelect}
            onAddressChange={handleAddressChange}
          />
        </div>

        <div className="space-y-8 pl-6">
          <CartAndPayment
            onPaymentInfoChange={handlePaymentInfoChange}
            // ⬇️ nhận kiểu any[] rồi tự normalize để khớp type local
            onCartChange={handleCartChange as unknown as (items: any[]) => void}
            onVoucherApplied={handleVoucherApplied}
          />

          <OrderSummary
            cartItems={cartItems}
            setCartItems={setCartItems}
            paymentMethod={paymentMethod}
            addressId={addressId}
            appliedVoucher={appliedVoucher}
            voucherCode={voucherCode}
            serverDiscount={serverDiscount}
            serverFreeShipping={serverFreeShipping}
            manualAddressData={manualAddressData}
          />
        </div>
      </div>
    </div>
  );
}
