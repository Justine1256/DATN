'use client';

import { useCallback, useMemo, useState } from 'react';
import Breadcrumb from '@/app/components/cart/CartBreadcrumb';
import CartAndPayment, { Voucher, PaymentInfoChangePayload } from '@/app/components/checkout/CartAndPayment';
import CheckoutForm, { ManualAddress } from '@/app/components/checkout/CheckoutForm'; // ✅ lấy type
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

type Totals = {
  subtotal: number;
  promotionDiscount: number;
  voucherDiscount: number;
  shipping: number;
  finalTotal: number;
};

type PaymentInfoFromChild = {
  paymentMethod: 'cod' | 'vnpay' | string;
  perShop: Array<{
    shop_id: number;
    shop_name?: string;
    subTotal: number;
    voucherDiscount: number;
    shipping: number;
    lineTotal: number;
  }>;
  globalVoucherDiscount: number;
  globalFreeShipping: boolean;
  summary: {
    subTotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  shopVouchers?: Array<{ shop_id: number; code: string }>;
  globalVoucherCode?: string | null;
};

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay' | string>('cod');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoFromChild | null>(null);

  const [manualAddressData, setManualAddressData] = useState<ManualAddress | null>(null); // ✅ có type
  const [addressId, setAddressId] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState<boolean>(false); // ✅ nhận từ form

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number | null>(null);
  const [serverFreeShipping, setServerFreeShipping] = useState<boolean>(false);

  const voucherCodeForSubmit = useMemo(() => {
    const globalCode = paymentInfo?.globalVoucherCode ?? null;
    if (globalCode) return globalCode;
    const sv = paymentInfo?.shopVouchers ?? [];
    return sv.length === 1 ? sv[0].code : null;
  }, [paymentInfo]);

  // ===== Address handlers =====
  const handleAddressSelect = useCallback((selectedId: number | null) => {
    setAddressId(selectedId);
  }, []);

  const handleAddressChange = useCallback((manualData: ManualAddress | null) => {
    setManualAddressData(manualData);
  }, []);

  // ✅ nhận trạng thái tick “Lưu địa chỉ này cho lần sau”
  const handleSaveToggle = useCallback((save: boolean) => {
    setSaveAddress(save);
  }, []);

  // ===== Payment info from CartAndPayment =====
  const handlePaymentInfoChange = useCallback((info: PaymentInfoFromChild) => {
    setPaymentMethod(info.paymentMethod);
    setPaymentInfo(info);
  }, []);

  // ===== Cart normalize =====
  const handleCartChange = useCallback((items: any[]) => {
    const n = (v: any) => {
      const x = Number(v);
      return Number.isFinite(x) ? x : undefined;
    };
    const normalized: CartItem[] = (items || []).map((it: any, idx: number) => {
      const p = it.product ?? {};
      const images: string[] = Array.isArray(p.image) ? p.image : [p.image].filter(Boolean);
      return {
        id: it.id ?? `guest-${idx}`,
        quantity: Number(it.quantity ?? 1),
        product: {
          id: Number(p.id ?? it.product_id ?? it.id ?? 0),
          name: String(p.name ?? it.name ?? 'Sản phẩm'),
          image: images,
          price: Number(p.price ?? it.price ?? 0),
          sale_price: p.sale_price ?? it.sale_price ?? null,
        },
        variant: it.variant
          ? {
            id: Number(it.variant.id ?? 0),
            price: n(it.variant.price),
            sale_price: it.variant.sale_price != null ? Number(it.variant.sale_price) : null,
          }
          : undefined,
      };
    });
    setCartItems(normalized);
  }, []);

  // ===== Voucher applied =====
  const handleVoucherApplied = useCallback((res: {
    voucher: Voucher | null;
    serverDiscount: number | null;
    serverFreeShipping: boolean;
  }) => {
    setAppliedVoucher(res.voucher);
    setServerDiscount(res.serverDiscount ?? 0);
    setServerFreeShipping(!!res.serverFreeShipping);
    setVoucherCode(res.voucher?.code ?? null);
  }, []);

  // ===== Totals for OrderSummary =====
  const totals: Totals | null = useMemo(() => {
    if (!paymentInfo) return null;

    const subtotal = cartItems.reduce((sum, item) => {
      const originalPrice = item.variant?.price ?? item.product.price;
      return sum + originalPrice * item.quantity;
    }, 0);

    const discountedSubtotal = cartItems.reduce((sum, item) => {
      const priceAfterSale = item.variant
        ? (item.variant.sale_price ?? item.variant.price ?? 0)
        : (item.product.sale_price ?? item.product.price ?? 0);
      return sum + priceAfterSale * item.quantity;
    }, 0);

    const promotionDiscount = Math.max(0, subtotal - discountedSubtotal);
    const voucherDiscount = Math.max(0, paymentInfo.summary.discount || 0);
    const shipping = Math.max(0, paymentInfo.summary.shipping || 0);
    const finalTotal = Math.max(0, paymentInfo.summary.total || 0);

    return { subtotal, promotionDiscount, voucherDiscount, shipping, finalTotal };
  }, [paymentInfo, cartItems]);

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
        {/* Cột trái: Địa chỉ */}
        <div className="pr-6">
          <CheckoutForm
            onAddressSelect={handleAddressSelect}
            onAddressChange={handleAddressChange}
            onSaveAddressToggle={handleSaveToggle}   // ✅ nhận tick “lưu địa chỉ”
          />
        </div>

        {/* Cột phải: Giỏ + Tổng tiền */}
        <div className="space-y-8 pl-6">
          <CartAndPayment
            onPaymentInfoChange={handlePaymentInfoChange}
            onCartChange={handleCartChange as (items: any[]) => void}
            onVoucherApplied={handleVoucherApplied}
          />

          <OrderSummary
            cartItems={cartItems}
            setCartItems={setCartItems}
            paymentMethod={paymentMethod}
            addressId={addressId}
            appliedVoucher={appliedVoucher}
            voucherCode={voucherCodeForSubmit}
            serverDiscount={serverDiscount ?? null}
            serverFreeShipping={serverFreeShipping}
            manualAddressData={manualAddressData ?? undefined}
            saveAddress={saveAddress}                
            totals={totals || undefined}
          />
        </div>
      </div>
    </div>
  );
}
