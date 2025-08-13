'use client';

import { useCallback, useMemo, useState } from 'react';
import Breadcrumb from '@/app/components/cart/CartBreadcrumb';
import CartAndPayment, { Voucher, PaymentInfoChangePayload } from '@/app/components/checkout/CartAndPayment';
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

/** Totals khớp với OrderSummary.totals */
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
    subTotal: number;        // đã là tổng theo giá sau sale cho shop
    voucherDiscount: number; // giảm voucher của shop đó
    shipping: number;        // phí ship (đã trừ freeship nếu có global shipping)
    lineTotal: number;
  }>;
  globalVoucherDiscount: number; // giảm voucher toàn sàn
  globalFreeShipping: boolean;
  summary: {
    subTotal: number; // tổng các shop: đã là "discountedSubtotal" (sau sale)
    discount: number; // tổng giảm từ voucher (shop + global)
    shipping: number; // tổng phí ship còn lại
    total: number;    // tổng thanh toán cuối
  };
};

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay' | string>('cod');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoFromChild | null>(null);
  const [manualAddressData, setManualAddressData] = useState<any>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Voucher state (nếu muốn show mã ở OrderSummary)
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number | null>(null);
  const [serverFreeShipping, setServerFreeShipping] = useState<boolean>(false);

  /* ============== Address handlers ============== */
  const handleAddressSelect = useCallback((selectedId: number | null) => {
    setAddressId(selectedId);
  }, []);

  const handleAddressChange = useCallback((manualData: any | null) => {
    setManualAddressData(manualData);
  }, []);

  /* ============== Nhận payment info đầy đủ từ CartAndPayment ============== */
  const handlePaymentInfoChange = useCallback((info: PaymentInfoFromChild) => {
    setPaymentMethod(info.paymentMethod);
    setPaymentInfo(info);
  }, []);

  /* ============== Nhận giỏ hàng từ CartAndPayment và chuẩn hoá sang CartItem local ============== */
  const handleCartChange = useCallback((items: any[]) => {
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

  /* ============== Voucher applied từ CartAndPayment ============== */
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

  /* ============== Tính totals chuẩn để truyền cho OrderSummary ============== */
  const totals: Totals | null = useMemo(() => {
    if (!paymentInfo) return null;

    // 1) subtotal (giá gốc) & promotionDiscount (giảm do sale/variant)
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

    // 2) voucherDiscount & shipping & finalTotal lấy từ child summary
    const voucherDiscount = Math.max(0, paymentInfo.summary.discount || 0);
    const shipping = Math.max(0, paymentInfo.summary.shipping || 0);
    const finalTotal = Math.max(0, paymentInfo.summary.total || 0);

    return {
      subtotal,
      promotionDiscount,
      voucherDiscount,
      shipping,
      finalTotal,
    };
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
          />
        </div>

        {/* Cột phải: Giỏ + Tổng tiền */}
        <div className="space-y-8 pl-6">
          <CartAndPayment
            onPaymentInfoChange={handlePaymentInfoChange}        // ✅ nhận object đầy đủ
            onCartChange={handleCartChange as (items: any[]) => void}
            onVoucherApplied={handleVoucherApplied}
          />

          <OrderSummary
            cartItems={cartItems}
            setCartItems={setCartItems}
            paymentMethod={paymentMethod}
            addressId={addressId}
            appliedVoucher={appliedVoucher}
            voucherCode={voucherCode}
            serverDiscount={serverDiscount ?? null}
            serverFreeShipping={serverFreeShipping}
            manualAddressData={manualAddressData}
            /* ✅ Truyền tổng tiền đã chuẩn hoá; OrderSummary sẽ ưu tiên dùng */
            totals={
              totals || undefined // nếu chưa có paymentInfo thì OrderSummary dùng fallback tự tính
            }
          />
        </div>
      </div>
    </div>
  );
}
