"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    User,
    Package,
    Search,
    RefreshCw,
    FileText,
    Clock,
    X,
    Phone,
    Mail,
} from "lucide-react"

// ====== API base ======
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

// ====== Constants ======
const STATIC_BASE_URL = "https://api.marketo.info.vn/storage"

// ====== Helpers ======
const formatImageUrl = (img: unknown): string => {
    if (Array.isArray(img)) img = img[0]
    if (typeof img !== "string" || !img.trim()) {
        return `${STATIC_BASE_URL}/products/default-product.png`
    }
    if ((img as string).startsWith("http")) return img as string
    return (img as string).startsWith("/")
        ? `${STATIC_BASE_URL}${img as string}`
        : `${STATIC_BASE_URL}/${img as string}`
}
const formatLogoUrl = (logo: string | null | undefined) =>
    logo ? formatImageUrl(logo) : "/placeholder.svg?height=40&width=40"

// ====== Types ======
type ReturnStatus = "Requested" | "Approved" | "Rejected" | "Processing" | "Resolved" | "Pending"

interface RefundReportListItem {
    report_id?: number
    order_id: number
    user: { id: number; name: string }
    shop: { id: number; name: string; logo: string | null }
    reason: string | null
    return_status: ReturnStatus
    return_confirmed_at?: string | null
    created_at?: string | null
    product_image: string[]
}

interface RefundReportDetail {
    report_id: number
    order_id: number
    user: {
        id: number
        name: string
        email: string
        phone: string
        avatar: string
    }
    shop: {
        id: number
        name: string
        logo: string | null
        email?: string
    }
    report_reason: string
    photos: string[]
    product_images: Array<{ product_id: number; product_name: string; image: string[] }>
    created_at: string
    status: ReturnStatus
    admin_note?: string
    processed_at?: string
    processed_by?: number
}

export default function RefundReportsPage() {
    const [allReports, setAllReports] = useState<RefundReportListItem[]>([])
    const [currentReports, setCurrentReports] = useState<RefundReportListItem[]>([])
    const [selectedReport, setSelectedReport] = useState<RefundReportDetail | null>(null)

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [showDetailModal, setShowDetailModal] = useState(false)

    // Notification
    const [showPopup, setShowPopup] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [popupType, setPopupType] = useState<"success" | "error" | "warning">("success")

    // Reject modal
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [rejectionNote, setRejectionNote] = useState("")
    const [selectedOrderForReject, setSelectedOrderForReject] = useState<number | null>(null)

    // ====== Pagination (client-side) ======
    const [page, setPage] = useState(1)
    const pageSize = 10

    const showNotification = (message: string, type: "success" | "error" | "warning" = "success") => {
        setPopupMessage(message)
        setPopupType(type)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 4000)
    }

    const openRejectModalFromDetail = (orderId: number) => {
        setSelectedOrderForReject(orderId)
        setRejectionReason("")
        setRejectionNote("")
        setShowDetailModal(false)
        setShowRejectModal(true)
    }

    // ====== 1) LIST: GET /show/shop/refund-reports ======
    const fetchRefundReports = async () => {
        const url = `${API_BASE}/show/shop/refund-reports`
        const startedAt = Date.now()

        try {
            setLoading(true)
            setError(null)

            const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1]
            if (!token) throw new Error("Không tìm thấy token xác thực")

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(30000),
            })

            const result = await res.json().catch(() => ({} as any))
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(result) || "Lỗi từ server"}`)

            const rows: any[] = (result.data || result || []) as any[]

            const reports: RefundReportListItem[] = rows.map((r, idx) => {
                const orderId = r.order_id ?? r.orderId ?? r.order?.id ?? r.id ?? null
                return {
                    report_id: r.report_id ?? r.id ?? idx,
                    order_id: orderId !== null ? Number(orderId) : 0,
                    user: { id: r.user?.id ?? r.user_id ?? 0, name: r.user?.name ?? r.user_name ?? "N/A" },
                    shop: {
                        id: r.shop?.id ?? r.shop_id ?? 0,
                        name: r.shop?.name ?? r.shop_name ?? "N/A",
                        logo: r.shop?.logo ?? null,
                    },
                    reason: r.reason ?? r.report_reason ?? r.refund_reason ?? null,
                    return_status: (r.return_status as ReturnStatus) ?? (r.status as ReturnStatus) ?? "Requested",
                    return_confirmed_at: r.return_confirmed_at ?? r.confirmed_at ?? null,
                    created_at: r.created_at ?? null,
                    product_image: Array.isArray(r.product_image) ? r.product_image : r.images ?? [],
                }
            })

            setAllReports(reports)
            const filtered =
                statusFilter === "all" ? reports : reports.filter((r) => (r.return_status || "Requested") === (statusFilter as ReturnStatus))
            setCurrentReports(filtered)

            showNotification("Đã tải dữ liệu thành công!", "success")
        } catch (err: any) {
            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"
            if (err instanceof Error) {
                if ((err as any).name === "AbortError") errorMessage = "Yêu cầu bị timeout, vui lòng thử lại"
                else if (err.message.includes("Failed to fetch")) errorMessage = "Không thể kết nối đến server, kiểm tra kết nối mạng"
                else errorMessage = err.message
            }
            setError(errorMessage)
            showNotification(errorMessage, "error")
        } finally {
            setLoading(false)
            void startedAt
        }
    }
    const tabConfigs = [
        { key: "all", label: "Tất cả", count: allReports.length, color: "gray" },
        { key: "Requested", label: "Đã yêu cầu", count: allReports.filter(r => r.return_status === "Requested").length, color: "yellow" },
        { key: "Approved", label: "Đã duyệt", count: allReports.filter(r => ["Approved", "Resolved"].includes(r.return_status)).length, color: "green" },
        { key: "Rejected", label: "Đã từ chối", count: allReports.filter(r => r.return_status === "Rejected").length, color: "red" },
    ]

    const colorClasses: Record<string, { active: string; badgeActive: string; badge: string }> = {
        gray: { active: "bg-gray-600 text-white border-gray-600", badgeActive: "bg-white/20 text-white", badge: "bg-gray-100 text-gray-700 border border-gray-200" },
        yellow: { active: "bg-yellow-600 text-white border-yellow-600", badgeActive: "bg-white/20 text-white", badge: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
        green: { active: "bg-green-600 text-white border-green-600", badgeActive: "bg-white/20 text-white", badge: "bg-green-100 text-green-700 border border-green-200" },
        red: { active: "bg-red-600 text-white border-red-600", badgeActive: "bg-white/20 text-white", badge: "bg-red-100 text-red-700 border border-red-200" },
    }

    // ====== 2) DETAIL: GET /orders/{id}/refund-detail ======
    const extractReason = (raw: any): string => {
        const r =
            raw?.cancel_reason ??
            raw?.report_reason ??
            raw?.refund_reason ??
            raw?.return_reason ??
            raw?.reason ??
            raw?.refund?.reason ??
            raw?.refund_request?.reason ??
            raw?.data?.reason ??
            raw?.detail?.reason ??
            raw?.refund_note ??
            raw?.note ??
            raw?.description ??
            raw?.customer_note ??
            raw?.customer_reason ??
            ""
        return typeof r === "string" ? r : ""
    }

    const fetchRefundReportDetail = async (orderId: number | string) => {
        const id = Number(orderId)
        if (!id || Number.isNaN(id)) {
            showNotification("Mã đơn hàng không hợp lệ", "error")
            return
        }

        const url = `${API_BASE}/orders/${id}/refund-detail`
        const startedAt = Date.now()

        try {
            setDetailLoading(true)
            const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1]
            if (!token) throw new Error("Không tìm thấy token xác thực")

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(30000),
            })

            const result = await res.json().catch(() => ({} as any))
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(result) || "Lỗi từ server"}`)

            const raw = result.data || result

            const statusNormalized: ReturnStatus =
                (raw?.status as ReturnStatus) ?? (raw?.return_status as ReturnStatus) ?? "Pending"

            const detailData: RefundReportDetail = {
                report_id: raw.report_id ?? raw.id ?? 0,
                order_id: id,
                user: {
                    id: raw.user?.id ?? raw.user_id ?? 0,
                    name: raw.user?.name ?? raw.user_name ?? "N/A",
                    email: raw.user?.email ?? "",
                    phone: raw.user?.phone ?? "",
                    avatar: raw.user?.avatar ?? "",
                },
                shop: {
                    id: raw.shop?.id ?? raw.shop_id ?? 0,
                    name: raw.shop?.name ?? raw.shop_name ?? "N/A",
                    logo: raw.shop?.logo ?? null,
                    email: raw.shop?.email ?? "",
                },
                report_reason: extractReason(raw),
                photos: raw.photos ?? raw.images ?? [],
                product_images: raw.product_images ?? raw.items ?? [],
                created_at: raw.created_at ?? new Date().toISOString(),
                status: statusNormalized,
                admin_note: raw.admin_note,
                processed_at: raw.processed_at ?? raw.return_confirmed_at ?? undefined,
                processed_by: raw.processed_by,
            }

            setSelectedReport(detailData)
            setShowDetailModal(true)
        } catch (err: any) {
            showNotification(err?.message || "Có lỗi xảy ra khi tải chi tiết", "error")
        } finally {
            setDetailLoading(false)
            void startedAt
        }
    }

    // ====== 3) REJECT: POST /orders/{id}/refund/reject ======
    const confirmRejectRefundReport = async () => {
        if (!selectedOrderForReject || !rejectionReason.trim()) {
            showNotification("Vui lòng nhập lý do từ chối", "error")
            return
        }
        const url = `${API_BASE}/orders/${selectedOrderForReject}/refund/reject`
        const startedAt = Date.now()
        try {
            setActionLoading(true)
            const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1]
            if (!token) throw new Error("Không tìm thấy token xác thực")

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
                body: JSON.stringify({ rejection_reason: rejectionReason.trim(), admin_note: rejectionNote.trim() || "Từ chối đơn khiếu nại" }),
                signal: AbortSignal.timeout(30000),
            })
            const data = await res.json().catch(() => ({} as any))
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data) || "Lỗi từ server"}`)

            setShowRejectModal(false)
            setShowDetailModal(false)
            setSelectedReport(null)
            setSelectedOrderForReject(null)
            await fetchRefundReports()
            showNotification("Đã từ chối đơn khiếu nại!", "warning")
        } catch (err: any) {
            showNotification(err?.message || "Có lỗi xảy ra khi từ chối đơn khiếu nại", "error")
        } finally {
            setActionLoading(false)
            void startedAt
        }
    }

    // ====== 4) APPROVE: POST /orders/{id}/refund/approve ======
    const approveRefundReport = async (orderId: number) => {
        const url = `${API_BASE}/orders/${orderId}/refund/approve`
        const startedAt = Date.now()
        try {
            setActionLoading(true)
            const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1]
            if (!token) throw new Error("Không tìm thấy token xác thực")

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
                body: JSON.stringify({ admin_note: "Đã duyệt đơn khiếu nại" }),
                signal: AbortSignal.timeout(30000),
            })
            const data = await res.json().catch(() => ({} as any))
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data) || "Lỗi từ server"}`)

            await fetchRefundReports()
            setShowDetailModal(false)
            setSelectedReport(null)
            showNotification("Đã duyệt đơn khiếu nại thành công!", "success")
        } catch (err: any) {
            showNotification(err?.message || "Có lỗi xảy ra khi duyệt đơn khiếu nại", "error")
        } finally {
            setActionLoading(false)
            void startedAt
        }
    }

    // Effects
    useEffect(() => {
        fetchRefundReports()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const filtered = statusFilter === "all" ? allReports : allReports.filter((r) => r.return_status === (statusFilter as ReturnStatus))
        setCurrentReports(filtered)
        setPage(1) // reset về trang 1 khi đổi filter
    }, [statusFilter, allReports])

    useEffect(() => {
        setPage(1) // reset về trang 1 khi đổi từ khóa
    }, [searchTerm])

    const formatDate = (dateString?: string | null) =>
        dateString
            ? new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—"

    const getStatusBadge = (status: ReturnStatus) => {
        const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
        switch (status) {
            case "Requested":
                return (
                    <span className={`${base} bg-yellow-100 text-yellow-800 border-yellow-200`}>
                        <Clock className="w-3 h-3 mr-1" />
                        Đã yêu cầu
                    </span>
                )
            case "Approved":
            case "Resolved":
                return (
                    <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã duyệt
                    </span>
                )
            case "Rejected":
                return (
                    <span className={`${base} bg-red-100 text-red-800 border-red-200`}>
                        <XCircle className="w-3 h-3 mr-1" />
                        Đã từ chối
                    </span>
                )
            default:
                return <span className={`${base} bg-gray-100 text-gray-800 border-gray-200`}>{status}</span>
        }
    }

    // ====== Counts for tabs ======
    const statusCounts = useMemo(() => {
        const counts = {
            all: allReports.length,
            Requested: 0,
            Approved: 0,
            Rejected: 0,
        }
        for (const r of allReports) {
            if (r.return_status === "Requested") counts.Requested++
            else if (r.return_status === "Approved") counts.Approved++
            else if (r.return_status === "Rejected") counts.Rejected++
        }
        return counts
    }, [allReports])

    // Search
    const filteredReports = currentReports.filter((r) => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return true
        return (
            r.user?.name?.toLowerCase().includes(q) ||
            r.order_id?.toString().includes(q) ||
            (r.reason || "").toLowerCase().includes(q) ||
            r.shop?.name?.toLowerCase().includes(q)
        )
    })

    // Pagination data
    const totalItems = filteredReports.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIdx = (page - 1) * pageSize
    const endIdx = Math.min(startIdx + pageSize, totalItems)
    const pageData = filteredReports.slice(startIdx, endIdx)

    const canRowAction = (s?: ReturnStatus) => !(s === "Approved" || s === "Rejected")

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Popup */}
            {showPopup && (
                <div
                    className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 ${popupType === "success" ? "bg-green-500 text-white" : popupType === "error" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"
                        }`}
                >
                    {popupType === "success" ? <CheckCircle className="w-4 h-4" /> : popupType === "error" ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{popupMessage}</span>
                    <button onClick={() => setShowPopup(false)} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Yêu Cầu Hoàn Hàng</h1>
                        <p className="text-sm text-gray-600 mt-1">Xem và xử lý các yêu cầu hoàn/trả từ khách hàng</p>
                    </div>
                    <button
                        onClick={fetchRefundReports}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Làm mới dữ liệu</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-3">
                        <div className="flex flex-wrap gap-2">
                            {tabConfigs.map((t) => {
                                const isActive = statusFilter === t.key
                                const cls = colorClasses[t.color]

                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => setStatusFilter(t.key)}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors
          ${isActive ? cls.active : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                                    >
                                        <span>{t.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? cls.badgeActive : cls.badge}`}>
                                            {t.count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>


                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, khách hàng, lý do (vẫn có thể tìm theo tên shop)…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TABLE LIST */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sản phẩm</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Khách hàng</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lý do</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Xác nhận</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pageData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="h-12 w-12 text-gray-400 mb-3" />
                                                <h3 className="text-sm font-medium text-gray-600 mb-1">Không có yêu cầu hoàn nào</h3>
                                                <p className="text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pageData.map((r) => (
                                        <tr key={`${r.order_id}-${r.report_id ?? ""}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                                        {r.product_image?.[0] ? (
                                                            <img className="h-10 w-10 rounded-lg object-cover border border-gray-200" src={formatImageUrl(r.product_image[0])} alt="Product" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                <Package className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900">#{r.order_id}</div>
                                                        <div className="text-xs text-gray-500">Yêu cầu hoàn</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{r.user?.name || "N/A"}</div>
                                                        <div className="text-xs text-gray-500">ID: {r.user?.id || "N/A"}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">{r.reason || "—"}</div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(r.return_status)}</td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                    {formatDate(r.return_confirmed_at)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                                    <button
                                                        onClick={() => {
                                                            if (!r.order_id) {
                                                                showNotification("Bản ghi này thiếu order_id", "error")
                                                                return
                                                            }
                                                            fetchRefundReportDetail(r.order_id)
                                                        }}
                                                        disabled={detailLoading}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Chi tiết
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-medium">{totalItems === 0 ? 0 : startIdx + 1}</span>–
                            <span className="font-medium">{endIdx}</span> trên <span className="font-medium">{totalItems}</span> kết quả
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-md border bg-white disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => {
                                    const near = Math.abs(p - page) <= 1
                                    const edge = p === 1 || p === totalPages
                                    return near || edge || totalPages <= 7
                                })
                                .reduce<number[]>((acc, p, idx, arr) => {
                                    if (idx === 0) return [p]
                                    const prev = arr[idx - 1]
                                    if (p - prev > 1) acc.push(-1)
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((p, idx) =>
                                    p === -1 ? (
                                        <span key={`gap-${idx}`} className="px-2">
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-3 py-1.5 text-sm rounded-md border ${page === p ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
                                        >
                                            {p}
                                        </button>
                                    ),
                                )}

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-sm rounded-md border bg-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Detail Modal */}
                {showDetailModal && selectedReport && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-xl">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Chi Tiết Yêu Cầu Hoàn</h3>
                                                <p className="text-blue-100 text-sm">Mã đơn hàng: #{selectedReport.order_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-6">
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            {/* Order Info */}
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <div className="flex items-center mb-3">
                                                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Thông Tin Đơn Hàng</h4>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                                        <span className="font-medium">#{selectedReport.order_id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Ngày tạo:</span>
                                                        <span className="font-medium">{formatDate(selectedReport.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                <div className="flex items-center mb-3">
                                                    <User className="h-5 w-5 text-green-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Thông Tin Khách Hàng</h4>
                                                </div>
                                                <div className="flex items-center mb-3">
                                                    <img
                                                        src={selectedReport.user?.avatar ? formatImageUrl(selectedReport.user.avatar) : "/placeholder.svg?height=32&width=32"}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full border-2 border-green-200 mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{selectedReport.user?.name || "N/A"}</div>
                                                        <div className="text-xs text-gray-500">ID: {selectedReport.user?.id}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span className="truncate">{selectedReport.user?.email || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span>{selectedReport.user?.phone || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Complaint Reason */}
                                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                            <div className="flex items-center mb-3">
                                                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                                                <h4 className="font-semibold text-gray-900">Lý Do Hoàn/Trả</h4>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-orange-200">
                                                <div className="text-sm text-gray-600 mb-1">Lý do khách hàng cung cấp:</div>
                                                <p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedReport.report_reason || "—"}</p>
                                            </div>
                                        </div>

                                        {/* Product Images */}
                                        {Array.isArray(selectedReport.product_images) && selectedReport.product_images[0]?.image?.length > 0 && (
                                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                                <div className="flex items-center mb-3">
                                                    <Package className="h-5 w-5 text-indigo-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Hình Ảnh Sản Phẩm</h4>
                                                </div>
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                    {selectedReport.product_images[0].image.map((img: string, idx: number) => (
                                                        <img
                                                            key={idx}
                                                            src={formatImageUrl(img)}
                                                            alt={`Product ${idx + 1}`}
                                                            className="w-full h-20 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Evidence Photos */}
                                        {Array.isArray(selectedReport.photos) && selectedReport.photos.length > 0 && (
                                            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                                                <div className="flex items-center mb-3">
                                                    <FileText className="h-5 w-5 text-teal-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Ảnh Minh Chứng</h4>
                                                </div>
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                    {selectedReport.photos.map((img: string, idx: number) => (
                                                        <img
                                                            key={idx}
                                                            src={formatImageUrl(img)}
                                                            alt={`Evidence ${idx + 1}`}
                                                            className="w-full h-20 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Note (nếu có) */}
                                        {selectedReport.admin_note && (
                                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                                <div className="flex items-center mb-3">
                                                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Ghi Chú Admin</h4>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-purple-200">
                                                    <p className="text-sm text-gray-900">{selectedReport.admin_note}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer actions */}
                                {["Pending", "Requested", "Processing"].includes(selectedReport.status) && (
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => openRejectModalFromDetail(selectedReport.order_id)}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Từ chối</span>
                                            </button>

                                            <button
                                                onClick={() => approveRefundReport(selectedReport.order_id)}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                            >
                                                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                <span>Duyệt</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-70 overflow-y-auto">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
                                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <XCircle className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Từ Chối Yêu Cầu Hoàn</h3>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowRejectModal(false)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lý do từ chối <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Nhập lý do từ chối…"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">{rejectionReason.length}/500 ký tự</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú admin (tùy chọn)</label>
                                        <textarea
                                            value={rejectionNote}
                                            onChange={(e) => setRejectionNote(e.target.value)}
                                            placeholder="Ghi chú thêm…"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                            rows={3}
                                            maxLength={300}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setShowRejectModal(false)}
                                            disabled={actionLoading}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={confirmRejectRefundReport}
                                            disabled={actionLoading || !rejectionReason.trim()}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                        >
                                            {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            <span>Xác nhận từ chối</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
