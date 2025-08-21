"use client"

import axios from "axios"
import Cookies from "js-cookie"
import { useEffect, useRef, useState, useMemo } from "react"
import { API_BASE_URL } from "@/utils/api"

/* ===================== Types ===================== */

export interface CartItem {
  id: number | string
  quantity: number
  product: {
    id: number
    name: string
    image: string | string[]
    price: number
    sale_price?: number | null
    original_price?: number
  }
  variant?: {
    id?: number | string | null
    price?: number | null
    sale_price?: number | null
  } | null
}

type ShopVoucher = { shop_id: number; code: string }

export type VoucherType = "percent" | "amount" | "shipping" | string

export interface Voucher {
  id: number | string
  code: string
  title?: string
  description?: string
  type: VoucherType
  value: number
  min_order?: number
  expires_at?: string
  is_active?: boolean
}

interface OrderRequestBody {
  payment_method: string
  voucher_code: string | null
  voucher_codes?: ShopVoucher[]
  address_id?: number
  cart_item_ids?: number[]
  address_manual?: {
    full_name: string
    address: string
    city: string
    phone: string
    email: string
  }
  cart_items: Array<{
    product_id: number
    variant_id: number | null
    quantity: number
    price: number
  }>
}

interface Totals {
  subtotal: number
  promotionDiscount: number
  voucherDiscount: number
  shipping: number
  finalTotal: number
}

interface Props {
  cartItems: CartItem[]
  paymentMethod: string
  addressId: number | null

  appliedVoucher?: Voucher | null
  voucherCode?: string | null
  globalVoucherCode?: string | null
  shopVouchers?: Array<{ shop_id: number; code: string }>

  serverDiscount?: number | null
  serverFreeShipping?: boolean

  manualAddressData?: {
    full_name: string
    address: string
    apartment?: string
    city: string
    phone: string
    email: string
  }

  totals?: Totals

  setCartItems: (items: CartItem[]) => void
  saveAddress?: boolean
  onVNPayPayment?: () => void
  isProcessing?: boolean
}

/* ===================== Component ===================== */

export default function OrderSummary({
  cartItems,
  paymentMethod,
  addressId,

  appliedVoucher = null,
  voucherCode = null,
  globalVoucherCode = null,
  shopVouchers = [],

  manualAddressData,
  setCartItems,
  serverDiscount = null,
  serverFreeShipping = false,
  totals,
  saveAddress = false,
  onVNPayPayment,
  isProcessing = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [popupType, setPopupType] = useState<"success" | "error" | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  const popupTimerRef = useRef<NodeJS.Timeout | null>(null)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)

  const saveOnceRef = useRef(false)

  const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const getPriceToUse = (item: CartItem) => {
  const cands = [item.variant?.sale_price, item.variant?.price, item.product.sale_price, item.product.price];
  for (const v of cands) {
    const n = num(v);
    if (n > 0) return n;          // chỉ nhận giá > 0
  }
  return 0;
};

  const getOriginalPrice = (item: CartItem) => num(item.variant?.price ?? item.product.price)

  // ======== Tính tiền local (fallback) =========
  const {
    subtotal: localSubtotal,
    promotionDiscount: localPromo,
    voucherDiscount: localVoucherDiscount,
    shipping: localShipping,
  } = useMemo(() => {
    const subtotal = cartItems.reduce((s, it) => s + getOriginalPrice(it) * it.quantity, 0)
    const discountedSubtotal = cartItems.reduce((s, it) => s + getPriceToUse(it) * it.quantity, 0)
    const promotionDiscount = Math.max(0, subtotal - discountedSubtotal)
    const shippingBase = cartItems.length > 0 ? 20000 : 0
    const voucherDiscount = typeof serverDiscount === "number" ? Math.max(0, Math.floor(serverDiscount)) : 0
    const shipping = serverFreeShipping ? 0 : shippingBase
    return { subtotal, promotionDiscount, voucherDiscount, shipping }
  }, [cartItems, serverDiscount, serverFreeShipping])

  // ======== Giá trị hiển thị summary =========
  const subtotal = localSubtotal
  const promotionDiscount = localPromo
  const voucherDiscount = totals?.voucherDiscount ?? localVoucherDiscount
  const shipping = totals?.shipping ?? localShipping
  const finalTotal = Math.max(0, subtotal - promotionDiscount - voucherDiscount + shipping)

  /** ===== Lưu địa chỉ (đăng nhập + nhập tay + tick + không chọn addressId) ===== */
  const trySaveManualAddress = async () => {
    const token = localStorage.getItem("token") || Cookies.get("authToken")
    if (!token || !manualAddressData) return

    const parts = (manualAddressData.city || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const ward = parts[0] || ""
    const district = parts[1] || ""
    const province = parts[2] || parts[1] || ""
    const city = province

    const ok =
      manualAddressData.full_name &&
      manualAddressData.phone &&
      manualAddressData.address &&
      ward &&
      district &&
      province

    if (!ok) return

    const me = await axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const user_id = me.data?.id

    const payload = {
      full_name: manualAddressData.full_name,
      phone: manualAddressData.phone,
      address: manualAddressData.address,
      ward,
      district,
      province,
      city,
      note: "",
      is_default: false,
      type: "Nhà Riêng",
      user_id,
    }

    await axios.post(`${API_BASE_URL}/addresses`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })
  }

  const maybeSaveManualAddress = async () => {
    if (saveOnceRef.current) return
    const token = localStorage.getItem("token") || Cookies.get("authToken")
    const isGuest = !token
    if (isGuest) return
    if (!saveAddress) return
    if (!!addressId) return
    if (!manualAddressData) return

    await trySaveManualAddress()
    saveOnceRef.current = true
  }

  /* ============== Gộp mã voucher để gửi BE ============== */
  const globalCode: string | null = voucherCode ?? appliedVoucher?.code ?? globalVoucherCode ?? null

  const voucherCodesArray: ShopVoucher[] | undefined =
    Array.isArray(shopVouchers) && shopVouchers.length ? shopVouchers : undefined

  /* ============== Đặt hàng ============== */
  const handlePlaceOrder = async () => {
    if (paymentMethod === "vnpay" && onVNPayPayment) {
      onVNPayPayment()
      return
    }

    if (!addressId && !manualAddressData) {
      setError("Vui lòng chọn hoặc nhập địa chỉ giao hàng.")
      setPopupType("error")
      setShowPopup(true)
      return
    }
    // Tạo mảng id cart từ danh sách đang checkout
const cartItemIds = cartItems
  .map((it) => Number(it.id))
  .filter((n) => Number.isFinite(n) && n > 0);

    setLoading(true)
    setError("")
    setSuccessMessage("")
    setShowPopup(false)
    setPopupType(null)

    try {
      const token = localStorage.getItem("token") || Cookies.get("authToken")
      const isGuest = !token

      const globalCode: string | null = voucherCode ?? appliedVoucher?.code ?? globalVoucherCode ?? null

      const cart_items = buildCartItemsPayload(cartItems)

      const basePayload: any = {
        payment_method: (paymentMethod || "").toLowerCase(),
        voucher_code: globalCode,
      }

      if (Array.isArray(shopVouchers) && shopVouchers.length) {
        basePayload.voucher_codes = shopVouchers
      }

      let url = ""
      let payload: any = {}

      if (isGuest) {
        url = `${API_BASE_URL}/nologin`
        if (!manualAddressData) {
          throw new Error("Khách vãng lai cần nhập địa chỉ giao hàng.")
        }
        if (!cart_items.length) {
          throw new Error("Giỏ hàng trống hoặc thiếu sản phẩm hợp lệ.")
        }
        payload = {
          ...basePayload,
          cart_items,
          address_manual: {
            full_name: manualAddressData.full_name || "",
            address:
              `${manualAddressData.address || ""}` +
              (manualAddressData.apartment ? `, ${manualAddressData.apartment}` : ""),
            city: manualAddressData.city || "",
            phone: manualAddressData.phone || "",
            email: manualAddressData.email || "",
          },
        }
      } else {
        url = `${API_BASE_URL}/dathang`
        payload = {
          ...basePayload,
          cart_item_ids: cartItemIds,
        }

        if (manualAddressData && Object.values(manualAddressData).some((v) => (v ?? "").toString().trim() !== "")) {
          payload.address_manual = {
            full_name: manualAddressData.full_name,
            address:
              `${manualAddressData.address}` + (manualAddressData.apartment ? `, ${manualAddressData.apartment}` : ""),
            city: manualAddressData.city,
            phone: manualAddressData.phone,
            email: manualAddressData.email,
          }
        } else if (addressId) {
          payload.address_id = addressId
        } else {
          throw new Error("Thiếu địa chỉ giao hàng.")
        }
      }

      const headers: any = { "Content-Type": "application/json" }
      if (!isGuest) headers.Authorization = `Bearer ${token}`

      console.log("[v0] Sending order request:", { url, payload })
      const response = await axios.post(url, payload, { headers })
      console.log("[v0] Order response:", response.data)

      if (response.data?.redirect_url || response.data?.payment_url) {
        const redirectUrl = response.data.redirect_url || response.data.payment_url
        console.log("[v0] VNPay redirect URL:", redirectUrl)

const orderedSet = new Set(cartItems.map(it => String(it.id)));
const raw = localStorage.getItem('cart');
const current = raw ? JSON.parse(raw) : [];
const remain = current.filter((it: any) => !orderedSet.has(String(it.id)));
localStorage.setItem('cart', JSON.stringify(remain));


        // Add a small delay to ensure state updates are processed
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 100)
        return
      }

      setSuccessMessage("Đặt hàng thành công!")
      setPopupType("success")
      setShowPopup(true)

      // Với guest: chỉ loại bỏ những món đã đặt, giữ lại phần còn lại
try {
  const orderedSet = new Set(cartItems.map(it => String(it.id)));
  const raw = localStorage.getItem("cart");
  const current = raw ? JSON.parse(raw) : [];
  const remain = current.filter((it: any) => !orderedSet.has(String(it.id)));
  if (remain.length) {
    localStorage.setItem("cart", JSON.stringify(remain));
  } else {
    localStorage.removeItem("cart");
  }
} catch { /* ignore parse errors */ }

// Cập nhật UI
setCartItems([]);
window.dispatchEvent(new Event("cartUpdated"));

      redirectTimerRef.current = setTimeout(() => {
        window.location.href = "/"
      }, 2500)

      if (!isGuest) {
        await maybeSaveManualAddress()
      }
    } catch (err: any) {
      console.error("[v0] Order error:", err)
      const msg = err.response?.data?.message || err.message || "Lỗi đặt hàng"
      setError(msg)
      setPopupType("error")
      setShowPopup(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showPopup) {
      // Clear any existing timer
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
      }

      popupTimerRef.current = setTimeout(() => {
        setShowPopup(false)
        setPopupType(null)
      }, 4000)
    }

    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
      }
    }
  }, [showPopup])

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const buildCartItemsPayload = (list: CartItem[]) => {
    return list
      .map((it) => {
        const product_id = Number(it.product?.id)

        const rawVarId = (it.variant?.id ?? null) as any
        const variant_id =
          rawVarId === null || rawVarId === undefined
            ? null
            : Number.isFinite(Number(rawVarId))
              ? Number(rawVarId)
              : null

        const quantity = Number(it.quantity)
const price = getPriceToUse(it);

        return { product_id, variant_id, quantity, price }
      })
      .filter((x) => Number.isFinite(x.product_id) && x.product_id > 0 && Number.isFinite(x.price) && x.quantity > 0)
  }

  /* ===================== UI ===================== */

  return (
    <div className="space-y-6 text-sm relative">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tóm tắt đơn hàng</h3>

        <div className="border-t border-gray-300 pt-4 space-y-1">
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span>Tạm tính (giá gốc):</span>
            <span>{subtotal.toLocaleString("vi-VN")}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Khuyến mãi:</span>
            <span className="text-green-700">-{promotionDiscount.toLocaleString("vi-VN")}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Voucher:</span>
            <span className="text-green-700">-{(voucherDiscount || 0).toLocaleString("vi-VN")}đ</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Phí vận chuyển:</span>
            <span>{(shipping || 0).toLocaleString("vi-VN")}đ</span>
          </div>

          <div className="flex justify-between font-semibold text-lg text-brand pt-3">
            <span>Tổng thanh toán:</span>
            <span>{finalTotal.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing || loading}
            className="bg-brand hover:bg-red-600 text-white w-[186px] h-[56px] rounded text-sm font-semibold disabled:opacity-60"
          >
            {isProcessing || loading
              ? paymentMethod === "vnpay"
                ? "Đang chuyển hướng..."
                : "Đang xử lý..."
              : "Đặt hàng"}
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center pointer-events-none">
          <div
            ref={popupRef}
            className="bg-white rounded-lg p-6 w-80 flex flex-col items-center relative animate-scaleIn shadow-lg border pointer-events-auto"
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mb-4 ${popupType === "success" ? "text-green-600" : "text-red-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={popupType === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
              />
            </svg>

            <p
              className={`text-base font-semibold text-center ${popupType === "success" ? "text-green-700" : "text-red-700"}`}
            >
              {popupType === "success" ? successMessage : error}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
