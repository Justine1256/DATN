import Cookies from "js-cookie"
import { API_BASE_URL } from "@/utils/api"

export interface Order {
    id: number
    order_code: string
    created_at: string
    shipping_address: string
    total_amount: number
    quantity: number
    payment_method: string
    shipping_status: string
    order_status: string
    order_admin_status: string
    customer_name: string
    customer_phone: string
    items: OrderItem[]
}

export interface OrderItem {
    id: number
    product_name: string
    quantity: number
    price: number
    variant?: string
}

export interface OrderStats {
    all: number
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
}

export interface FetchOrdersParams {
    page?: number
    search?: string
    status?: string
    date?: string
    tab?: string
}

export interface FetchOrdersResponse {
    orders: Order[]
    total_pages: number
    current_page: number
    total: number
}

// Get auth headers
const getAuthHeaders = () => {
    const token = Cookies.get("authToken")
    if (!token) {
        throw new Error("No authentication token found")
    }

    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    }
}

// Fetch orders
export const fetchOrders = async (params: FetchOrdersParams = {}): Promise<FetchOrdersResponse> => {
    try {
        const searchParams = new URLSearchParams()

        if (params.page) searchParams.append("page", params.page.toString())
        if (params.search) searchParams.append("search", params.search)
        if (params.status && params.status !== "all") searchParams.append("status", params.status)
        if (params.date) searchParams.append("date", params.date)
        if (params.tab && params.tab !== "all") searchParams.append("tab", params.tab)

        const response = await fetch(`${API_BASE_URL}/admin/orders?${searchParams}`, {
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized - Please login again")
            }
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        return {
            orders: data.data || data.orders || data || [],
            total_pages: data.last_page || data.total_pages || Math.ceil((data.total || 0) / 10),
            current_page: data.current_page || params.page || 1,
            total: data.total || 0,
        }
    } catch (error) {
        console.error("Error fetching orders:", error)
        throw error
    }
}

// Fetch order statistics
export const fetchOrderStats = async (): Promise<OrderStats> => {
    try {
        const response = await fetch(`${API_BASE_URL}/order-admin-statistics`, {
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            throw new Error("Failed to fetch order statistics")
        }

        const data = await response.json()

        return {
            all: data.all || 0,
            pending: data.pending || 0,
            processing: data.processing || 0,
            shipped: data.shipped || 0,
            delivered: data.delivered || 0,
            cancelled: data.cancelled || 0,
        }
    } catch (error) {
        console.error("Error fetching order stats:", error)
        throw error
    }
}

// Update order status
export const updateOrderStatus = async (orderId: number, status: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        })

        if (!response.ok) {
            throw new Error("Failed to update order status")
        }
    } catch (error) {
        console.error("Error updating order status:", error)
        throw error
    }
}

// Handle refund request
export const handleRefundRequest = async (orderId: number, approve: boolean, reason: string): Promise<void> => {
    try {
        const endpoint = approve ? "approve" : "reject"
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/refund/${endpoint}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        })

        if (!response.ok) {
            throw new Error("Failed to process refund request")
        }
    } catch (error) {
        console.error("Error processing refund request:", error)
        throw error
    }
}

// Cancel order
export const cancelOrder = async (orderId: number, reason: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/cancel`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        })

        if (!response.ok) {
            throw new Error("Failed to cancel order")
        }
    } catch (error) {
        console.error("Error cancelling order:", error)
        throw error
    }
}

// Export invoice
export const exportInvoice = async (orderId: number): Promise<void> => {
    try {
        const token = Cookies.get("authToken")
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/pdf",
            },
        })

        if (!response.ok) {
            throw new Error("Failed to export invoice")
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `invoice_order_${orderId}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Error exporting invoice:", error)
        throw error
    }
}

// Calculate stats from orders (fallback)
export const calculateStatsFromOrders = (orders: Order[]): OrderStats => {
    const CANCEL_STATUSES = [
        "Khách hàng hủy",
        "Người bán hủy",
        "Hủy - Thanh toán thất bại",
        "Hủy - Khách từ chối nhận hàng",
        "Chờ duyệt hủy đơn",
        "Chưa thanh toán",
    ]

    const stats = {
        all: orders.length,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
    }

    orders.forEach((order) => {
        const status = order.order_admin_status
        if (status === "Chờ xử lý" || status === "Đang xử lý") {
            stats.pending++
        } else if (status === "Đã xử lý" || status === "Sẵn sàng giao hàng") {
            stats.processing++
        } else if (status === "Đang giao hàng") {
            stats.shipped++
        } else if (status === "Đã giao hàng") {
            stats.delivered++
        } else if (CANCEL_STATUSES.includes(status)) {
            stats.cancelled++
        }
    })

    return stats
}
