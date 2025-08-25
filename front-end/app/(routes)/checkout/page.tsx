"use client"

import { useCallback, useMemo, useState } from "react"
import Breadcrumb from "@/app/components/cart/CartBreadcrumb"

// ⬇️ LẤY TYPE CartItem TỪ OrderSummary (đồng bộ kiểu)
import OrderSummary, { type CartItem as OSCartItem } from "@/app/components/checkout/OrderSummary"

import CartAndPayment, { type Voucher } from "@/app/components/checkout/CartAndPayment"

import CheckoutForm, { type ManualAddress } from "@/app/components/checkout/CheckoutForm"
import { API_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie";
// Dùng alias nội bộ cho tiện
type CartItem = OSCartItem

type Totals = {
  subtotal: number
  promotionDiscount: number
  voucherDiscount: number
  shipping: number
  finalTotal: number
}

type PaymentInfoFromChild = {
  paymentMethod: "cod" | "vnpay" | string
  perShop: Array<{
    shop_id: number
    shop_name?: string
    subTotal: number
    voucherDiscount: number
    shipping: number
    lineTotal: number
  }>
  globalVoucherDiscount: number
  globalFreeShipping: boolean
  summary: {
    subTotal: number
    discount: number
    shipping: number
    total: number
  }
  shopVouchers?: Array<{ shop_id: number; code: string }>
  globalVoucherCode?: string | null
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay" | string>("cod")
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoFromChild | null>(null)

  const [manualAddressData, setManualAddressData] = useState<ManualAddress | null>(null)
  const [addressId, setAddressId] = useState<number | null>(null)
  const [saveAddress, setSaveAddress] = useState<boolean>(false)

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [voucherCode, setVoucherCode] = useState<string | null>(null)
  const [serverDiscount, setServerDiscount] = useState<number | null>(null)
  const [serverFreeShipping, setServerFreeShipping] = useState<boolean>(false)

  const [isProcessing, setIsProcessing] = useState(false)

  const voucherCodeForSubmit = useMemo(() => {
    const globalCode = paymentInfo?.globalVoucherCode ?? null
    if (globalCode) return globalCode
    const sv = paymentInfo?.shopVouchers ?? []
    return sv.length === 1 ? sv[0].code : null
  }, [paymentInfo])

  // ===== Address handlers =====
  const handleAddressSelect = useCallback((selectedId: number | null) => {
    setAddressId(selectedId)
  }, [])

  const handleAddressChange = useCallback((manualData: ManualAddress | null) => {
    setManualAddressData(manualData)
  }, [])

  const handleSaveToggle = useCallback((save: boolean) => {
    setSaveAddress(save)
  }, [])

  // ===== Payment info from CartAndPayment =====
  const handlePaymentInfoChange = useCallback((info: PaymentInfoFromChild) => {
    setPaymentMethod(info.paymentMethod)
    setPaymentInfo(info)
  }, [])

  // ===== Cart normalize (đầu ra kiểu CartItem của OrderSummary) =====
  const handleCartChange = useCallback((items: any[]) => {
    const n = (v: any) => {
      const x = Number(v)
      return Number.isFinite(x) ? x : undefined
    }
    const normalized: CartItem[] = (items || []).map((it: any, idx: number) => {
      const p = it.product ?? {}
      const images: string[] = Array.isArray(p.image) ? p.image : [p.image].filter(Boolean)
      return {
        id: it.id ?? `guest-${idx}`,
        quantity: Number(it.quantity ?? 1),
        product: {
          id: Number(p.id ?? it.product_id ?? it.id ?? 0),
          name: String(p.name ?? it.name ?? "Sản phẩm"),
          image: images,
          price: Number(p.price ?? it.price ?? 0),
          sale_price: p.sale_price ?? it.sale_price ?? null,
        },
        // ⬇️ KHÔNG trả về null cho variant để khớp type của OrderSummary
        variant: it.variant
          ? {
              id: n(it.variant.id) ?? null,
              price: n(it.variant.price),
              sale_price: it.variant.sale_price != null ? Number(it.variant.sale_price) : null,
            }
          : undefined,
      }
    })
    setCartItems(normalized)
  }, [])

  // ===== Voucher applied =====
  const handleVoucherApplied = useCallback(
    (res: {
      voucher: Voucher | null
      serverDiscount: number | null
      serverFreeShipping: boolean
    }) => {
      setAppliedVoucher(res.voucher)
      setServerDiscount(res.serverDiscount ?? 0)
      setServerFreeShipping(!!res.serverFreeShipping)
      setVoucherCode(res.voucher?.code ?? null)
    },
    [],
  )

  // ===== Totals for OrderSummary =====
  const totals: Totals | null = useMemo(() => {
    if (!paymentInfo) return null

    const subtotal = cartItems.reduce((sum, item) => {
      const originalPrice = item.variant?.price ?? item.product.price
      return sum + originalPrice * item.quantity
    }, 0)

    const discountedSubtotal = cartItems.reduce((sum, item) => {
      const priceAfterSale = item.variant
        ? (item.variant.sale_price ?? item.variant.price ?? 0)
        : (item.product.sale_price ?? item.product.price ?? 0)
      return sum + priceAfterSale * item.quantity
    }, 0)

    const promotionDiscount = Math.max(0, subtotal - discountedSubtotal)
    const voucherDiscount = Math.max(0, paymentInfo.summary.discount || 0)
    const shipping = Math.max(0, paymentInfo.summary.shipping || 0)
    const finalTotal = Math.max(0, paymentInfo.summary.total || 0)

    return { subtotal, promotionDiscount, voucherDiscount, shipping, finalTotal }
  }, [paymentInfo, cartItems])

  // ⬇️ WRAPPER khớp prop setCartItems: (items: CartItem[]) => void
  const replaceCartItems = useCallback((items: CartItem[]) => {
    setCartItems(items)
  }, [])

  const handleVNPayPayment = useCallback(async () => {
  if (!paymentInfo || !cartItems.length) return;

  setIsProcessing(true);
  try {
    // gom đúng payload cho checkout()
    const payload: any = {
      payment_method: "vnpay",
      // 1 trong 2 cách chọn địa chỉ:
      address_id: addressId || undefined,
      address_manual: !addressId && manualAddressData ? {
        full_name: manualAddressData.full_name,
        address: manualAddressData.address,
        city: manualAddressData.city,
        phone: manualAddressData.phone,
        email: manualAddressData.email,
      } : undefined,

      // voucher: nếu giỏ có nhiều shop thì dùng voucher_codes [{shop_id, code}]
      voucher_code: voucherCodeForSubmit || undefined,
      voucher_codes: paymentInfo?.shopVouchers?.length ? paymentInfo.shopVouchers : undefined,

      // chỉ checkout các item người dùng đang chọn
      cart_item_ids: cartItems.map(it => it.id).filter(Boolean),
    };
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    const res = await fetch(`${API_BASE_URL}/dathang`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Checkout failed");

    // BE sẽ trả redirect_url từ VnpayService::createPaymentUrl
    const redirectUrl = data.redirect_url;
    if (!redirectUrl) throw new Error("Missing VNPay redirect_url from checkout");

    // Lưu thông tin local nếu bạn muốn hiển thị lại sau khi quay về
    localStorage.setItem("vnpay_order_info", JSON.stringify({
      order_ids: data.order_ids,
      total: paymentInfo.summary.total,
      ts: Date.now(),
    }));

    window.location.href = redirectUrl; // chuyển sang VNPay
  } catch (e: any) {
    alert(e?.message || "Checkout error");
  } finally {
    setIsProcessing(false);
  }
}, [paymentInfo, cartItems, addressId, manualAddressData, voucherCodeForSubmit]);


  return (
    <div className="container my-10 px-4">
      <Breadcrumb
        items={[
          { label: "Tài khoản", href: "/account" },
          { label: "Tài khoản của tôi", href: "/account/profile" },
          { label: "Sản Phẩm", href: "/products" },
          { label: "Giỏ hàng", href: "/cart" },
          { label: "Thanh toán" },
        ]}
      />

      <div className="text-black mx-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cột trái: Địa chỉ */}
        <div className="pr-6">
          <CheckoutForm
            onAddressSelect={handleAddressSelect}
            onAddressChange={handleAddressChange}
            onSaveAddressToggle={handleSaveToggle}
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
            setCartItems={replaceCartItems}
            paymentMethod={paymentMethod}
            addressId={addressId}
            appliedVoucher={appliedVoucher}
            voucherCode={voucherCode ?? undefined}
            serverDiscount={serverDiscount ?? null}
            serverFreeShipping={serverFreeShipping}
            manualAddressData={manualAddressData ?? undefined}
            saveAddress={saveAddress}
            totals={totals || undefined}
            globalVoucherCode={paymentInfo?.globalVoucherCode ?? null}
            shopVouchers={paymentInfo?.shopVouchers ?? []}
            onVNPayPayment={handleVNPayPayment}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
