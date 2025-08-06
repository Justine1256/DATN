import type { Product } from "./product"

// Trạng thái đơn hàng (order_status)
export enum OrderStatus {
    Pending = "Pending", // Đang chờ
    OrderConfirmation = "order confirmation", // Đang xác nhận
    Shipped = "Shipped", // Đang giao
    Delivered = "Delivered", // Đã giao
    Canceled = "Canceled", // Đã huỷ
    ReturnRequested = "Return Requested", // Yêu cầu hoàn đơn
    Returning = "Returning", // Đang hoàn đơn
    Refunded = "Refunded", // Đã hoàn tiền
    Rejected ="Rejected"
}

// Trạng thái giao hàng (shipping_status)
export enum ShippingStatus {
    Pending = "Pending", // Chờ giao
    Shipping = "Shipping", // Đang giao
    Delivered = "Delivered", // Đã giao
    Failed = "Failed", // Thất bại
}
export enum ReturnStatus {
    None = "None",           // Không có yêu cầu
    Requested = "Requested", // Người dùng đã gửi yêu cầu
    Approved = "Approved",   // Admin duyệt hoàn đơn
    Rejected = "Rejected",   // Admin từ chối hoàn đơn
    Returning = "Returning", // Người dùng đang gửi hàng
    Refunded = "Refunded",   // Đã hoàn tiền
}
// Trạng thái thanh toán
export enum PaymentStatus {
    Pending = "pending", // Chờ thanh toán
    Paid = "paid", // Đã thanh toán
    Failed = "failed", // Thanh toán thất bại
    Refunded = "refunded", // Đã hoàn tiền
    PartiallyRefunded = "partially_refunded", // Hoàn tiền một phần
}

// Phương thức thanh toán
export enum PaymentMethod {
    COD = "COD", // Thanh toán khi nhận hàng
    BankTransfer = "bank_transfer", // Chuyển khoản ngân hàng
    CreditCard = "credit_card", // Thẻ tín dụng
    EWallet = "e_wallet", // Ví điện tử
    Momo = "momo", // Ví MoMo
    ZaloPay = "zalopay", // ZaloPay
}

export interface OrderDetail {
    id: number
    order_id: number
    product_id: number
    price_at_time: string
    quantity: number
    subtotal: string
    product: Product
    reviewed?: boolean // Đã đánh giá hay chưa
    product_value?: string
    shop_id?: number
    created_at?: string
    updated_at?: string
}

export interface RefundRequest {
    id: number
    order_id: number
    reason: string
    images: string[]
    status: "pending" | "approved" | "rejected"
    created_at: string
    updated_at: string
    admin_response?: string
}

export interface OrderTimeline {
    id: number
    order_id: number
    status: OrderStatus
    description: string
    created_at: string
    created_by?: string
}

export interface ShippingInfo {
    tracking_number?: string
    carrier?: string
    estimated_delivery?: string
    actual_delivery?: string
    shipping_fee: string
    shipping_address: string
    recipient_name: string
    recipient_phone: string
}
export const getOrderStatusLabel = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.Pending:
            return "Đang chờ xử lý"
        case OrderStatus.OrderConfirmation:
            return "Đang xác nhận"
        case OrderStatus.Shipped:
            return "Đã gửi hàng"
        case OrderStatus.Delivered:
            return "Đã giao hàng"
        case OrderStatus.Canceled:
            return "Đã hủy"
        case OrderStatus.ReturnRequested:
            return "Yêu cầu hoàn đơn"
        case OrderStatus.Returning:
            return "Đang hoàn hàng"
        case OrderStatus.Refunded:
            return "Đã hoàn tiền"
        default:
            return "Không xác định"
    }
}

export const getShippingStatusLabel = (status: ShippingStatus): string => {
    switch (status) {
        case ShippingStatus.Pending:
            return "Chờ giao hàng"
        case ShippingStatus.Shipping:
            return "Đang giao"
        case ShippingStatus.Delivered:
            return "Đã giao"
        case ShippingStatus.Failed:
            return "Giao thất bại"
        default:
            return "Không xác định"
    }
}
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
        case PaymentMethod.COD:
            return "Thanh toán khi nhận hàng"
        case PaymentMethod.BankTransfer:
            return "Chuyển khoản ngân hàng"
        case PaymentMethod.CreditCard:
            return "Thẻ tín dụng"
        case PaymentMethod.EWallet:
            return "Ví điện tử"
        case PaymentMethod.Momo:
            return "Ví MoMo"
        case PaymentMethod.ZaloPay:
            return "Ví ZaloPay"
        default:
            return "Không xác định"
    }
}
export const getPaymentStatusLabel = (status: PaymentStatus): string => {
    switch (status) {
        case PaymentStatus.Pending:
            return "Chờ thanh toán"
        case PaymentStatus.Paid:
            return "Đã thanh toán"
        case PaymentStatus.Failed:
            return "Thanh toán thất bại"
        case PaymentStatus.Refunded:
            return "Đã hoàn tiền"
        case PaymentStatus.PartiallyRefunded:
            return "Hoàn tiền một phần"
        default:
            return "Không xác định"
    }
}
export const translateReturnStatus = (status: string): string => {
    switch (status) {
        case "Return Requested":
            return "Yêu cầu hoàn hàng"
        case "Returning":
            return "Đang gửi trả hàng"
        case "Refunded":
            return "Đã hoàn tiền"
        case "Rejected":
            return "Từ chối hoàn hàng"
        case "None":
            return "Không hoàn"
        default:
            return status
    }
}

export interface Order {
    id: number
    user_id: number
    shop_id: number
    final_amount: string
    subtotal: string
    shipping_fee: string
    tax_amount?: string
    discount_amount?: string
    order_status: OrderStatus
    shipping_status: ShippingStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    created_at: string
    updated_at: string
    order_details: OrderDetail[]
    shop_name: string
    shipping_info: ShippingInfo
    refund_request?: RefundRequest
    timeline?: OrderTimeline[]
    notes?: string
    cancellation_requested?: boolean
    refund_requested?: boolean
    can_cancel?: boolean
    can_refund?: boolean
    can_review?: boolean
    // Các trường bổ sung
    return_status?: string
    refund_status?: string
    tracking_number?: string
    customer_note?: string
    expected_delivery?: string
    actual_delivery?: string
    shipping_method?: string
    payment_reference?: string
    shipping_address: string
}

// Helper functions for order management
export const getOrderStatusColor = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.Pending:
            return "text-amber-700 bg-amber-50 border-amber-200"
        case OrderStatus.OrderConfirmation:
            return "text-blue-700 bg-blue-50 border-blue-200"
        case OrderStatus.Shipped:
            return "text-cyan-700 bg-cyan-50 border-cyan-200"
        case OrderStatus.Delivered:
            return "text-emerald-700 bg-emerald-50 border-emerald-200"
        case OrderStatus.Canceled:
            return "text-red-700 bg-red-50 border-red-200"
        case OrderStatus.ReturnRequested:
            return "text-orange-700 bg-orange-50 border-orange-200"
        case OrderStatus.Returning:
            return "text-purple-700 bg-purple-50 border-purple-200"
        case OrderStatus.Refunded:
            return "text-green-700 bg-green-50 border-green-200"
        default:
            return "text-gray-700 bg-gray-50 border-gray-200"
    }
}
export const getReturnStatusColor = (status: ReturnStatus): string => {
    switch (status) {
        case ReturnStatus.Requested:
            return "text-orange-700 bg-orange-50 border-orange-200"
        case ReturnStatus.Approved:
            return "text-blue-700 bg-blue-50 border-blue-200"
        case ReturnStatus.Rejected:
            return "text-red-700 bg-red-50 border-red-200"
        case ReturnStatus.Returning:
            return "text-purple-700 bg-purple-50 border-purple-200"
        case ReturnStatus.Refunded:
            return "text-green-700 bg-green-50 border-green-200"
        case ReturnStatus.None:
        default:
            return "text-gray-700 bg-gray-50 border-gray-200"
    }
}
export const getReturnStatusLabel = (status: ReturnStatus): string => {
    switch (status) {
        case ReturnStatus.Requested:
            return "Yêu cầu hoàn"
        case ReturnStatus.Approved:
            return "Đã duyệt"
        case ReturnStatus.Rejected:
            return "Từ chối hoàn"
        case ReturnStatus.Returning:
            return "Đang gửi hàng"
        case ReturnStatus.Refunded:
            return "Hoàn tất hoàn tiền"
        case ReturnStatus.None:
        default:
            return "Không có"
    }
}

export const getShippingStatusColor = (status: ShippingStatus): string => {
    switch (status) {
        case ShippingStatus.Pending:
            return "text-amber-700 bg-amber-50 border-amber-200"
        case ShippingStatus.Shipping:
            return "text-blue-700 bg-blue-50 border-blue-200"
        case ShippingStatus.Delivered:
            return "text-emerald-700 bg-emerald-50 border-emerald-200"
        case ShippingStatus.Failed:
            return "text-red-700 bg-red-50 border-red-200"
        default:
            return "text-gray-700 bg-gray-50 border-gray-200"
    }
}

export const getOrderStatusIcon = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.Pending:
            return "clock"
        case OrderStatus.OrderConfirmation:
            return "check-circle"
        case OrderStatus.Shipped:
            return "truck"
        case OrderStatus.Delivered:
            return "package"
        case OrderStatus.Canceled:
            return "x-circle"
        case OrderStatus.ReturnRequested:
            return "rotate-ccw"
        case OrderStatus.Returning:
            return "truck"
        case OrderStatus.Refunded:
            return "check-circle"
        default:
            return "package"
    }
}

export const canCancelOrder = (order: Order): boolean => {
    return order.order_status === OrderStatus.Pending || order.order_status === OrderStatus.OrderConfirmation
}

export const canRefundOrder = (order: Order): boolean => {
    return order.order_status === OrderStatus.Delivered
}

export const canReviewOrder = (order: Order): boolean => {
    return order.order_status === OrderStatus.Delivered && !order.order_details.every((detail) => detail.reviewed)
}

export const getOrderProgress = (status: OrderStatus): number => {
    switch (status) {
        case OrderStatus.Pending:
            return 25
        case OrderStatus.OrderConfirmation:
            return 50
        case OrderStatus.Shipped:
            return 75
        case OrderStatus.Delivered:
            return 100
        case OrderStatus.Canceled:
            return 0
        case OrderStatus.ReturnRequested:
            return 25
        case OrderStatus.Returning:
            return 50
        case OrderStatus.Refunded:
            return 100
        default:
            return 0
    }
}

// Order filtering helpers
export const filterOrdersByStatus = (orders: Order[], status: string): Order[] => {
    if (status === "all") return orders
    if (status === "processing")
        return orders.filter(
            (o) => o.order_status === OrderStatus.Pending || o.order_status === OrderStatus.OrderConfirmation,
        )
    if (status === "shipping") return orders.filter((o) => o.order_status === OrderStatus.Shipped)
    if (status === "delivered") return orders.filter((o) => o.order_status === OrderStatus.Delivered)
    if (status === "canceled") return orders.filter((o) => o.order_status === OrderStatus.Canceled)
    if (status === "return_requested") return orders.filter((o) => o.order_status === OrderStatus.ReturnRequested)
    if (status === "returning") return orders.filter((o) => o.order_status === OrderStatus.Returning)
    if (status === "refunded") return orders.filter((o) => o.order_status === OrderStatus.Refunded)
    return orders
}

// Order statistics helpers
export const calculateOrderStats = (orders: Order[]) => {
    const total = orders.length
    const pending = orders.filter((o) => o.order_status === OrderStatus.Pending).length
    const confirmed = orders.filter((o) => o.order_status === OrderStatus.OrderConfirmation).length
    const shipped = orders.filter((o) => o.order_status === OrderStatus.Shipped).length
    const delivered = orders.filter((o) => o.order_status === OrderStatus.Delivered).length
    const canceled = orders.filter((o) => o.order_status === OrderStatus.Canceled).length
    const returnRequested = orders.filter((o) => o.order_status === OrderStatus.ReturnRequested).length
    const returning = orders.filter((o) => o.order_status === OrderStatus.Returning).length
    const refunded = orders.filter((o) => o.order_status === OrderStatus.Refunded).length

    const totalRevenue = orders
        .filter((o) => o.order_status === OrderStatus.Delivered)
        .reduce((sum, order) => sum + Number.parseFloat(order.final_amount), 0)

    return {
        total,
        pending,
        confirmed,
        shipped,
        delivered,
        canceled,
        returnRequested,
        returning,
        refunded,
        totalRevenue,
    }
}
